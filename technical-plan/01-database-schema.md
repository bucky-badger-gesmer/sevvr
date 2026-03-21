# 01 — Database Schema (Supabase PostgreSQL)

All tables live in the `public` schema. Supabase Auth manages `auth.users` separately. Every table uses Row-Level Security (RLS).

---

## Tables

### `profiles`

Extends Supabase Auth. Created automatically via trigger on user signup.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | Matches auth user ID |
| `username` | `text` | UNIQUE, NOT NULL | Searchable handle, set at signup |
| `display_name` | `text` | | Optional friendly name |
| `avatar_url` | `text` | | Profile picture URL |
| `push_token` | `text` | | Expo push token for notifications |
| `streak_reminder_hour` | `smallint` | DEFAULT 20 | Hour (0-23) for streak-at-risk reminder |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |
| `deleted_at` | `timestamptz` | | Soft delete; cascade after 24h |

**RLS Policies:**
- **SELECT own**: `auth.uid() = id`
- **SELECT friends**: `id IN (SELECT friend_id FROM accepted_friends_view WHERE user_id = auth.uid())` — returns limited columns (username, display_name, avatar_url)
- **SELECT for search**: `auth.uid() IS NOT NULL` — username search only, limited columns
- **UPDATE**: `auth.uid() = id`
- **INSERT**: Disabled for client (trigger-only via `service_role`)

---

### `sessions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE, NOT NULL | |
| `started_at` | `timestamptz` | NOT NULL | When countdown hit 0 |
| `ended_at` | `timestamptz` | | NULL while session is active |
| `duration_seconds` | `integer` | | Computed on session end |
| `ended_reason` | `text` | CHECK IN (`'unlock'`, `'movement'`, `'cancel'`) | How the session ended |
| `challenge_id` | `uuid` | FK → `challenges(id)`, NULLABLE | If part of a challenge |
| `missed_content` | `jsonb` | DEFAULT `'{}'` | e.g. `{"tweets": 150, "tiktoks": 17}` |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**Indexes:**
- `idx_sessions_user_started` on `(user_id, started_at DESC)` — history queries
- `idx_sessions_user_date` on `(user_id, DATE(started_at))` — daily totals
- `idx_sessions_active` on `(user_id)` WHERE `ended_at IS NULL` — find active session

**RLS Policies:**
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id AND ended_at IS NULL` (can only update own active session)
- **DELETE**: Disabled

---

### `streaks`

One row per user. Created by the `handle_new_user` trigger.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE, UNIQUE | One row per user |
| `current_streak` | `integer` | DEFAULT 0 | |
| `longest_streak` | `integer` | DEFAULT 0 | |
| `last_session_date` | `date` | | Last calendar day with a completed session |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |

**RLS Policies:**
- **SELECT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`

---

### `friendships`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `requester_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Who sent the request |
| `addressee_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Who received it |
| `status` | `text` | CHECK IN (`'pending'`, `'accepted'`, `'declined'`), DEFAULT `'pending'` | |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |

**Constraints:**
- UNIQUE on `(requester_id, addressee_id)`
- CHECK `requester_id != addressee_id`

**Indexes:**
- `idx_friendships_addressee_status` on `(addressee_id, status)` — pending request lookup

**RLS Policies:**
- **SELECT**: `auth.uid() IN (requester_id, addressee_id)`
- **INSERT**: `auth.uid() = requester_id`
- **UPDATE**: `auth.uid() = addressee_id` (only recipient can accept/decline)
- **DELETE**: `auth.uid() IN (requester_id, addressee_id)` (either party can unfriend)

---

### `challenges`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `challenger_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | |
| `challenged_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE, NULLABLE | NULL for SMS invites to non-users |
| `status` | `text` | CHECK IN (`'pending'`, `'accepted'`, `'active'`, `'completed'`, `'expired'`, `'declined'`) | |
| `winner_id` | `uuid` | FK → `profiles(id)`, NULLABLE | Set on completion |
| `challenger_duration` | `integer` | | Seconds |
| `challenged_duration` | `integer` | | Seconds |
| `invite_token` | `text` | UNIQUE, NOT NULL | For deep link / SMS invite |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `expires_at` | `timestamptz` | | Auto-expire pending after 24h |
| `completed_at` | `timestamptz` | | |

**Indexes:**
- `idx_challenges_participants` on `(challenger_id, challenged_id, status)`
- `idx_challenges_invite_token` on `(invite_token)`

**RLS Policies:**
- **SELECT**: `auth.uid() IN (challenger_id, challenged_id)`
- **INSERT**: `auth.uid() = challenger_id`
- **UPDATE**: `auth.uid() IN (challenger_id, challenged_id)`

---

### `challenge_records`

Denormalized win/loss per user for fast profile display. One row per user.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK → `profiles(id)` ON DELETE CASCADE | |
| `wins` | `integer` | DEFAULT 0 | |
| `losses` | `integer` | DEFAULT 0 | |
| `total_challenges` | `integer` | DEFAULT 0 | |

**RLS Policies:**
- **SELECT**: `true` (public stat — anyone can see challenge records)
- **UPDATE**: Disabled for client (updated via database function with `SECURITY DEFINER`)

---

## Database Functions

### `handle_new_user()` — TRIGGER

**Fires:** AFTER INSERT on `auth.users`
**Action:** Creates a `profiles` row (copying `username` from `raw_user_meta_data`), a `streaks` row (initial zeros), and a `challenge_records` row.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');

  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);

  INSERT INTO public.challenge_records (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `update_streak(p_user_id uuid)` — RPC

Called after session completion. Algorithm:

1. Get `last_session_date` from `streaks` for this user
2. If `last_session_date = CURRENT_DATE` → do nothing (already credited today)
3. If `last_session_date = CURRENT_DATE - 1` → increment `current_streak`
4. If `last_session_date < CURRENT_DATE - 1` OR NULL → reset `current_streak = 1`
5. If `current_streak > longest_streak` → update `longest_streak`
6. Set `last_session_date = CURRENT_DATE`

```sql
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_last_date date;
  v_current integer;
  v_longest integer;
