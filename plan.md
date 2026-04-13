# sevvr — Development Plan (Corrected)

_Last Updated: 2026-04-12_

This document replaces and corrects the `plan.md` embedded in the C1 "Framework Architecture" section of `sevvr_RUP.md`. That plan described a Node.js + Express API server that was never built. This document reflects the actual architecture, implementation status, limitations, and remaining work.

---

## Vision Alignment

From the RUP Vision Statement:

> "The sevvr app is a competitive social wellness game that turns putting your phone down into a timed challenge — lock your phone, see how long you last, compete with friends, and build streaks."

The plan below supports this vision by:

- **Making the core mechanic tactile and intentional** — the 3-second hold-to-fill button and 5-second countdown make severing feel like a ritual, not a checkbox.
- **Rewarding the player at session end** — the Life Unlocked modal shows duration and content missed, creating a sense of accomplishment.
- **Building competitive pressure** — weekly leaderboards, head-to-head challenges, and streak tracking create daily hooks.
- **Staying social** — friend search, challenge invites via SMS, and Realtime sync enable competition with people the user actually knows.

**What the plan does NOT address (Out of Scope per RUP):** screen time monitoring, app blocking, real-money wagers, in-app currency, meditation content, or a social feed.

---

## Architecture Correction: C1 vs. Reality

The C1 section of `sevvr_RUP.md` described a different system than what was built. The table below documents every discrepancy.

