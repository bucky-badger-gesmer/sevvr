# 08 — Implementation Phases

## Phase Overview

| Phase | Name | Goal | Duration |
|---|---|---|---|
| 1 | Foundation | Authenticated app shell with 4-tab navigation | Week 1-2 |
| 2 | Core Session Loop | User can sever and see results | Week 3-4 |
| 3 | Stats & History | User can review their progress | Week 5 |
| 4 | Social Layer | Friends and leaderboards | Week 6-7 |
| 5 | Challenges | Head-to-head with real-time sync | Week 8-9 |
| 6 | Notifications & Polish | Push notifications, reminders, production readiness | Week 10 |

---

## Phase 1: Foundation

**Goal:** Authenticated app shell with navigation

**Depends on:** Supabase project created, Expo dev environment working

### Tasks

1. **Install dependencies**
   - `@supabase/supabase-js`
   - `@react-native-async-storage/async-storage`

2. **Environment setup**
   - Create `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Add `.env` to `.gitignore`

3. **Supabase database setup**
   - Create `profiles` table with RLS
   - Create `streaks` table with RLS
   - Create `challenge_records` table with RLS
   - Create `handle_new_user` trigger on `auth.users`

4. **Create `lib/supabase.ts`** — client initialization

5. **Create `lib/auth-service.ts`** — signUp, signIn, signOut, updateEmail, deleteAccount

6. **Create `providers/auth-provider.tsx`** — AuthContext, session restore, auth state listener

7. **Create `hooks/use-auth.ts`** — context accessor

8. **Create auth screens**
   - `app/(auth)/_layout.tsx` — Stack navigator
   - `app/(auth)/login.tsx`
   - `app/(auth)/signup.tsx`
   - `app/(auth)/forgot-password.tsx`

9. **Modify `app/_layout.tsx`**
   - Wrap in AuthProvider
   - Add auth redirect logic (useSegments + useRouter pattern)
   - Register (modals) routes in Stack

10. **Modify `app/(tabs)/_layout.tsx`**
    - Change from 2 tabs to 4 tabs (Sever, Stats, Social, Profile)
    - Add new icon mappings to `components/ui/icon-symbol.tsx`

11. **Create placeholder screens**
    - `app/(tabs)/stats.tsx` — "Stats coming soon"
    - `app/(tabs)/social.tsx` — "Social coming soon"
    - `app/(tabs)/profile.tsx` — basic profile with logout button

12. **Extend `constants/theme.ts`** — add sevvr brand colors

13. **Create `types/database.ts`** — TypeScript types matching Supabase schema

14. **Clean up template**
    - Remove `app/(tabs)/explore.tsx`
    - Remove `components/hello-wave.tsx`
    - Remove `app/modal.tsx`
    - Update `app/(tabs)/index.tsx` to placeholder home screen

### Deliverable
User can sign up, log in, see 4-tab navigation, and log out. Auth persists across app restarts.

---

## Phase 2: Core Session Loop

**Goal:** User can sever and see results

**Depends on:** Phase 1 complete (auth working)

### Tasks

1. **Install dependencies**
   - `expo-sensors`

2. **Database setup**
   - Create `sessions` table with RLS and indexes
   - Create `daily_session_totals` view
   - Create `user_stats` view
   - Create `update_streak` database function

3. **Create `providers/session-provider.tsx`**
   - Session state machine (idle → holding → countdown → active → ended)
   - AppState listener integration
   - AsyncStorage persistence for app kill recovery

4. **Create hooks**
   - `hooks/use-app-state.ts` — AppState wrapper
   - `hooks/use-countdown.ts` — countdown timer
   - `hooks/use-accelerometer.ts` — movement detection
   - `hooks/use-session.ts` — SessionContext accessor

5. **Create `lib/session-service.ts`**
   - startSession, endSession, getActiveSession, cancelSession

6. **Create `constants/missed-content.ts`**
   - Content rate constants and calculateMissedContent function

7. **Create components**
   - `components/sever-button.tsx` — hold-to-fill with reanimated + haptics
   - `components/countdown-overlay.tsx` — 5-second countdown
   - `components/streak-badge.tsx` — streak display

8. **Implement Home screen** (`app/(tabs)/index.tsx`)
   - SeverButton centered
   - Daily total + session count in header
   - Streak badge below button
   - Session state handling (all 5 states)

9. **Create Life Unlocked modal** (`app/(modals)/life-unlocked.tsx`)
   - Duration display
   - Missed content breakdown
   - Share and Done buttons

10. **Create `lib/streak-service.ts`** — getStreak (read-only)

11. **Wire SessionProvider into `app/_layout.tsx`**

12. **Session persistence**
    - Store active session in AsyncStorage on start
    - Restore on app launch
    - Clean up on session end

### Deliverable
User can hold Sever button, see countdown, lock phone, unlock to see session results. Streaks increment. Sessions are saved to Supabase.

---

## Phase 3: Stats & History

**Goal:** User can review their progress

**Depends on:** Phase 2 complete (sessions being recorded)

### Tasks

1. **Create `lib/stats-service.ts`**
   - getUserStats, getSessionHistory (paginated), getCalendarData, getDailyTotal, getPersonalBest

2. **Create `lib/format.ts`** — formatDuration, formatDurationShort utilities

3. **Create components**
   - `components/stat-card.tsx`
   - `components/calendar-heatmap.tsx` — monthly grid with swipe navigation
   - `components/session-list-item.tsx` — with personal best highlighting

4. **Implement Stats screen** (`app/(tabs)/stats.tsx`)
   - Calendar heatmap at top
   - Stat cards row (total time, best session, total sessions)
   - Paginated session history list (FlatList with onEndReached)

5. **Implement Profile screen** (`app/(tabs)/profile.tsx`)
   - User info (avatar, username)
   - 2x2 stat card grid (total time, streak, best session, challenge record)
   - Settings: update email, streak reminder time, logout, delete account
   - Account deletion with confirmation dialog

### Deliverable
User can see calendar of active days, session history with personal best, and profile stats. Can manage account settings.

---

## Phase 4: Social Layer

**Goal:** Friends and leaderboards working

**Depends on:** Phase 3 complete (stats aggregation working)

### Tasks

1. **Database setup**
   - Create `friendships` table with RLS and indexes
   - Create `get_friends_leaderboard` database function
   - Create `get_global_leaderboard` database function

2. **Create `lib/social-service.ts`**
   - searchUsers, sendFriendRequest, respondToRequest, getFriends, getPendingRequests, removeFriend

3. **Create `lib/leaderboard-service.ts`**
   - getFriendsLeaderboard, getGlobalLeaderboard

4. **Create `types/social.ts`** — Profile, LeaderboardEntry, FriendRequest types

5. **Create components**
   - `components/leaderboard-row.tsx`
   - `components/friend-request-card.tsx`

6. **Implement Social screen** (`app/(tabs)/social.tsx`)
   - Segmented control: Friends LB | Global LB | Friends
   - Leaderboard display with current user highlighted
   - Friend request management (accept/decline)
   - User search with debounced input
   - Friend list

### Deliverable
User can add friends, see friend and global leaderboards ranked by weekly sever time.

---

## Phase 5: Challenges

**Goal:** Head-to-head challenges with real-time sync

**Depends on:** Phase 4 complete (friends system needed for challenge targets)

### Tasks

1. **Install dependencies**
   - `nanoid` (for invite token generation)

2. **Database setup**
   - Create `challenges` table with RLS and indexes
   - Create `resolve_challenge` database function
   - Enable Supabase Realtime on `challenges` table

3. **Create `lib/challenge-service.ts`**
   - createChallenge, acceptChallenge, declineChallenge, recordChallengeDuration, getActiveChallenges, getChallengeHistory, getChallengeByToken

4. **Create `types/challenge.ts`** — Challenge type and status enum

5. **Create `hooks/use-realtime-challenge.ts`**
   - Supabase Realtime subscription for live challenge updates

6. **Create components**
   - `components/challenge-card.tsx`

7. **Create modal screens**
   - `app/(modals)/challenge-invite.tsx` — accept/decline incoming challenge
   - `app/(modals)/challenge-result.tsx` — winner/loser display

8. **Create deep link handler**
   - `app/challenge/[id].tsx` — handle `sevvr://challenge/{token}` links