BEGIN
  SELECT last_session_date, current_streak, longest_streak
  INTO v_last_date, v_current, v_longest
  FROM public.streaks WHERE user_id = p_user_id;

  IF v_last_date = CURRENT_DATE THEN
    RETURN; -- Already counted today
  ELSIF v_last_date = CURRENT_DATE - 1 THEN
    v_current := v_current + 1;
  ELSE
    v_current := 1;
  END IF;

  IF v_current > v_longest THEN
    v_longest := v_current;
  END IF;

  UPDATE public.streaks
  SET current_streak = v_current,
      longest_streak = v_longest,
      last_session_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `get_friends_leaderboard(p_user_id uuid)` — RPC

Returns weekly sever totals for the user and their accepted friends.

```sql
CREATE OR REPLACE FUNCTION public.get_friends_leaderboard(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  weekly_seconds bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(s.duration_seconds), 0)::bigint AS weekly_seconds
  FROM public.profiles p
  LEFT JOIN public.sessions s
    ON s.user_id = p.id
    AND s.ended_at IS NOT NULL
    AND s.started_at >= DATE_TRUNC('week', CURRENT_DATE)
  WHERE p.id = p_user_id
    OR p.id IN (
      SELECT CASE
        WHEN f.requester_id = p_user_id THEN f.addressee_id
        ELSE f.requester_id
      END
      FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (f.requester_id = p_user_id OR f.addressee_id = p_user_id)
    )
  GROUP BY p.id, p.username, p.display_name, p.avatar_url
  ORDER BY weekly_seconds DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `get_global_leaderboard()` — RPC

Returns top 100 users by weekly sever time.

```sql
CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  weekly_seconds bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(s.duration_seconds), 0)::bigint AS weekly_seconds
  FROM public.profiles p
  LEFT JOIN public.sessions s
    ON s.user_id = p.id
    AND s.ended_at IS NOT NULL
    AND s.started_at >= DATE_TRUNC('week', CURRENT_DATE)
  GROUP BY p.id, p.username, p.display_name, p.avatar_url
  ORDER BY weekly_seconds DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `resolve_challenge(p_challenge_id uuid)` — RPC

Called when both participants have ended sessions. Sets winner, updates records.

```sql
CREATE OR REPLACE FUNCTION public.resolve_challenge(p_challenge_id uuid)
RETURNS void AS $$
DECLARE
  v_challenge record;
  v_winner_id uuid;
  v_loser_id uuid;
BEGIN
  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;

  IF v_challenge.challenger_duration IS NULL OR v_challenge.challenged_duration IS NULL THEN
    RETURN; -- Both durations not yet recorded
  END IF;

  IF v_challenge.challenger_duration >= v_challenge.challenged_duration THEN
    v_winner_id := v_challenge.challenger_id;
    v_loser_id := v_challenge.challenged_id;
  ELSE
    v_winner_id := v_challenge.challenged_id;
    v_loser_id := v_challenge.challenger_id;
  END IF;

  UPDATE public.challenges
  SET winner_id = v_winner_id, status = 'completed', completed_at = now()
  WHERE id = p_challenge_id;

  UPDATE public.challenge_records
  SET wins = wins + 1, total_challenges = total_challenges + 1
  WHERE user_id = v_winner_id;

  UPDATE public.challenge_records
  SET losses = losses + 1, total_challenges = total_challenges + 1
  WHERE user_id = v_loser_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Views

### `daily_session_totals`

```sql
CREATE VIEW public.daily_session_totals AS
SELECT
  user_id,
  DATE(started_at) AS session_date,
  COUNT(*) AS session_count,
  SUM(duration_seconds) AS total_seconds
FROM public.sessions
WHERE ended_at IS NOT NULL
GROUP BY user_id, DATE(started_at);
```

### `user_stats`

```sql
CREATE VIEW public.user_stats AS
SELECT
  user_id,
  SUM(duration_seconds) AS total_sever_seconds,
  MAX(duration_seconds) AS best_session_seconds,
  COUNT(*) AS total_sessions
FROM public.sessions
WHERE ended_at IS NOT NULL
GROUP BY user_id;
```

Both views inherit RLS from the underlying `sessions` table.

---

## Supabase Realtime

Enable Realtime on the `challenges` table for live head-to-head updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
```

This allows clients to subscribe to changes on specific challenge rows during active challenges.