| C1 Claim                                                                                                                    | Actual Implementation                                                                                                                        | Impact                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Framework: "Node.js + Express API server"                                                                                   | No custom server exists. The Expo app calls Supabase directly via `@supabase/supabase-js`.                                                   | C1's entire folder structure (`sevvr-api/src/modules/`) does not exist.                         |
| Project type: "API-only backend"                                                                                            | Project is a full Expo/React Native mobile app with UI, navigation, and state management.                                                    | C1's API-first approach is the opposite of what was built.                                      |
| Storage: "SQL (PostgreSQL assumed)"                                                                                         | PostgreSQL via Supabase — correct. But schema is managed via migration files + Supabase dashboard, not a custom ORM.                         | Minor: the storage choice is right, the tooling is different.                                   |
| Auth: "JWT + refresh tokens, 30-day persistence"                                                                            | Supabase Auth handles JWT and refresh tokens internally. AsyncStorage persists the session on-device.                                        | C1's manual JWT implementation was never needed — Supabase handles this.                        |
| Modules: `auth/`, `users/`, `sessions/`, `streaks/`, `stats/`, `friends/`, `challenges/`, `leaderboards/`, `notifications/` | These are service modules under `lib/` (`auth-service.ts`, `session-service.ts`, etc.) that wrap Supabase calls, not Express route handlers. | The domain model is the same; the implementation layer is fundamentally different.              |
| "API versioning strategy"                                                                                                   | No versioning needed — the Expo app and Supabase backend are deployed together.                                                              | C1 over-engineered for a scenario that doesn't apply.                                           |
| "Rate limiting, logging, observability"                                                                                     | Not implemented. Supabase provides some built-in protection but no custom rate limiting or logging was added.                                | This is a real gap that C1 correctly identified, even if the implementation approach was wrong. |
| Environment files: `development.env`, `staging.env`, `production.env`                                                       | Single `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. No staging environment.                              | C1 described multi-environment setup that was not built.                                        |

**Why did this happen?** The C1 plan was generated from a generic AI prompt asking for a "project blueprint" without specifying that the project was already an Expo/React Native app using Supabase. The blueprint was API-first boilerplate, not sevvr-specific design.

---

## Actual Architecture

### Tech Stack

| Layer              | Technology                                       | Version   |
| ------------------ | ------------------------------------------------ | --------- |
| Framework          | Expo (managed workflow)                          | 54.0.33   |
| UI                 | React Native                                     | 0.81.5    |
| Language           | TypeScript (strict, React Compiler enabled)      | 5.9.2     |
| Navigation         | expo-router (file-based, typed routes)           | 6.0.23    |
| Animations         | react-native-reanimated                          | 4.1.1     |
| Gestures           | react-native-gesture-handler                     | 2.28.0    |
| Haptics            | expo-haptics                                     | 15.0.8    |
| Backend            | Supabase (Auth + PostgreSQL + Realtime)          | JS SDK v2 |
| Local Storage      | @react-native-async-storage/async-storage        | 2.2.0     |
| Push Notifications | expo-notifications                               | 0.32.16   |
| Sensors            | expo-sensors (Accelerometer — installed, unused) | 15.0.8    |

**Key architectural decision:** No custom backend server. All server logic lives in Supabase: PostgreSQL functions, views, and Row-Level Security policies. The Expo app talks directly to Supabase via the JS SDK.

### Design Patterns

- **Service layer**: each domain gets a module under `lib/` (`auth-service.ts`, `session-service.ts`, `social-service.ts`, etc.) that wraps Supabase calls. Screens and hooks never call Supabase directly.
- **React Context + useReducer**: global state in two providers — `AuthProvider` (user identity) and `SessionProvider` (active session state machine). No Redux.
- **File-based routing**: expo-router 6 with typed routes. Route groups: `(auth)` for login/signup, `(tabs)` for the main app, `(modals)` for overlays. Deep links handled in `app/challenge/[id].tsx`.

### Directory Structure

```
sevvr/
  app/
    _layout.tsx              # Root: AuthProvider + SessionProvider, auth redirect, pending challenge token check
    (auth)/
      login.tsx              # Email + password login
      signup.tsx             # Username + email + password with validation
      forgot-password.tsx    # Reset email flow
    (tabs)/
      _layout.tsx            # 4-tab bar: Sever (⚡), Stats (📊), Social (👥), Profile (👤)
      index.tsx              # Home: SeverButton, streak badge, daily stats
      stats.tsx              # Calendar heatmap + stat cards + day session list
      social.tsx             # Friends LB / Global LB / Challenges / Manage (4 sub-tabs)
      profile.tsx            # Avatar, stat grid, logout, delete account
    (modals)/
      life-unlocked.tsx      # Session end: duration + missed content + share
      challenge-invite.tsx   # UI stub (non-functional)
      challenge-result.tsx   # UI stub (non-functional)
    challenge/
      [id].tsx               # Deep link handler for challenge invite tokens
  components/
    sever-button.tsx         # Hold-to-fill circular button with reanimated + haptics
    countdown-overlay.tsx    # 5-second countdown with per-tick haptics
    streak-badge.tsx         # Flame icon + streak count with pulse animation
    stat-card.tsx            # Reusable stat display with press animation
    session-list-item.tsx    # Session history row with personal best highlight
    calendar-heatmap.tsx     # Monthly grid with selectable days
    leaderboard-row.tsx      # Ranked user row with avatar
    friend-request-card.tsx  # Accept/decline friend request card
    challenge-card.tsx       # Challenge status display (all states)
    botanical-empty-state.tsx # Empty state with botanical icon, title, subtitle
    themed-text.tsx          # Theme-aware text (11 type variants)
    themed-view.tsx          # Theme-aware view
    paper-texture.tsx        # Grain overlay (built, not wired into layouts)
  constants/
    theme.ts                 # Colors (light/dark), Typography, Spacing, BorderRadius, Shadows
    missed-content.ts        # Content rates per hour + calculateMissedContent()
  hooks/
    use-auth.ts              # AuthContext accessor
    use-session.ts           # SessionContext accessor
    use-app-state.ts         # AppState change listener
    use-countdown.ts         # setInterval countdown timer
    use-realtime-challenge.ts # Supabase Realtime subscription for challenges
    use-color-scheme.ts      # System dark/light mode
    use-theme-color.ts       # Themed color lookup
  lib/
    supabase.ts              # Supabase client (AsyncStorage, SSR-safe)
    auth-service.ts          # signUp, signIn, signOut, updateEmail, resetPassword, deleteAccount
    session-service.ts       # startSession, endSession (RPC), getActiveSession, cancelSession
    streak-service.ts        # getStreak (read-only)
    stats-service.ts         # getUserStats, getSessionHistory, getCalendarData, getDailyTotal, getPersonalBest, getSessionsForDate
    social-service.ts        # searchUsers, sendFriendRequest, respondToRequest, getFriends, getPendingRequests, removeFriend
    leaderboard-service.ts   # getFriendsLeaderboard, getGlobalLeaderboard (both via RPC)
    challenge-service.ts     # createChallenge, acceptChallenge, declineChallenge, recordChallengeDuration, getChallengeByToken, acceptChallengeByToken, getActiveChallenges
    format.ts                # formatDuration, formatDurationShort
  providers/
    auth-provider.tsx        # AuthContext: session restore, onAuthStateChange
    session-provider.tsx     # SessionContext: state machine, AppState listener, AsyncStorage crash recovery
  types/
    database.ts              # Supabase-generated types (all tables, views, functions)
    session.ts               # SessionState, MissedContent, ActiveSession, CompletedSession, SessionAction
    social.ts                # Challenge, LeaderboardEntry, FriendRequest, Friend
  supabase/
    migrations/
      001_initial_schema.sql # Complete schema: tables, RLS, views, functions, realtime config
