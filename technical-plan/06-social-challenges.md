# 06 — Social System & Challenges

## Friends System

### Friend Request Flow

```
User A searches for @bob → sends request → PENDING
                                              │
                              User B accepts ──┤── User B declines
                                   │                    │
                               ACCEPTED              DECLINED
                                   │
                          Both appear in each
                          other's friend lists
```

### Social Service

**File:** `lib/social-service.ts`

#### searchUsers

```typescript
async function searchUsers(query: string): Promise<Profile[]>
```

```sql
SELECT id, username, display_name, avatar_url
FROM profiles
WHERE username ILIKE '%' || $query || '%'
  AND id != auth.uid()
  AND deleted_at IS NULL
LIMIT 20
```

Called with debounce (500ms) from the search input on the Social screen's Friends tab.

#### sendFriendRequest

```typescript
async function sendFriendRequest(addresseeId: string): Promise<void>
```

```sql
INSERT INTO friendships (requester_id, addressee_id, status)
VALUES (auth.uid(), $addresseeId, 'pending')
```

Fails silently if a friendship already exists (UNIQUE constraint). The UI should check for existing friendship before showing the "Add" button.

#### respondToRequest

```typescript
async function respondToRequest(
  friendshipId: string,
  accept: boolean
): Promise<void>
```

```sql
UPDATE friendships
SET status = $accept ? 'accepted' : 'declined',
    updated_at = now()
WHERE id = $friendshipId
  AND addressee_id = auth.uid()
```

RLS ensures only the addressee can accept/decline.

#### getFriends

```typescript
async function getFriends(userId: string): Promise<Profile[]>
```

Queries friendships where `status = 'accepted'` and joins with profiles. Returns the *other* user's profile (not the querying user).

```sql
SELECT p.id, p.username, p.display_name, p.avatar_url
FROM friendships f
JOIN profiles p ON p.id = CASE
  WHEN f.requester_id = $userId THEN f.addressee_id
  ELSE f.requester_id
END
WHERE f.status = 'accepted'
  AND (f.requester_id = $userId OR f.addressee_id = $userId)
ORDER BY p.username
```

#### getPendingRequests

```typescript
async function getPendingRequests(userId: string): Promise<{
  id: string;           // friendship ID
  requester: Profile;   // who sent it
  createdAt: string;
}[]>
```

```sql
SELECT f.id, f.created_at, p.id, p.username, p.display_name, p.avatar_url
FROM friendships f
JOIN profiles p ON p.id = f.requester_id
WHERE f.addressee_id = $userId AND f.status = 'pending'
ORDER BY f.created_at DESC
```

#### removeFriend

```typescript
async function removeFriend(friendshipId: string): Promise<void>
```

```sql
DELETE FROM friendships WHERE id = $friendshipId
```

RLS allows either party to delete.

---

## Leaderboards

### Leaderboard Service

**File:** `lib/leaderboard-service.ts`

#### getFriendsLeaderboard

```typescript
async function getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]>
```

Calls the `get_friends_leaderboard` RPC function (see `01-database-schema.md`). Returns up to 50 entries ranked by weekly sever time. The current user is always included.

#### getGlobalLeaderboard

```typescript
async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]>
```

Calls the `get_global_leaderboard` RPC function. Returns top 100.

### LeaderboardEntry Type

```typescript
type LeaderboardEntry = {
  rank: number;            // Computed client-side from array index + 1
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  weeklySeconds: number;
  isCurrentUser: boolean;  // Computed client-side
};
```

### Weekly Reset

Leaderboards automatically reset because the database functions filter by `DATE_TRUNC('week', CURRENT_DATE)`. No cron job needed — the query scope handles it.

### LeaderboardRow Component

**File:** `components/leaderboard-row.tsx`

```typescript
type LeaderboardRowProps = {
  entry: LeaderboardEntry;
};
```

**Layout:**
```
 1.  [avatar]  @alice       4h 30m
 2.  [avatar]  @you  ←      3h 12m    ← highlighted row
 3.  [avatar]  @bob         2h 45m
```

- Rank number on left (1st/2nd/3rd get medal icons: gold/silver/bronze)
- Avatar circle (or default initial)
- Username
- Formatted weekly duration on right
- Current user's row has a distinct background color (tint color at low opacity)

---

## Challenge System

### Challenge Lifecycle

```
Challenger creates ──→ PENDING ──→ Challenged accepts ──→ ACCEPTED
                         │                                    │
                         │ 24h expires                        │ Either starts session
                         ↓                                    ↓
                      EXPIRED                              ACTIVE
                                                              │
                         Challenged declines ──→ DECLINED     │ Both sessions end
                                                              ↓
                                                          COMPLETED
                                                         (winner set)
```

### Challenge Service

**File:** `lib/challenge-service.ts`

#### createChallenge

```typescript
async function createChallenge(
  challengedId: string | null  // null for SMS invite to non-user
): Promise<Challenge>
```

