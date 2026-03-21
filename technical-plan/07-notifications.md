# 07 — Notifications & Deep Linking

## Dependencies

| Package | Purpose |
|---|---|
| `expo-notifications` | Push notification handling |
| `expo-device` | Check if running on physical device (push tokens require real device) |

## App Configuration

Add to `app.json` plugins array:

```json
["expo-notifications", {
  "icon": "./assets/images/notification-icon.png",
  "color": "#ffffff"
}]
```

Add to `app.json` iOS/Android sections (required for push in production):

```json
{
  "ios": {
    "bundleIdentifier": "com.sevvr.app"
  },
  "android": {
    "package": "com.sevvr.app",
    "googleServicesFile": "./google-services.json"
  }
}
```

---

## Notification Provider

**File:** `providers/notification-provider.tsx`

### Responsibilities

1. Request push notification permission on first launch
2. Obtain Expo push token
3. Sync token to `profiles.push_token` in Supabase
4. Register notification response handler for deep link routing

### Lifecycle

```typescript
// On mount:
1. Check if physical device (expo-device)
2. Request permissions: Notifications.requestPermissionsAsync()
3. Get token: Notifications.getExpoPushTokenAsync({ projectId })
4. Store token: UPDATE profiles SET push_token = $token WHERE id = auth.uid()
5. Set notification handler (foreground behavior):
   Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowAlert: true,
       shouldPlaySound: true,
       shouldSetBadge: false,
     }),
   });
6. Register response listener for when user taps a notification
```

### Notification Response Handler

When a user taps a notification, route to the appropriate screen based on `notification.request.content.data.type`:

| `data.type` | Route | Params |
|---|---|---|
| `challenge_invite` | `/(modals)/challenge-invite` | `{ challengeId }` |
| `challenge_accepted` | `/(tabs)/social` | — |
| `challenge_result` | `/(modals)/challenge-result` | `{ challengeId }` |
| `streak_reminder` | `/(tabs)` | — (home screen) |

```typescript
const responseListener = Notifications.addNotificationResponseReceivedListener(
  (response) => {
    const data = response.notification.request.content.data;
    switch (data.type) {
      case 'challenge_invite':
        router.push(`/(modals)/challenge-invite?id=${data.challengeId}`);
        break;
      case 'challenge_result':
        router.push(`/(modals)/challenge-result?id=${data.challengeId}`);
        break;
      case 'streak_reminder':
        router.push('/(tabs)');
        break;
    }
  }
);
```

---

## Notification Service

**File:** `lib/notification-service.ts`

Client-side functions:

```typescript
async function registerPushToken(userId: string, token: string): Promise<void>
// UPDATE profiles SET push_token = $token WHERE id = $userId

async function clearPushToken(userId: string): Promise<void>
// UPDATE profiles SET push_token = null WHERE id = $userId
// Called on sign out
```

Push notification sending is server-side only (Supabase Edge Functions).

---

## Supabase Edge Functions

### `send-push` — Generic Push Sender

**File:** `supabase/functions/send-push/index.ts`

Called by database webhooks/triggers. Accepts:

```typescript
type PushPayload = {
  pushToken: string;
  title: string;
  body: string;
  data: {
    type: string;           // 'challenge_invite' | 'challenge_result' | etc.
    challengeId?: string;
  };
};
```

Implementation:

```typescript
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  const { pushToken, title, body, data } = await req.json();

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      to: pushToken,
      title,
      body,
      data,
      sound: 'default',
    }),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### `streak-reminder` — Cron Job

**File:** `supabase/functions/streak-reminder/index.ts`

Runs on a cron schedule (every hour, configured in Supabase dashboard).

**Logic:**

1. Get current UTC hour
2. Query users who:
   - Have a `push_token` (notifications enabled)
   - Have `streak_reminder_hour` matching the current hour
   - Have `streaks.last_session_date = CURRENT_DATE - 1` (had an active streak yesterday but haven't severed today)
   - Have `streaks.current_streak > 0`
3. For each matching user, call the Expo Push API:

```typescript
{
  to: user.push_token,
  title: "Your streak is at risk!",
  body: `Your ${user.current_streak}-day streak ends tonight. Sever now to keep it alive!`,
  data: { type: 'streak_reminder' },
}
```

**Note on timezones:** `streak_reminder_hour` is stored as a simple hour (0-23). For v1, this is treated as the user's local hour at the time they set it. A more robust approach would store timezone offset, but this is acceptable for MVP.

---

## Database Triggers for Push Notifications

### Challenge Created Trigger

When a new challenge is inserted with a non-null `challenged_id`, notify the challenged user:

```sql
CREATE OR REPLACE FUNCTION notify_challenge_created()
RETURNS TRIGGER AS $$
DECLARE
  v_challenger_name text;
  v_push_token text;
BEGIN
  -- Get challenger's username
  SELECT username INTO v_challenger_name
  FROM profiles WHERE id = NEW.challenger_id;

  -- Get challenged user's push token
  SELECT push_token INTO v_push_token
  FROM profiles WHERE id = NEW.challenged_id;

  IF v_push_token IS NOT NULL THEN
    -- Call Edge Function via pg_net (Supabase HTTP extension)
    PERFORM net.http_post(
      url := current_setting('app.settings.edge_function_url') || '/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'pushToken', v_push_token,
        'title', 'Challenge Received!',
        'body', '@' || v_challenger_name || ' challenged you to sever!',
        'data', jsonb_build_object('type', 'challenge_invite', 'challengeId', NEW.id::text)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_challenge_created
  AFTER INSERT ON challenges
  FOR EACH ROW
  WHEN (NEW.challenged_id IS NOT NULL)
  EXECUTE FUNCTION notify_challenge_created();
```

### Challenge Completed Trigger

When a challenge status changes to 'completed', notify both participants:

```sql
CREATE OR REPLACE FUNCTION notify_challenge_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_name text;
  v_loser_id uuid;
  v_winner_token text;
  v_loser_token text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT username INTO v_winner_name FROM profiles WHERE id = NEW.winner_id;

    -- Determine loser
    v_loser_id := CASE
      WHEN NEW.winner_id = NEW.challenger_id THEN NEW.challenged_id
      ELSE NEW.challenger_id
    END;

    -- Get push tokens
    SELECT push_token INTO v_winner_token FROM profiles WHERE id = NEW.winner_id;
    SELECT push_token INTO v_loser_token FROM profiles WHERE id = v_loser_id;

    -- Notify winner
    IF v_winner_token IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url') || '/send-push',
        headers := jsonb_build_object('Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
        body := jsonb_build_object(
          'pushToken', v_winner_token,
          'title', 'You won!',
          'body', 'You won the sever challenge!',
          'data', jsonb_build_object('type', 'challenge_result', 'challengeId', NEW.id::text))
      );
    END IF;

    -- Notify loser
    IF v_loser_token IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url') || '/send-push',
        headers := jsonb_build_object('Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
        body := jsonb_build_object(
          'pushToken', v_loser_token,
          'title', 'Challenge Complete',
          'body', '@' || v_winner_name || ' beat you this time. Rematch?',
          'data', jsonb_build_object('type', 'challenge_result', 'challengeId', NEW.id::text))
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_challenge_completed
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION notify_challenge_completed();
```

---

## Deep Linking Configuration

The app already has `"scheme": "sevvr"` in `app.json`. This enables:

- `sevvr://challenge/{invite_token}` → handled by `app/challenge/[id].tsx`
- Universal links (for web → app): requires domain verification with Apple/Google (production setup, not needed for development)

### Testing Deep Links

Development:
```bash
# iOS Simulator
npx uri-scheme open sevvr://challenge/abc123 --ios

# Android Emulator
adb shell am start -a android.intent.action.VIEW -d "sevvr://challenge/abc123"
```