```

### Database Schema

All server logic lives in `supabase/migrations/001_initial_schema.sql`.

**Tables (all with Row-Level Security):**

| Table               | Purpose                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`          | Extends `auth.users` — username, display_name, avatar_url, push_token, streak_reminder_hour, soft-delete via `deleted_at`                           |
| `sessions`          | Core game data — user_id, started_at, ended_at, duration_seconds, ended_reason (`unlock`/`movement`/`cancel`), challenge_id, missed_content (jsonb) |
| `streaks`           | One row per user — current_streak, longest_streak, last_session_date                                                                                |
| `friendships`       | Bidirectional with status (`pending`/`accepted`/`declined`)                                                                                         |
| `challenges`        | Full lifecycle — challenger_id, challenged_id (nullable for SMS), status, winner_id, durations, invite_token, expires_at                            |
| `challenge_records` | Denormalized win/loss per user — wins, losses, total_challenges                                                                                     |

**Views:** `daily_session_totals` (aggregates by user + date), `user_stats` (total seconds, best session, total sessions per user)

**Database Functions:**

- `handle_new_user()` — trigger on auth.users INSERT; creates profiles + streaks + challenge_records rows
- `update_streak(p_user_id)` — RPC called after session end; handles today/yesterday/reset logic
- `get_friends_leaderboard(p_user_id)` — weekly sever totals for user + accepted friends (limit 50)
- `get_global_leaderboard()` — top 100 by weekly sever time
- `resolve_challenge(p_challenge_id)` — determines winner, updates challenge_records

---

## Implementation Phases

### Phase 1: Foundation

**Status: Complete**
**User Stories: 1, 2, 21**

Goal: Authenticated app shell with 4-tab navigation and full database schema.

| What was built                                                                                                              | Key files                                          |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Supabase client with AsyncStorage for 30-day session persistence                                                            | `lib/supabase.ts`                                  |
| Auth service: signUp, signIn, signOut, updateEmail, resetPassword, deleteAccount (soft-delete)                              | `lib/auth-service.ts`                              |
| AuthProvider: session restore on mount, onAuthStateChange listener                                                          | `providers/auth-provider.tsx`, `hooks/use-auth.ts` |
| Auth screens: login, signup (username + email + password validation), forgot-password                                       | `app/(auth)/*.tsx`                                 |
| Root layout: auth redirect logic (unauthenticated → login, authenticated → tabs)                                            | `app/_layout.tsx`                                  |
| 4-tab navigation with themed tab bar + haptic feedback                                                                      | `app/(tabs)/_layout.tsx`                           |
| Botanical-tech theme system: Colors (terracotta/sage/ochre), Typography (Fraunces/DM Sans/JetBrains Mono), Spacing, Shadows | `constants/theme.ts`                               |
| Full database migration with RLS on all tables                                                                              | `supabase/migrations/001_initial_schema.sql`       |
| TypeScript types for all Supabase tables/views/functions                                                                    | `types/database.ts`                                |

