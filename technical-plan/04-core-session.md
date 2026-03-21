# 04 — Core Session Mechanics

The sever session is the heart of the app. This document covers the button interaction, countdown, phone lock detection, movement detection, and session persistence.

---

## Session State Machine

Managed in `providers/session-provider.tsx` via `useReducer`.

```
        press          fill complete       countdown=0        unlock/movement
IDLE ────────→ HOLDING ──────────→ COUNTDOWN ──────────→ ACTIVE ──────────→ ENDED
  ↑              │                    │                                       │
  │              │ release early      │ cancel tap                            │
  │              ↓                    ↓                                       │
  └──────── CANCELLED ←──────── CANCELLED                                    │
  └──────────────────────────────────────────────────────────────────────────┘
                                                              dismiss modal
```

### State Definitions

| State | Description | UI |
|---|---|---|
| `IDLE` | No active session, button ready | SeverButton visible |
| `HOLDING` | User pressing button, progress animating | Button filling 0→100% |
| `COUNTDOWN` | Button filled, counting 5→0 | CountdownOverlay |
| `ACTIVE` | Session running, phone should be locked | "Session active" screen (if user opens app) |
| `ENDED` | Session complete, results ready | Navigate to Life Unlocked modal |
| `CANCELLED` | Transient state, immediately returns to IDLE | — |

### Context Shape

```typescript
type SessionState = 'idle' | 'holding' | 'countdown' | 'active' | 'ended' | 'cancelled';

type SessionContextType = {
  state: SessionState;
  activeSession: {
    id: string;
    startedAt: Date;
    elapsedSeconds: number;
  } | null;
  lastCompletedSession: {
    id: string;
    durationSeconds: number;
    missedContent: MissedContent;
    endedReason: string;
  } | null;
  dispatch: (action: SessionAction) => void;
};
```

---

## SeverButton Component

**File:** `components/sever-button.tsx`

### Props

```typescript
type SeverButtonProps = {
  onFillComplete: () => void;  // Called when 3-second hold completes
  disabled: boolean;           // Disabled during countdown/active states
};
```

### Implementation

- Large circular button (200x200 or responsive to screen width)
- Uses `Pressable` with `onPressIn` / `onPressOut`
- `react-native-reanimated` shared value `progress` animates from 0 to 1 over 3000ms
- Visual: circular fill using an animated `View` with `borderRadius` and scaling, or an SVG circle with animated `strokeDashoffset`
- `expo-haptics` triggers:
  - `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on press start
  - Continuous light ticks during fill (every 500ms)
  - `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` when fill reaches 100%
- If released before 3 seconds: animate `progress` back to 0 (spring animation, ~200ms)
- Button text: "SEVER" centered, changes opacity based on fill state

### Animation Details

```typescript
// In component body
const progress = useSharedValue(0);

const onPressIn = () => {
  progress.value = withTiming(1, { duration: 3000, easing: Easing.linear });
};

const onPressOut = () => {
  if (progress.value < 1) {
    progress.value = withSpring(0, { damping: 15 });
  }
};

