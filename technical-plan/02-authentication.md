# 02 — Authentication

## Overview

Authentication uses **Supabase Auth** with email/password. No OAuth providers in v1. The Supabase JS SDK handles JWT refresh automatically. Sessions persist for 30 days via `AsyncStorage`.

---

## Supabase Client Setup

**File:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

- `persistSession: true` + `AsyncStorage` stores the refresh token locally, giving 30-day persistent login
- `autoRefreshToken: true` silently refreshes the JWT before expiry (default 3600s)
- `detectSessionInUrl: false` disables URL-based auth (not applicable to React Native)

---

## Auth Service

**File:** `lib/auth-service.ts`

| Function | Supabase Call | Notes |
|---|---|---|
| `signUp(email, password, username)` | `supabase.auth.signUp({ email, password, options: { data: { username } } })` | `username` stored in `raw_user_meta_data`, then copied to `profiles` by trigger |
| `signIn(email, password)` | `supabase.auth.signInWithPassword({ email, password })` | Returns session + user |
| `signOut()` | `supabase.auth.signOut()` | Clears AsyncStorage session |
| `updateEmail(newEmail)` | `supabase.auth.updateUser({ email: newEmail })` | Sends verification to new email; email updates only after confirmation |
| `resetPassword(email)` | `supabase.auth.resetPasswordForEmail(email)` | Sends reset link |
| `deleteAccount()` | Set `profiles.deleted_at = now()`, then `signOut()` | Edge Function runs cascade delete 24h later |

**Username validation** on signup:
- 3-20 characters, alphanumeric + underscores only
- Check uniqueness via `SELECT` on `profiles.username` before calling `signUp`
- If `signUp` succeeds but username was taken in a race condition, the trigger will fail and the auth user should be cleaned up

---

## AuthProvider

**File:** `providers/auth-provider.tsx`

### Context Shape

```typescript
type AuthContextType = {
  user: User | null;          // Supabase User object
  session: Session | null;    // Supabase Session object
  isLoading: boolean;         // True during initial session restore
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
};
```

### Lifecycle

1. **On mount:** Call `supabase.auth.getSession()` to restore persisted session from AsyncStorage
2. **Subscribe:** `supabase.auth.onAuthStateChange` listens for:
   - `SIGNED_IN` — set user + session
   - `SIGNED_OUT` — clear user + session
   - `TOKEN_REFRESHED` — update session
   - `USER_UPDATED` — update user (email change confirmation)
3. **Set `isLoading = false`** after initial `getSession` resolves

### Error Handling

All auth methods throw with a structured error. The auth screens catch and display these:
- `AuthApiError` with `message` field from Supabase
- Network errors wrapped in a generic "Connection failed" message

---

## Protected Routes

**File:** `app/_layout.tsx`

The root layout uses `useAuth()` to gate navigation:

```typescript
export default function RootLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return <SplashScreen />; // Or keep expo-splash-screen visible
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(modals)/life-unlocked" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="(modals)/challenge-invite" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(modals)/challenge-result" options={{ presentation: 'modal' }} />
      <Stack.Screen name="challenge/[id]" />
    </Stack>
  );
}
```

### Provider Nesting Order (in `_layout.tsx`)

```
<AuthProvider>
  <NotificationProvider>
    <SessionProvider>
      <Stack>...</Stack>
    </SessionProvider>
  </NotificationProvider>
</AuthProvider>
```

`SessionProvider` needs `useAuth()` so it must be inside `AuthProvider`. `NotificationProvider` needs the user ID to sync push tokens.

---

## Auth Screens

### Login (`app/(auth)/login.tsx`)

- Email + password fields
- "Log In" button calls `signIn()`
- "Don't have an account? Sign Up" link → `/(auth)/signup`
- "Forgot Password?" link → `/(auth)/forgot-password`
- Error display below form
- Uses `ThemedText`, `ThemedView` for theme consistency

### Signup (`app/(auth)/signup.tsx`)

- Email + password + username fields
- Username availability check (debounced, 500ms) via `social-service.searchUsers`
- Password requirements: minimum 8 characters
- "Create Account" button calls `signUp()`
- Error display below form

### Forgot Password (`app/(auth)/forgot-password.tsx`)

- Email field
- "Send Reset Link" button calls `resetPassword()`
- Success message: "Check your email for a password reset link"

---

## Account Deletion Flow

1. User taps "Delete Account" on profile settings
2. Confirmation dialog: "Your account will be permanently deleted in 24 hours. This cannot be undone."
3. On confirm: set `profiles.deleted_at = now()` and call `signOut()`
4. A Supabase Edge Function on a cron schedule (runs hourly) queries profiles where `deleted_at < now() - interval '24 hours'`
5. For each match, the Edge Function uses `supabase.auth.admin.deleteUser(userId)` which cascades through all FK relationships
6. If user logs back in within 24 hours, they can "Cancel Deletion" which sets `deleted_at = null`