9. **Implement challenge flow in Social screen**
   - Challenge creation from friend list
   - SMS invite via `Linking.openURL('sms:...')`
   - Active challenges section

10. **Link sessions to challenges**
    - When starting a session during an active challenge, set `sessions.challenge_id`
    - On session end, call `recordChallengeDuration`

### Deliverable
User can challenge friends, compete in real-time, see results. SMS invites work for non-users.

---

## Phase 6: Notifications & Polish

**Goal:** Push notifications, streak reminders, production readiness

**Depends on:** All previous phases complete

### Tasks

1. **Install dependencies**
   - `expo-notifications`
   - `expo-device`

2. **Update `app.json`** — notification plugin, bundle identifiers

3. **Create `providers/notification-provider.tsx`**
   - Permission request
   - Push token acquisition and storage
   - Notification response handler for deep link routing

4. **Create `lib/notification-service.ts`**
   - registerPushToken, clearPushToken

5. **Deploy Supabase Edge Functions**
   - `send-push` — generic push sender via Expo Push API
   - `streak-reminder` — cron job for streak-at-risk notifications

6. **Create database triggers**
   - `notify_challenge_created` — push on new challenge
   - `notify_challenge_completed` — push on challenge result

7. **Implement account deletion Edge Function**
   - Cron that deletes users with `deleted_at` older than 24 hours
   - Uses `supabase.auth.admin.deleteUser()`