### Phase 2: Core Session Loop

**Status: Complete (movement detection excepted)**
**User Stories: 3, 4, 5, 6, 7, 11, 12, 13**

Goal: User can sever, see results, and build a streak.

| What was built                                                                                                                                                      | Key files                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| SessionProvider state machine: idle → holding → countdown → active → ended                                                                                          | `providers/session-provider.tsx`   |
| AppState listener: background transition → start session; active/inactive transition → end session                                                                  | `providers/session-provider.tsx`   |
| AsyncStorage crash recovery: writes startedAt before Supabase; reconciles orphaned sessions on app launch                                                           | `providers/session-provider.tsx`   |
| SeverButton: 3-second hold-to-fill with reanimated spring physics, haptics (light on press, heavy on fill), breathing idle animation, streak milestone burst effect | `components/sever-button.tsx`      |
| CountdownOverlay: 5-second countdown, scale animation per tick, medium haptic each second, cancel action                                                            | `components/countdown-overlay.tsx` |
| StreakBadge: flame icon + count with pulse animation                                                                                                                | `components/streak-badge.tsx`      |
| Home screen: daily stats header, SeverButton, StreakBadge, "Session Active" state, auto-redirect to Life Unlocked on session end                                    | `app/(tabs)/index.tsx`             |
| Life Unlocked modal: duration, missed content breakdown (tweets/TikToks/IG/YT), Share button, Done button                                                           | `app/(modals)/life-unlocked.tsx`   |
| Session service: startSession, endSession (via `end_session` SECURITY DEFINER RPC), getActiveSession, cancelSession                                                 | `lib/session-service.ts`           |
| Missed content calculation: rates (300 tweets/hr, 34 TikToks/hr, 42 IG posts/hr, 12 YT videos/hr) × duration                                                        | `constants/missed-content.ts`      |
| Streak service: reads from streaks table, client-side `isStreakActive()` staleness check                                                                            | `lib/streak-service.ts`            |

**Note on Story 11 (real-time missed content):** The RUP describes a counter that increments "in real time" during a session. In practice the phone is locked during the session, making a visible real-time counter infeasible. Missed content is computed at session end and displayed in the Life Unlocked modal. This is the correct UX — showing a running counter would require the user to unlock their phone, which ends the session.

### Phase 3: Stats and History

**Status: Complete**
**User Stories: 8, 9, 10, 19 (partial)**

Goal: User can review their progress over time.

| What was built                                                                                                                                                         | Key files                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Stats service: getUserStats (view), getSessionHistory (paginated), getCalendarData (unique dates per month), getDailyTotal (view), getPersonalBest, getSessionsForDate | `lib/stats-service.ts`                 |
| Format utilities: formatDuration (Xh Xm Xs), formatDurationShort (Xh Xm)                                                                                               | `lib/format.ts`                        |
| CalendarHeatmap: monthly grid with active day highlighting, swipe navigation between months                                                                            | `components/calendar-heatmap.tsx`      |
| StatCard: label + value + icon with press animation                                                                                                                    | `components/stat-card.tsx`             |
| SessionListItem: session row with personal best badge                                                                                                                  | `components/session-list-item.tsx`     |
| BotanicalEmptyState: botanical-themed empty state used throughout app                                                                                                  | `components/botanical-empty-state.tsx` |
| Stats screen: calendar heatmap, stat cards (Total Time, Best, Sessions), day navigation, session list for selected day                                                 | `app/(tabs)/stats.tsx`                 |
| Profile screen: avatar (first letter), username + email, 2×2 stat grid (Total Time, Streak, Best Session, Longest Streak), logout, delete account                      | `app/(tabs)/profile.tsx`               |

**Gap (Story 19):** Profile screen does not display challenge record (wins/losses). The `challenge_records` table exists and is updated by `resolve_challenge()`, but the profile screen does not query it.

### Phase 4: Social Layer

**Status: Complete (minor bug noted)**
**User Stories: 14, 15, 16**

Goal: Friends and leaderboards working.

