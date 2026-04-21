-- ============================================================
-- sevvr — Notification Triggers & Streak Reminder Support
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable pg_net extension for HTTP calls from PostgreSQL triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- NOTE: Before the triggers below will work, you must configure these settings
-- in your Supabase project (Dashboard → Settings → Database → Config):
--
--   ALTER DATABASE postgres SET "app.settings.edge_function_url" TO 'https://<PROJECT_REF>.supabase.co/functions/v1';
--   ALTER DATABASE postgres SET "app.settings.service_role_key" TO '<SERVICE_ROLE_KEY>';
--
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> with your actual values.

-- ============================================================
-- RPC: Get users who need a streak reminder
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_streak_reminder_users(p_hour smallint)
RETURNS TABLE (
  user_id uuid,
  push_token text,
  current_streak integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.push_token,
    s.current_streak
  FROM public.profiles p
  JOIN public.streaks s ON s.user_id = p.id
  WHERE p.push_token IS NOT NULL
    AND p.streak_reminder_hour = p_hour
    AND s.current_streak > 0
    AND s.last_session_date = CURRENT_DATE - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: Notify challenged user when a challenge is created
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_challenge_created()
RETURNS TRIGGER AS $$
DECLARE
  v_challenger_name text;
  v_push_token text;
BEGIN
  -- Get challenger's username
  SELECT username INTO v_challenger_name
  FROM public.profiles WHERE id = NEW.challenger_id;

  -- Get challenged user's push token
  SELECT push_token INTO v_push_token
  FROM public.profiles WHERE id = NEW.challenged_id;

  IF v_push_token IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.edge_function_url') || '/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'pushToken', v_push_token,
        'title', 'Challenge Received!',
        'body', '@' || v_challenger_name || ' challenged you to sever!',
        'data', jsonb_build_object('type', 'challenge_invite', 'challengeId', NEW.id::text)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_challenge_created
  AFTER INSERT ON public.challenges
  FOR EACH ROW
  WHEN (NEW.challenged_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_challenge_created();

-- ============================================================
-- TRIGGER: Notify both participants when challenge completes
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_challenge_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_name text;
  v_loser_id uuid;
  v_winner_token text;
  v_loser_token text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT username INTO v_winner_name FROM public.profiles WHERE id = NEW.winner_id;

    -- Determine loser
    v_loser_id := CASE
      WHEN NEW.winner_id = NEW.challenger_id THEN NEW.challenged_id
      ELSE NEW.challenger_id
    END;

    -- Get push tokens
    SELECT push_token INTO v_winner_token FROM public.profiles WHERE id = NEW.winner_id;
    SELECT push_token INTO v_loser_token FROM public.profiles WHERE id = v_loser_id;

    -- Notify winner
    IF v_winner_token IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url') || '/send-push',
        headers := jsonb_build_object('Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
        body := jsonb_build_object(
          'pushToken', v_winner_token,
          'title', 'You won!',
          'body', 'You won the sever challenge!',
          'data', jsonb_build_object('type', 'challenge_result', 'challengeId', NEW.id::text))
      );
    END IF;

    -- Notify loser
    IF v_loser_token IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url') || '/send-push',
        headers := jsonb_build_object('Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
        body := jsonb_build_object(
          'pushToken', v_loser_token,
          'title', 'Challenge Complete',
          'body', '@' || v_winner_name || ' beat you this time. Rematch?',
          'data', jsonb_build_object('type', 'challenge_result', 'challengeId', NEW.id::text))
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_challenge_completed
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_challenge_completed();