8. **Wire NotificationProvider into `app/_layout.tsx`**

9. **Polish and error handling**
   - Loading states on all data-fetching screens
   - Error boundaries and retry logic
   - Empty states (no sessions yet, no friends yet, etc.)
   - Keyboard avoidance on auth forms

10. **Brand polish**
    - Finalize sevvr color palette in `constants/theme.ts`
    - App icon and splash screen updates
    - Consistent typography using `Fonts` from theme

11. **Platform testing**
    - Test AppState behavior on iOS (simulator + device)
    - Test AppState behavior on Android (emulator + device)
    - Verify accelerometer thresholds on physical devices
    - Test push notifications on physical devices

---

## Risk Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **AppState inconsistency on Android** (aggressive battery management kills background apps) | High | Store session start in AsyncStorage. On app foreground, always check for active session and reconcile with Supabase. If session exists in DB but not in local state, restore it. |
| **App killed during active session** | High | AsyncStorage persistence of session ID + start timestamp. On next launch, calculate duration from stored timestamp to now, end the session. |
| **Accelerometer false positives** (phone vibrates from notification, pet bumps table) | Medium | Require sustained threshold (3+ seconds above 1.8g) rather than single spikes. Tune threshold during beta testing. |
| **Supabase Realtime connection drops** during challenge | Medium | Supabase SDK handles reconnection automatically. Additionally, poll challenge status on app foreground as a fallback. |
| **Push notification delivery latency** exceeds 5-second target | Medium | Use Expo Push API directly from Edge Functions (no additional middleware). Expo's push service is generally sub-second. The 5-second target is generous. |
| **Username uniqueness race condition** on signup | Low | The `profiles` table has a UNIQUE constraint on `username`. If the trigger fails, the auth user is orphaned. Add a cleanup check: on login, if no profile exists, prompt to set username. |
| **Timezone handling for streak reminders** | Low | For v1, treat `streak_reminder_hour` as a simple hour. Users in different timezones may get reminders at slightly wrong times. Address properly in v2 with timezone storage. |

---

## Dependency Graph

```
Phase 1: Foundation
    │
    ▼
Phase 2: Core Session Loop
    │
    ▼
Phase 3: Stats & History
    │
    ▼
Phase 4: Social Layer
    │
    ▼
Phase 5: Challenges
    │
    ▼
Phase 6: Notifications & Polish
```

Each phase builds on the previous. No phases can be parallelized without significant rework, as each phase's data model and service layer is consumed by later phases.
