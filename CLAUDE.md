# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # Start dev server (press i for iOS, a for Android, w for web)
npx expo start --ios    # Start directly on iOS simulator
npx expo start --web    # Start web version
npm run lint            # Run ESLint (expo lint)
```

No test framework is configured yet.

## Architecture

**sevvr** is a competitive social wellness app (Expo 54 / React Native 0.81.5 / TypeScript) where users compete to stay off their phones. Backend is **Supabase** (Auth, PostgreSQL, Realtime) — no custom server.

### Routing & Navigation

File-based routing via expo-router 6 with typed routes enabled. The root layout (`app/_layout.tsx`) wraps everything in `AuthProvider` and redirects unauthenticated users to `(auth)/login`. Authenticated users see a 4-tab layout: Sever, Stats, Social, Profile.

Route groups: `(auth)` for login/signup, `(tabs)` for main app.

### Auth Flow

`providers/auth-provider.tsx` → `lib/auth-service.ts` → `lib/supabase.ts` (Supabase client with AsyncStorage for 30-day session persistence). The `useAuth()` hook from `hooks/use-auth.ts` exposes user state and auth methods to any screen.

### Service Layer Pattern

Each domain has a service module under `lib/` that wraps Supabase calls. Screens and hooks call service functions, never Supabase directly. Current services: `auth-service.ts`, `supabase.ts`. Planned: `session-service.ts`, `streak-service.ts`, `stats-service.ts`, `social-service.ts`, `leaderboard-service.ts`, `challenge-service.ts`.

### Theme System

`constants/theme.ts` defines `Colors` (light/dark) and `Fonts` (platform-specific). Components use `ThemedText` and `ThemedView` with `useThemeColor` hook for theme-aware rendering. `IconSymbol` maps SF Symbols to Material Icons for cross-platform icons.

### Database

Full schema is in `supabase/migrations/001_initial_schema.sql`. Tables: profiles, sessions, streaks, friendships, challenges, challenge_records. All tables use Row-Level Security. Database functions handle streak updates, leaderboard aggregation, and challenge resolution.

TypeScript types for all tables/views/functions are in `types/database.ts`.

### Technical Plan

Detailed implementation specs live in `technical-plan/` (9 files covering database schema, auth, navigation, session mechanics, stats, social/challenges, notifications, and phased rollout). Reference these when implementing new features.

## Environment

Supabase credentials in `.env` (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Conventions

- Path alias `@/*` maps to project root (e.g., `@/lib/supabase`)
- Component files use kebab-case (`themed-text.tsx`, `sever-button.tsx`)
- React Native `StyleSheet.create` for styling, no CSS framework
- ESLint 9 flat config extending `eslint-config-expo`
- New architecture and React Compiler enabled in `app.json`