// Detect fill completion
useAnimatedReaction(
  () => progress.value,
  (current, previous) => {
    if (current >= 1 && (previous ?? 0) < 1) {
      runOnJS(onFillComplete)();
      runOnJS(triggerHeavyHaptic)();
    }
  }
);
```

---

## Countdown Overlay

**File:** `components/countdown-overlay.tsx`

### Props

```typescript
type CountdownOverlayProps = {
  onComplete: () => void;   // Called when countdown reaches 0
  onCancel: () => void;     // Called when user taps cancel
};
```

### Behavior

- Full-screen overlay (covers tab bar)
- Large number in center: 5, 4, 3, 2, 1
- Animated scale pulse on each tick (scale 1.2 → 1.0)
- "Lock your phone now" text below number
- Cancel button (X in top-right corner or "Cancel" at bottom)
- Each tick: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
- At 0: `Haptics.notificationAsync(NotificationFeedbackType.Success)`

### useCountdown Hook

**File:** `hooks/use-countdown.ts`

```typescript
function useCountdown(initialSeconds: number): {
  secondsLeft: number;
  isRunning: boolean;
  start: () => void;
  cancel: () => void;
}
```

Uses `setInterval` (1000ms). Calls `onComplete` when reaching 0. Cleans up interval on unmount or cancel.

---

## Phone Lock/Unlock Detection

**File:** `hooks/use-app-state.ts`

### How It Works

React Native's `AppState` API reports:
- `active` — app is in foreground
- `background` — app is in background (phone locked, or user switched apps)
- `inactive` — iOS only, transitional state (e.g., pulling down notification center)

### Hook

```typescript
function useAppState(): {
  appState: AppStateStatus;
  previousState: AppStateStatus | null;
}
```

### Session Integration in SessionProvider

The `SessionProvider` subscribes to AppState changes:

1. **Countdown → Active transition:**
   When state is `countdown` and `appState` changes to `background`, the user has locked their phone. Record `started_at` timestamp, create session in Supabase, and transition to `active`.

2. **Active → Ended transition:**
   When state is `active` and `appState` changes to `active` (from background), the user has unlocked. Calculate duration, end the session, and transition to `ended`.

3. **Edge case — app already in foreground during countdown:**
   If countdown reaches 0 and user hasn't locked phone yet, show a prompt: "Lock your phone to start your session." Stay in countdown-complete state until `appState` goes to `background`.

4. **Edge case — user opens another app (not unlock):**
   This also triggers `background → active`. The session still ends — we can't distinguish between unlock and app switch at the React Native level. This is an acceptable tradeoff documented in the RUP risk section.

---

## Movement Detection (Anti-Cheat)

**File:** `hooks/use-accelerometer.ts`

### Purpose

Prevent users from gaming the system by locking their phone and then shaking/moving it (indicating they're still actively holding the phone rather than setting it down).

### Hook

```typescript
function useAccelerometer(options: {
  enabled: boolean;           // Only active during ACTIVE session state
  magnitudeThreshold: number; // e.g., 1.8 (gravity is ~1.0)
  sustainedMs: number;        // e.g., 3000 (3 seconds above threshold)
  onMovementDetected: () => void;
}): { currentMagnitude: number }
```

### Algorithm

1. Set accelerometer update interval to 500ms (battery-friendly)
2. On each reading, compute magnitude: `Math.sqrt(x*x + y*y + z*z)`
3. Baseline is ~1.0g (gravity). Values above `magnitudeThreshold` indicate movement.
4. Track consecutive readings above threshold. If sustained for `sustainedMs`, fire `onMovementDetected`.
5. A single spike (dropping the phone on a couch, vibration from a notification) does NOT trigger — must be sustained.
6. `onMovementDetected` calls `endSession(sessionId, 'movement')` in the SessionProvider.

### Configuration Constants

```typescript
const ACCELEROMETER_CONFIG = {
  updateIntervalMs: 500,
  magnitudeThreshold: 1.8,  // ~0.8g above gravity baseline
  sustainedMs: 3000,        // 3 seconds of sustained movement
};
```

---

## Session Persistence (App Kill Recovery)

The app may be killed by the OS during an active session. To handle this:

### On Session Start (ACTIVE state entered)

Store in AsyncStorage:
```typescript
await AsyncStorage.setItem('active_session', JSON.stringify({
  sessionId: session.id,
  startedAt: session.startedAt.toISOString(),
}));
```

### On Session End

```typescript
await AsyncStorage.removeItem('active_session');
```

### On App Launch (SessionProvider mount)

```typescript
const stored = await AsyncStorage.getItem('active_session');
if (stored) {
  const { sessionId, startedAt } = JSON.parse(stored);
  // Check if session still exists and is active in Supabase
  const session = await sessionService.getActiveSession(userId);
  if (session) {
    // Restore active state — session will end on next background→active transition
    dispatch({ type: 'RESTORE_SESSION', session });
  } else {
    // Session was already ended (e.g., by a database function)
    await AsyncStorage.removeItem('active_session');
  }
}
```

---

## Session Service

**File:** `lib/session-service.ts`

```typescript
async function startSession(userId: string): Promise<Session>
// INSERT INTO sessions (user_id, started_at) VALUES (userId, now())
// RETURNING *

async function endSession(
  sessionId: string,
  reason: 'unlock' | 'movement' | 'cancel'
): Promise<Session>
// 1. UPDATE sessions SET
//      ended_at = now(),
//      duration_seconds = EXTRACT(EPOCH FROM now() - started_at)::integer,
//      ended_reason = reason,
//      missed_content = calculateMissedContent(duration_seconds)
//    WHERE id = sessionId AND ended_at IS NULL
//    RETURNING *
// 2. Call supabase.rpc('update_streak', { p_user_id: session.user_id })
// 3. If session.challenge_id is set, call challengeService.recordDuration()

async function getActiveSession(userId: string): Promise<Session | null>
// SELECT * FROM sessions
// WHERE user_id = userId AND ended_at IS NULL
// LIMIT 1

async function cancelSession(sessionId: string): Promise<void>
// DELETE FROM sessions WHERE id = sessionId AND ended_at IS NULL
```

### Missed Content Calculation

**File:** `constants/missed-content.ts`

```typescript
export const CONTENT_RATES_PER_HOUR = {
  tweets: 300,
  tiktoks: 34,
  instagram_posts: 42,
  youtube_videos: 12,
};

export function calculateMissedContent(durationSeconds: number): MissedContent {
  const hours = durationSeconds / 3600;
  return {
    tweets: Math.round(CONTENT_RATES_PER_HOUR.tweets * hours),
    tiktoks: Math.round(CONTENT_RATES_PER_HOUR.tiktoks * hours),
    instagram_posts: Math.round(CONTENT_RATES_PER_HOUR.instagram_posts * hours),
    youtube_videos: Math.round(CONTENT_RATES_PER_HOUR.youtube_videos * hours),
  };
}
```

These are estimates based on published platform averages — display-only, not tied to actual user data.

---

## Life Unlocked Modal

**File:** `app/(modals)/life-unlocked.tsx`

### Flow

1. Session ends → `SessionProvider` transitions to `ENDED` state
2. `SessionProvider` sets `lastCompletedSession` with duration + missed content
3. Home screen detects `state === 'ended'` and calls `router.push('/(modals)/life-unlocked')`
4. Modal reads `lastCompletedSession` from `useSession()` hook
5. User taps "Done" → dismiss modal, `SessionProvider` transitions back to `IDLE`
6. User taps "Share" → `expo-sharing` generates a share card image or text

### Share Content

Pre-formatted text for sharing:
```
I just severed for 1h 23m and missed 423 tweets, 47 TikToks, and 58 Instagram posts.

Can you beat me? sevvr.app
```