| What was built                                                                                                                                                | Key files                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Social service: searchUsers (ilike on username), sendFriendRequest, respondToRequest, getFriends (resolves both directions), getPendingRequests, removeFriend | `lib/social-service.ts`              |
| Leaderboard service: getFriendsLeaderboard (RPC), getGlobalLeaderboard (RPC)                                                                                  | `lib/leaderboard-service.ts`         |
| LeaderboardRow: ranked user row with avatar, username, weekly time                                                                                            | `components/leaderboard-row.tsx`     |
| FriendRequestCard: accept/decline buttons                                                                                                                     | `components/friend-request-card.tsx` |
| Social screen: 4-sub-tab control (Friends LB, Global LB, Challenges, Manage), debounced search, friend list, pending requests                                 | `app/(tabs)/social.tsx`              |

**Bug (Story 15):** `leaderboard-service.ts` line 11 filters out the current user from the friends leaderboard results (`row.user_id !== userId`). The SQL function `get_friends_leaderboard()` correctly includes the user, but the client-side code removes them. The user does not appear on their own friends leaderboard.

### Phase 5: Challenges

**Status: Core flow complete; two modals are non-functional stubs**
**User Stories: 17, 18 (missing)**

Goal: Head-to-head challenges with real-time sync.

| What was built                                                                                                                                                                                                                       | Key files                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Challenge service: createChallenge (21-char token, 24h expiry), acceptChallenge, declineChallenge, getActiveChallenges, getChallengeByToken, recordChallengeDuration (auto-resolves when both durations set), acceptChallengeByToken | `lib/challenge-service.ts`                   |
| Realtime hook: Supabase Realtime subscription on `challenges` table via `postgres_changes`                                                                                                                                           | `hooks/use-realtime-challenge.ts`            |
| ChallengeCard: renders all challenge states (pending, accepted, active, completed, declined)                                                                                                                                         | `components/challenge-card.tsx`              |
| Deep link handler: loads challenge by invite token, handles unauthenticated users (stores token, redirects to signup), sender "waiting" view, recipient accept/decline                                                               | `app/challenge/[id].tsx`                     |
| SMS invite: creates challenge with null `challenged_id`, opens native SMS via `Linking.openURL('sms:?body=...')` with invite URL                                                                                                     | `app/(tabs)/social.tsx:handleSmsInvite()`    |
| Session-challenge linkage: SessionProvider links active session to challenge via SET_CHALLENGE action; calls `recordChallengeDuration()` on session end                                                                              | `providers/session-provider.tsx`             |
| Challenge resolution: SQL function `resolve_challenge()` determines winner and updates `challenge_records`                                                                                                                           | `supabase/migrations/001_initial_schema.sql` |

**Stubs:**

- `app/(modals)/challenge-invite.tsx` — Accept and Decline buttons both call `router.back()` with no service calls. The working accept/decline flow is in `ChallengeCard` and `app/challenge/[id].tsx`.
- `app/(modals)/challenge-result.tsx` — Shows "Results will appear here" placeholder. Challenge results display inline via `ChallengeCard`.

**User Story 18 (push notifications) — entirely missing.** See Limitations section.

### Phase 6: Notifications and Polish

**Status: Not implemented**
**User Stories: 18, 20 (partial)**

What was planned but not built:

- `providers/notification-provider.tsx` — NotificationContext does not exist
- `lib/notification-service.ts` — push token registration/sync not built
- Supabase Edge Functions (`send-push`, `streak-reminder`) — `supabase/functions/` directory does not exist
- Database triggers for challenge push notifications (`notify_challenge_created`, `notify_challenge_completed`)
- Notification response handler for deep link routing from notification taps
- Streak-at-risk reminders (requires scheduled Edge Function)
- Server-side account deletion cascade (soft-delete via `deleted_at` works, but no cron deletes the row after 24h)

What was partially done in lieu of Phase 6:

- `app/_layout.tsx` calls `Notifications.requestPermissionsAsync()` and sets a basic `NotificationHandler` with foreground behavior, but no push tokens are registered and no notifications are sent.
- Extensive UI polish: botanical-tech theme, custom typography, haptic feedback throughout, botanical empty states.

