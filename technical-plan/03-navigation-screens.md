# 03 — Navigation & Screens

## Navigation Hierarchy

```
RootLayout (Stack) — app/_layout.tsx
├── (auth)                             [headerShown: false, when unauthenticated]
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── (tabs)                             [headerShown: false, anchor screen]
│   ├── index.tsx          → "Sever"   (Home / Sever button)
│   ├── stats.tsx          → "Stats"   (History, calendar, stats)
│   ├── social.tsx         → "Social"  (Leaderboards, friends)
│   └── profile.tsx        → "Profile" (User profile, settings)
├── (modals)/
│   ├── life-unlocked.tsx              [presentation: 'fullScreenModal']
│   ├── challenge-invite.tsx           [presentation: 'modal']
│   └── challenge-result.tsx           [presentation: 'modal']
└── challenge/[id].tsx                 [deep link target]
```

---

## Tab Configuration

**File:** `app/(tabs)/_layout.tsx`

The existing 2-tab layout (Home + Explore) is replaced with 4 tabs. Reuses `HapticTab` from `components/haptic-tab.tsx` and `IconSymbol` from `components/ui/icon-symbol.tsx`.

| Tab | Route | Icon (SF Symbol) | Material Fallback | Title |
|---|---|---|---|---|
| Home | `index` | `bolt.fill` | `flash-on` | Sever |
| Stats | `stats` | `chart.bar.fill` | `bar-chart` | Stats |
| Social | `social` | `person.2.fill` | `people` | Social |
| Profile | `profile` | `person.crop.circle` | `person` | Profile |

New icon mappings need to be added to `components/ui/icon-symbol.tsx`:

```typescript
// Add to SFSymbolMap
'bolt.fill': 'flash-on',
'chart.bar.fill': 'bar-chart',
'person.2.fill': 'people',
'person.crop.circle': 'person',
```

Tab bar styling:
- Active tint: `Colors[colorScheme].tint` (existing pattern)
- Tab bar background: matches theme background
- Haptic feedback on press (existing `HapticTab` component)

---

## Screen Specifications

### Home Screen (`app/(tabs)/index.tsx`)

The primary interaction screen. Replaces the existing template welcome content entirely.

**Layout:**
```
┌──────────────────────┐
│  Today: 1h 23m  (2)  │  ← Daily total + session count
│                       │
│                       │
│      ┌─────────┐     │
│      │         │     │
│      │  SEVER  │     │  ← SeverButton component (large, centered)
│      │         │     │
│      └─────────┘     │
│                       │
│     🔥 5-day streak   │  ← StreakBadge component
│                       │
└──────────────────────┘
```

**States:**
1. **Idle** — Button visible, daily stats in header, streak badge below
2. **Holding** — Button fill animation playing (0-100% over 3 seconds)
3. **Countdown** — Full-screen `CountdownOverlay` (5-4-3-2-1), cancel available
4. **Active** — "Session in progress" display with elapsed timer (visible if user returns to app)
5. **Returning** — Automatically navigates to Life Unlocked modal

**Data needed:**
- `getDailyTotal(userId, today)` from `stats-service` for header
- `getStreak(userId)` from `stats-service` for streak badge
- `getActiveSession(userId)` from `session-service` to restore in-progress session on mount

---

### Stats Screen (`app/(tabs)/stats.tsx`)

**Layout:**
```
┌──────────────────────┐
│  ← February 2026 →   │  ← CalendarHeatmap (swipeable months)
│  M T W T F S S       │
│  ● ● . ● . ● .      │  ← Dots on active days
│  ● . ● ● ● . .      │
│  ...                  │
├──────────────────────┤
│ Total    Best   Count │  ← StatCard row
│ 47h 12m  2h 3m   89  │
├──────────────────────┤
│ Session History       │  ← Section header
│ ─────────────────────│
│ Mar 15  ·  1h 23m    │  ← SessionListItem
│ Mar 15  ·  0h 45m    │
│ Mar 14  ·  2h 03m 🏆 │  ← Personal best highlighted
│ Mar 13  ·  0h 30m    │
│ ...                   │  ← FlatList, paginated
└──────────────────────┘
```

**Components used:**
- `CalendarHeatmap` — monthly grid, swipe to change months
- `StatCard` — reusable card showing label + value
- `SessionListItem` — date + duration, optional personal best badge

**Data needed:**
- `getCalendarData(userId, year, month)` from `stats-service`
- `getUserStats(userId)` from `stats-service`
- `getSessionHistory(userId, page, limit)` from `stats-service` (paginated)

