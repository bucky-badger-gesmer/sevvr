# 00 — Architecture Overview

## Tech Stack

| Layer | Technology | Version | Status |
|---|---|---|---|
| Framework | Expo (managed workflow) | 54.0.33 | Installed |
| UI | React Native | 0.81.5 | Installed |
| Language | TypeScript (strict) | 5.9.2 | Installed |
| Navigation | expo-router (file-based) | 6.0.23 | Installed |
| Animations | react-native-reanimated | 4.1.1 | Installed |
| Gestures | react-native-gesture-handler | 2.28.0 | Installed |
| Haptics | expo-haptics | 15.0.8 | Installed |
| Backend | Supabase (Auth + DB + Realtime) | JS SDK v2 | **To install** |
| Local Storage | @react-native-async-storage/async-storage | latest | **To install** |
| Push | expo-notifications | latest | **To install** |
| Sensors | expo-sensors (Accelerometer) | latest | **To install** |
| Sharing | expo-sharing | latest | **To install** |
| Device Info | expo-device | latest | **To install** |

## Key Architecture Decisions

### 1. No custom backend server
All server logic lives in Supabase: PostgreSQL functions, views, Row-Level Security policies, and Edge Functions (only for push notification triggers and cron jobs). The Expo app communicates directly with Supabase via `@supabase/supabase-js`. This eliminates the Node.js + Express backend proposed in the RUP C1 phase.

### 2. Service layer pattern
Each domain gets a service module under `lib/` that wraps Supabase calls. Screens and hooks never call Supabase directly — they call service functions. This keeps business logic testable and the Supabase dependency swappable.

### 3. React Context for global state
Three contexts manage app-wide state:
- **AuthContext** — user session, auth methods
- **SessionContext** — active sever session state machine
- **NotificationContext** — push token, permission status

No Redux. The app state is narrow enough for Context + useReducer.

### 4. Reuse existing template patterns
The existing template provides components and hooks that are used throughout:
- `ThemedText`, `ThemedView` — all screens use these for theme-aware rendering
- `useThemeColor`, `useColorScheme` — color selection hooks
- `HapticTab` — tab bar button with haptic feedback
- `IconSymbol` — cross-platform icon component (SF Symbols on iOS, Material Icons elsewhere)
- `Colors` and `Fonts` in `constants/theme.ts` — extended with sevvr brand colors

### 5. File-based routing
Expo Router 6 with typed routes (`experiments.typedRoutes: true` already enabled in `app.json`). Route groups `(auth)`, `(tabs)`, and `(modals)` organize screens.

## Directory Structure

New and modified files marked with `*` (new) or `~` (modify):

```
sevvr/
├── app/
│   ├── _layout.tsx                    ~ Add AuthProvider, SessionProvider, auth redirect
│   ├── (auth)/                        *
│   │   ├── _layout.tsx                * Stack navigator for auth screens
│   │   ├── login.tsx                  * Email/password login
│   │   ├── signup.tsx                 * Email/password/username registration
│   │   └── forgot-password.tsx        * Password reset email
│   ├── (tabs)/
│   │   ├── _layout.tsx                ~ Change from 2 tabs to 4 tabs
│   │   ├── index.tsx                  ~ Replace with Sever button home screen
│   │   ├── stats.tsx                  * Stats, history, calendar
│   │   ├── social.tsx                 * Leaderboards, friends, challenges
│   │   └── profile.tsx               * Profile, settings
│   ├── (modals)/                      *
│   │   ├── life-unlocked.tsx          * Session end results
│   │   ├── challenge-invite.tsx       * Incoming challenge accept/decline
│   │   └── challenge-result.tsx       * Challenge outcome display
│   ├── challenge/                     *
│   │   └── [id].tsx                   * Deep link handler for challenge invites
│   └── +not-found.tsx                 (keep existing)
├── components/
│   ├── themed-text.tsx                (keep)
│   ├── themed-view.tsx                (keep)
│   ├── haptic-tab.tsx                 (keep)
│   ├── parallax-scroll-view.tsx       (keep)
│   ├── external-link.tsx              (keep)
│   ├── ui/
│   │   ├── icon-symbol.tsx            (keep)
│   │   ├── icon-symbol.ios.tsx        (keep)
│   │   └── collapsible.tsx            (keep)
│   ├── sever-button.tsx               * Hold-to-fill circular button
│   ├── countdown-overlay.tsx          * 5-second countdown
│   ├── streak-badge.tsx               * Flame icon + streak count
│   ├── stat-card.tsx                  * Reusable stat display card
│   ├── session-list-item.tsx          * Session history row
│   ├── calendar-heatmap.tsx           * Monthly calendar with activity dots
│   ├── leaderboard-row.tsx            * Ranked user row
│   ├── friend-request-card.tsx        * Accept/decline friend request
│   └── challenge-card.tsx             * Challenge status display
├── constants/
│   ├── theme.ts                       ~ Extend Colors with sevvr brand palette
│   └── missed-content.ts             * Platform average content rates
├── hooks/
│   ├── use-color-scheme.ts            (keep)
│   ├── use-color-scheme.web.ts        (keep)
│   ├── use-theme-color.ts             (keep)
│   ├── use-auth.ts                    * Access AuthContext
│   ├── use-session.ts                 * Active session state from SessionContext
│   ├── use-app-state.ts              * AppState listener wrapper
│   ├── use-accelerometer.ts          * Movement detection
│   ├── use-countdown.ts              * Countdown timer logic
│   └── use-realtime-challenge.ts     * Supabase Realtime subscription
├── lib/                               *
│   ├── supabase.ts                    * Supabase client initialization
│   ├── auth-service.ts               * Auth operations
│   ├── session-service.ts            * Session CRUD
│   ├── streak-service.ts             * Streak calculation
│   ├── stats-service.ts              * Stat aggregation queries
│   ├── social-service.ts             * Friends CRUD
│   ├── leaderboard-service.ts        * Leaderboard queries
│   ├── challenge-service.ts          * Challenge lifecycle
│   └── notification-service.ts       * Push token + notification routing
├── providers/                         *
│   ├── auth-provider.tsx             * AuthContext + session listener
│   ├── session-provider.tsx          * Session state machine
│   └── notification-provider.tsx     * Push permission + token sync
├── types/                             *
│   ├── database.ts                    * Supabase-generated types
│   ├── session.ts                     * Session types and state enums
│   ├── challenge.ts                   * Challenge types
│   └── social.ts                      * Friend, LeaderboardEntry types
└── supabase/                          *
    ├── migrations/                    * SQL migration files
    └── functions/                     * Edge Functions
        ├── send-push/index.ts         * Push notification sender
        └── streak-reminder/index.ts   * Cron: streak-at-risk check
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

These go in a `.env` file (gitignored) and are accessed via `process.env.EXPO_PUBLIC_*` in Expo 54.