---

## User Story Coverage Matrix

| #   | User Story                       | Status     | Implementation                                                                                                                          | Gap                                                                                                                                          |
| --- | -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign up with email               | Done       | `app/(auth)/signup.tsx`, `lib/auth-service.ts:signUp()`                                                                                 | —                                                                                                                                            |
| 2   | Stay logged in 30 days           | Done       | `lib/supabase.ts` (AsyncStorage + persistSession), `providers/auth-provider.tsx`                                                        | —                                                                                                                                            |
| 3   | Hold Sever button to fill (3s)   | Done       | `components/sever-button.tsx` (FILL_DURATION=3000, reanimated, haptics)                                                                 | —                                                                                                                                            |
| 4   | 5-second countdown               | Done       | `components/countdown-overlay.tsx`, `hooks/use-countdown.ts`                                                                            | —                                                                                                                                            |
| 5   | Detect phone unlock              | Done       | `providers/session-provider.tsx` (AppState: background → active/inactive)                                                               | Movement detection not built; `expo-sensors` installed but no `use-accelerometer.ts` hook exists                                             |
| 6   | Session end modal                | Done       | `app/(modals)/life-unlocked.tsx`                                                                                                        | —                                                                                                                                            |
| 7   | Multiple sessions per day        | Done       | `lib/session-service.ts:startSession()` (no daily limit), daily total accumulates                                                       | —                                                                                                                                            |
| 8   | Session history log              | Done       | `app/(tabs)/stats.tsx`, `lib/stats-service.ts:getSessionsForDate()`, `components/session-list-item.tsx`                                 | —                                                                                                                                            |
| 9   | Personal best highlight          | Done       | `lib/stats-service.ts:getPersonalBest()`, `components/session-list-item.tsx` (isPersonalBest prop)                                      | —                                                                                                                                            |
| 10  | Calendar view                    | Done       | `components/calendar-heatmap.tsx`, `lib/stats-service.ts:getCalendarData()`                                                             | —                                                                                                                                            |
| 11  | Running missed content count     | Partial    | `constants/missed-content.ts:calculateMissedContent()`, `app/(modals)/life-unlocked.tsx`                                                | Shown at session end only; real-time display during active session is infeasible because the phone is locked                                 |
| 12  | Daily streak                     | Done       | `supabase/migrations/001_initial_schema.sql:update_streak()`, `lib/streak-service.ts`                                                   | —                                                                                                                                            |
| 13  | Streak on home screen            | Done       | `components/streak-badge.tsx`, `app/(tabs)/index.tsx`                                                                                   | —                                                                                                                                            |
| 14  | Add friends                      | Done       | `lib/social-service.ts:sendFriendRequest()`, `app/(tabs)/social.tsx` (search + add flow)                                                | —                                                                                                                                            |
| 15  | Friends leaderboard              | Done (bug) | `lib/leaderboard-service.ts:getFriendsLeaderboard()`, SQL: `get_friends_leaderboard()`                                                  | Bug: user filtered from own leaderboard at `leaderboard-service.ts:11` (`row.user_id !== userId`)                                            |
| 16  | Global leaderboard               | Done       | `lib/leaderboard-service.ts:getGlobalLeaderboard()`, SQL: `get_global_leaderboard()`                                                    | —                                                                                                                                            |
| 17  | SMS challenge                    | Done       | `app/(tabs)/social.tsx:handleSmsInvite()`, `app/challenge/[id].tsx`, `lib/challenge-service.ts`                                         | —                                                                                                                                            |
| 18  | Push notification for challenges | Missing    | —                                                                                                                                       | No push notification infrastructure exists: no NotificationProvider, no Edge Functions, no push token registration                           |
| 19  | Profile stats                    | Partial    | `app/(tabs)/profile.tsx` (total time, streak, best session, longest streak)                                                             | Missing challenge record (wins/losses); `challenge_records` table exists but is not queried by profile                                       |
| 20  | Update email                     | Partial    | `lib/auth-service.ts:updateEmail()`                                                                                                     | Service function exists but no UI screen or button exposes it                                                                                |
| 21  | Logout + delete account          | Done       | `app/(tabs)/profile.tsx:handleSignOut()`, `handleDeleteAccount()`, `lib/auth-service.ts:deleteAccount()` (soft-delete via `deleted_at`) | Server-side 24h cascade deletion not implemented (no Edge Function cron); user can no longer log in after soft-delete, but data row persists |