---

### Social Screen (`app/(tabs)/social.tsx`)

**Layout:**
```
┌──────────────────────┐
│ [Friends LB] [Global] [Friends] │  ← Segmented control (3 segments)
├──────────────────────┤
│                       │
│  IF Leaderboard:      │
│  1. 🥇 alice  4h 30m │  ← LeaderboardRow
│  2. 🥈 YOU    3h 12m │  ← Current user highlighted
│  3. 🥉 bob    2h 45m │
│  ...                  │
│                       │
│  IF Friends:          │
│  Pending (2)          │
│  ┌─ @charlie ──[✓][✗]│  ← FriendRequestCard
│  └─ @dave ────[✓][✗] │
│  ───────────────────  │
│  🔍 Search username   │  ← Search bar
│  ───────────────────  │
│  Friend list...       │
│                       │
│         [⚔️ Challenge]│  ← FAB or header action
└──────────────────────┘
```

**Components used:**
- `LeaderboardRow` — rank, avatar, username, weekly time, highlight for current user
- `FriendRequestCard` — username + accept/decline buttons
- `ChallengeCard` — shown in a separate challenges section or modal

**Data needed:**
- `getFriendsLeaderboard(userId)` from `leaderboard-service`
- `getGlobalLeaderboard()` from `leaderboard-service`
- `getPendingRequests(userId)` from `social-service`
- `getFriends(userId)` from `social-service`
- `searchUsers(query)` from `social-service`

---

### Profile Screen (`app/(tabs)/profile.tsx`)

**Layout:**
```
┌──────────────────────┐
│      [Avatar]         │
│     @username         │
│     Display Name      │
├──────────────────────┤
│ Total Time │ Streak   │  ← StatCard grid (2x2)
│  47h 12m   │ 🔥 12    │
│────────────│──────────│
│ Best       │ Record   │
│  2h 03m    │ 15W-3L   │
├──────────────────────┤
│ Settings              │
│  Update Email     →   │
│  Streak Reminder  →   │  ← Time picker for reminder hour
│  Log Out          →   │
│  Delete Account   →   │  ← Red, with confirmation
└──────────────────────┘
```

**Data needed:**
- `getUserStats(userId)` from `stats-service`
- `getStreak(userId)` from `stats-service`
- `challenge_records` for the user from `challenge-service`
- Profile data from `useAuth().user` + profiles table

---

### Life Unlocked Modal (`app/(modals)/life-unlocked.tsx`)

Presented as full-screen modal after a session ends.

**Layout:**
```
┌──────────────────────┐
│                       │
│    LIFE UNLOCKED      │
│                       │
│      1h 23m 45s       │  ← Large duration display
│                       │
│  While you were gone: │
│  📱 423 tweets        │
│  🎵 47 TikToks        │
│  📸 58 IG posts       │
│  ▶️  16 YT videos     │
│                       │
│    [ Share ]          │  ← expo-sharing
│    [ Done  ]          │  ← Dismiss modal
└──────────────────────┘
```

**Data source:** Session data passed via router params or read from `session-service` using session ID.

---

### Challenge Invite Modal (`app/(modals)/challenge-invite.tsx`)

**Layout:**
```
┌──────────────────────┐
│                       │
│  ⚔️  Challenge!       │
│                       │
│  @alice challenged    │
│  you to sever         │
│                       │
│  [ Accept ]           │
│  [ Decline ]          │
└──────────────────────┘
```

---

### Challenge Result Modal (`app/(modals)/challenge-result.tsx`)

**Layout:**
```
┌──────────────────────┐
│                       │
│  🏆 You Won! / 😤    │
│                       │
│  You:    1h 23m       │
│  @alice: 0h 58m       │
│                       │
│  [ Done ]             │
└──────────────────────┘
```

---

### Deep Link Handler (`app/challenge/[id].tsx`)

Route: `sevvr://challenge/{invite_token}`

**Logic:**
1. Read `id` param (this is the `invite_token`)
2. If user is authenticated: look up challenge by `invite_token`, show accept/decline
3. If user is not authenticated: redirect to `/(auth)/signup` with `returnTo` param containing the challenge token. After signup completes, redirect back here.

---

## Files to Delete

Remove the existing template demo content:
- `app/(tabs)/explore.tsx` — replaced by stats/social/profile tabs
- `components/hello-wave.tsx` — demo component not needed
- `app/modal.tsx` — replaced by `(modals)` group
