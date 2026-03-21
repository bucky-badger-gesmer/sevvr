-- ============================================================
-- sevvr — Initial Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  push_token text,
  streak_reminder_hour smallint DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can search profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Sessions
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_seconds integer,
  ended_reason text CHECK (ended_reason IN ('unlock', 'movement', 'cancel')),
  challenge_id uuid,
  missed_content jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sessions_user_started ON public.sessions (user_id, started_at DESC);
CREATE INDEX idx_sessions_active ON public.sessions (user_id) WHERE ended_at IS NULL;

CREATE POLICY "Users can read own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id AND ended_at IS NULL);

-- Streaks (one row per user)
CREATE TABLE public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_session_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Friendships
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_friendships_addressee_status ON public.friendships (addressee_id, status);

CREATE POLICY "Users can read own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() IN (requester_id, addressee_id));

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can respond to friend requests"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

CREATE POLICY "Either party can remove friendship"
  ON public.friendships FOR DELETE
  USING (auth.uid() IN (requester_id, addressee_id));

-- Challenges
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenged_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'expired', 'declined')),
  winner_id uuid REFERENCES public.profiles(id),
  challenger_duration integer,
  challenged_duration integer,
  invite_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_challenges_participants ON public.challenges (challenger_id, challenged_id, status);
CREATE INDEX idx_challenges_invite_token ON public.challenges (invite_token);

CREATE POLICY "Participants can read own challenges"
  ON public.challenges FOR SELECT
  USING (auth.uid() IN (challenger_id, challenged_id));

CREATE POLICY "Users can create challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update challenges"
  ON public.challenges FOR UPDATE
  USING (auth.uid() IN (challenger_id, challenged_id));

-- Add FK from sessions to challenges (now that challenges table exists)
ALTER TABLE public.sessions
  ADD CONSTRAINT fk_sessions_challenge
  FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);

-- Challenge Records (denormalized win/loss)
CREATE TABLE public.challenge_records (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  total_challenges integer DEFAULT 0
);

ALTER TABLE public.challenge_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read challenge records"
  ON public.challenge_records FOR SELECT
  USING (true);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW public.daily_session_totals AS
SELECT
  user_id,
  DATE(started_at) AS session_date,
  COUNT(*)::integer AS session_count,
  COALESCE(SUM(duration_seconds), 0)::integer AS total_seconds
FROM public.sessions
WHERE ended_at IS NOT NULL
GROUP BY user_id, DATE(started_at);

CREATE VIEW public.user_stats AS
SELECT
  user_id,
  COALESCE(SUM(duration_seconds), 0)::integer AS total_sever_seconds,
  COALESCE(MAX(duration_seconds), 0)::integer AS best_session_seconds,
  COUNT(*)::integer AS total_sessions
FROM public.sessions
WHERE ended_at IS NOT NULL
GROUP BY user_id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile, streak, and challenge_records on signup
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

-- Update streak after session completion
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
    RETURN;
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

-- Friends leaderboard (weekly)
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

-- Global leaderboard (weekly, top 100)
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

-- Resolve challenge (determine winner)
CREATE OR REPLACE FUNCTION public.resolve_challenge(p_challenge_id uuid)
RETURNS void AS $$
DECLARE
  v_challenge record;
  v_winner_id uuid;
  v_loser_id uuid;
BEGIN
  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;

  IF v_challenge.challenger_duration IS NULL OR v_challenge.challenged_duration IS NULL THEN
    RETURN;
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

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