```sql
INSERT INTO challenges (
  challenger_id, challenged_id, status, invite_token, expires_at
) VALUES (
  auth.uid(), $challengedId, 'pending', $nanoid, now() + interval '24 hours'
) RETURNING *
```

`invite_token` is generated client-side using `nanoid` (lightweight unique ID generator — add as dependency).

#### acceptChallenge

```typescript
async function acceptChallenge(challengeId: string): Promise<void>
```

```sql
UPDATE challenges SET status = 'accepted', updated_at = now()
WHERE id = $challengeId AND challenged_id = auth.uid()
```

#### declineChallenge

```typescript
async function declineChallenge(challengeId: string): Promise<void>
```

```sql
UPDATE challenges SET status = 'declined' WHERE id = $challengeId
```

#### recordChallengeDuration

```typescript
async function recordChallengeDuration(
  challengeId: string,
  userId: string,
  durationSeconds: number
): Promise<void>
```

1. Determine if user is challenger or challenged
2. Update the appropriate duration column:
   ```sql
   UPDATE challenges
   SET challenger_duration = $duration  -- or challenged_duration
   WHERE id = $challengeId
   ```
3. If BOTH durations are now set, call `resolve_challenge` RPC:
   ```typescript
   await supabase.rpc('resolve_challenge', { p_challenge_id: challengeId });
   ```

#### getActiveChallenges

```typescript
async function getActiveChallenges(userId: string): Promise<Challenge[]>
```

```sql
SELECT * FROM challenges
WHERE (challenger_id = $userId OR challenged_id = $userId)
  AND status IN ('pending', 'accepted', 'active')
ORDER BY created_at DESC
```

#### getChallengeByToken

```typescript
async function getChallengeByToken(token: string): Promise<Challenge | null>
```

```sql
SELECT * FROM challenges WHERE invite_token = $token
```

Used by the deep link handler (`app/challenge/[id].tsx`).

---

## Supabase Realtime for Live Challenges

### useRealtimeChallenge Hook

**File:** `hooks/use-realtime-challenge.ts`

```typescript
function useRealtimeChallenge(challengeId: string | null): {
  challenge: Challenge | null;
  opponentStatus: 'waiting' | 'active' | 'completed';
  opponentDuration: number | null;
}
```

### Implementation

When a challenge is `active`, subscribe to real-time changes:

```typescript
useEffect(() => {
  if (!challengeId) return;

  const channel = supabase
    .channel(`challenge:${challengeId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'challenges',
      filter: `id=eq.${challengeId}`,
    }, (payload) => {
      const updated = payload.new as Challenge;
      setChallenge(updated);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [challengeId]);
```

This gives near-instant updates when:
- Opponent starts their session (status changes to 'active')
- Opponent ends their session (their duration column is set)
- Challenge resolves (status → 'completed', winner_id set)

### Reconnection

Supabase Realtime handles reconnection automatically. If the connection drops (e.g., user loses WiFi briefly), the SDK reconnects and replays missed events.

---

## SMS Challenge Invite

### Flow

1. User taps "Challenge" and selects "Invite via SMS" (for non-users)
2. `createChallenge(null)` creates a challenge with no `challenged_id`
3. Build the invite message:
   ```
   I challenged you to put your phone down! Download sevvr and see if you can beat me: https://sevvr.app/challenge/{invite_token}
   ```
4. Open native SMS composer via `Linking.openURL`:
   ```typescript
   const message = encodeURIComponent(inviteText);
   Linking.openURL(`sms:?body=${message}`);
   ```
   Or use `expo-sms` if more control is needed.
5. When the invited user taps the link:
   - If they have the app: deep link opens `app/challenge/[id].tsx`
   - If they don't: web redirect to app store, with challenge token preserved in the URL

### Deep Link Handling

The `app/challenge/[id].tsx` route:
1. Reads `invite_token` from route params
2. Calls `getChallengeByToken(token)`
3. If user is authenticated and challenge is valid: show accept UI
4. If user is not authenticated: redirect to signup, store token, redirect back after auth

---

## Challenge Card Component

**File:** `components/challenge-card.tsx`

```typescript
type ChallengeCardProps = {
  challenge: Challenge;
  currentUserId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onStart?: () => void;
};
```

Displays differently based on status:

| Status | Display |
|---|---|
| `pending` (you're challenged) | Opponent name + Accept/Decline buttons |
| `pending` (you sent) | "Waiting for @opponent..." |
| `accepted` | "Ready! Start your session" button |
| `active` | Live status of both parties |
| `completed` | Winner/loser result |

---

## Friend Request Card Component

**File:** `components/friend-request-card.tsx`

```typescript
type FriendRequestCardProps = {
  request: {
    id: string;
    requester: Profile;
    createdAt: string;
  };
  onAccept: () => void;
  onDecline: () => void;
};
```

**Layout:**
```
[avatar]  @charlie wants to be friends    [✓] [✗]
          2 hours ago
```