**Summary:** 16 stories fully done, 3 partially done (11, 19, 20), 1 missing (18).

---

## Known Limitations

### What the plan does NOT handle well

**1. No push notification infrastructure (Story 18 entirely missing)**
`expo-notifications` is installed and permissions are requested in `app/_layout.tsx`, but the entire server-side stack is absent: no push token is ever registered to Supabase, no Edge Functions exist to call the Expo Push API, and no database triggers fire on challenge events. Challenge discovery requires the user to open the app and navigate to the Social tab. This is the largest gap between the RUP vision and the current implementation.

**2. No accelerometer-based movement detection (Story 5, partial)**
The RUP's Algorithms section and the technical plan both describe sustained-threshold accelerometer detection (magnitude > 1.8g for 3+ seconds) as a session-end trigger. `expo-sensors` is installed but the `use-accelerometer.ts` hook was never built. Sessions end only when the user unlocks their phone (AppState transition). The `ended_reason` column in sessions supports `'movement'` but it is never written.

**3. No email update UI (Story 20, partial)**
`auth-service.ts:updateEmail()` works and calls Supabase's email change flow (which sends a verification email), but no screen or button in the app exposes it. The profile screen has no Settings or Edit section.

**4. Soft-delete without server-side purge (Story 21, partial)**
`deleteAccount()` sets `profiles.deleted_at` and calls `signOut()`. The user is effectively removed from the app experience. However, no Edge Function or cron job calls `supabase.auth.admin.deleteUser()` or cascades a hard delete after 24 hours. User data persists in the database.

**5. Challenge modals are non-functional shells**
`app/(modals)/challenge-invite.tsx` and `app/(modals)/challenge-result.tsx` are UI stubs. Both were superseded by inline challenge handling in `ChallengeCard` and `app/challenge/[id].tsx`, but the modal files were never updated or removed.

**6. No error boundaries or loading states**
No React error boundaries are implemented anywhere. Network errors in Stats, Social, and Profile screens are silently caught. No loading indicators appear while data is being fetched from Supabase (screens show empty states immediately).

**7. Paper texture not integrated**
`components/paper-texture.tsx` renders a subtle grain overlay that reinforces the botanical-tech design direction, but it is not included in any layout wrapper.

### Known Bugs

| Bug                                             | Location                                     | Description                                                                                                                         |
| ----------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| User excluded from own friends leaderboard      | `lib/leaderboard-service.ts:11`              | `filter((row) => row.user_id !== userId)` removes the current user client-side even though the SQL function correctly includes them |
| Challenge token generation uses `Math.random()` | `lib/challenge-service.ts:createChallenge()` | Uses `Math.random()` for token generation despite `nanoid` being in `package.json`; `Math.random()` is not cryptographically secure |

---

## Testing and Verification

The C3 Manual Test Plan in `sevvr_RUP.md` (TC-01 through TC-21) maps directly to user stories. The following adjustments apply based on the actual implementation:

| Test Case                                | Adjustment                                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-03 (Update Email)                     | Cannot be tested end-to-end — no UI. `lib/auth-service.ts:updateEmail()` works but is unreachable from the app.                                 |
| TC-07 (Session Auto-Pause on Unlock)     | Language mismatch: the session ENDS on unlock, it does not pause. Life Unlocked modal appears immediately.                                      |
| TC-13 (Real-Time Missed Content Counter) | Not testable as described. Missed content is shown at session end only. During an active session the phone is locked and no counter is visible. |
| TC-20 (Challenge Push Notification)      | Cannot be tested — no push infrastructure exists. Challenges are discovered by opening the app, not via notification.                           |

**How to verify each phase manually:**

1. **Auth (Stories 1, 2):** Create account, kill app, reopen — auto-login. Forgot-password sends email.
2. **Session loop (Stories 3–7):** Hold SEVER 3s → countdown → lock phone → unlock → Life Unlocked modal shows correct duration and missed content estimates.
3. **Stats (Stories 8–10):** After sessions, Stats tab shows sessions in calendar; tapping a day lists sessions; personal best has visual badge.
4. **Streak (Stories 12–13):** Complete at least one session; StreakBadge on home screen increments. Skip a day; badge resets to 0.
5. **Social (Stories 14–16):** Search another user → send friend request → accept from that account → Friends leaderboard shows both users ranked.
6. **Challenges (Story 17):** Social → Challenges → Challenge a friend → from friend's device, accept → both users sever → ChallengeCard shows winner.
7. **SMS invite (Story 17):** Tap "Invite via SMS" → native messaging opens with pre-filled text containing deep link.
8. **Deep link (Story 17):** Open `sevvr://challenge/{token}` while unauthenticated → redirected to signup → after signup, challenge accept/decline screen appears.
9. **Profile (Story 19):** Profile tab shows correct Total Time, Streak, Best Session, Longest Streak. (Challenge record not displayed.)
10. **Delete account (Story 21):** Profile → Delete Account → confirm in Alert → account inaccessible.

---

## What's Next: Remaining Work

Ordered by user story priority:

| Priority | Work Item                                                                                                                                                 | Story | Effort  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------- |
| High     | Push notification infrastructure: NotificationProvider, notification-service, Supabase Edge Functions (`send-push`, `streak-reminder`), database triggers | 18    | Large   |
| High     | Fix friends leaderboard bug: remove client-side filter at `leaderboard-service.ts:11`                                                                     | 15    | Trivial |
| Medium   | Email update UI: add Settings or Edit section to profile screen                                                                                           | 20    | Small   |
| Medium   | Challenge wins/losses on profile: query `challenge_records` in profile screen                                                                             | 19    | Small   |
| Medium   | Wire challenge-invite and challenge-result modals with real service calls and data                                                                        | —     | Medium  |
| Medium   | Account deletion cascade: Supabase Edge Function triggered 24h after `deleted_at` is set                                                                  | 21    | Medium  |
| Low      | Accelerometer movement detection: build `use-accelerometer.ts` hook, integrate into SessionProvider                                                       | 5     | Medium  |
| Low      | Wire PaperTexture into root layout and modal layouts                                                                                                      | —     | Small   |
| Low      | Error boundaries on all screen-level components                                                                                                           | —     | Medium  |
| Low      | Loading states on Stats, Social, Profile screens                                                                                                          | —     | Small   |
| Low      | Replace `Math.random()` token generation with `nanoid`                                                                                                    | —     | Trivial |

---

## Design Review

From a technology perspective, the vibe unified process document proposed a Node.js and Express API server. However, this way over-complicated things, as we only required a React Native/Expo frontend for mobile development and entirely use Supabase for backend and database development. This also introduced the ability to use the Supabase MCP server, which comes in handy because it allows any AI coding agent to directly communicate with the database and understand the schema with very little human intercention. Supabase also handles authentication, so you can see how much simpler the overall architecture is than the Express API originally proposed.

Also, the plan proposed an idea of detecting when a session ends by detecting movement, but we had to change this during implementation to just checking if the screen is locked. Even then, there are still edge cases where users can still unlock the phone and browse apps even while a session is running.

Overall, the diagrams are helpful, but again, overcomplicates things because it couldn't consider using Supabase as a backend and database layer. It shows one big "Controller" but we have two separate providers for auth and session. It shows one "DatabaseService" even though we have seven total databases. It also includes SensorService and NotificationService that were never implemented. In total, we have 16 out of 21 user stories fully implemented and working.

Moving forward, the main limitations are simply restrictions on the framework of React Native and Expo themselves. It may be better to consider building with more native development like iOS and Android, but this is certainly a good first start for prototyping!
