import { supabase } from './supabase';
import { calculateMissedContent } from '@/constants/missed-content';

export async function startSession(userId: string, startedAt?: Date, challengeId?: string | null) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      started_at: (startedAt ?? new Date()).toISOString(),
      ...(challengeId ? { challenge_id: challengeId } : {}),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * End a session via SECURITY DEFINER RPC.
 * This bypasses RLS so it works even when the client auth token
 * hasn't fully initialized (e.g., after Expo Go remount).
 */
export async function endSession(
  sessionId: string,
  reason: 'unlock' | 'movement' | 'cancel',
  startedAt?: Date
) {
  // Compute missed content locally for the modal display
  const now = new Date();
  const localStart = startedAt ?? now;
  const localDuration = Math.max(1, Math.round((now.getTime() - localStart.getTime()) / 1000));
  const missedContent = calculateMissedContent(localDuration);

  // Call the SECURITY DEFINER RPC to update in Supabase
  const { data: dbDuration, error } = await supabase.rpc('end_session', {
    p_session_id: sessionId,
    p_ended_reason: reason,
    p_missed_content: missedContent,
  });

  // Use server-computed duration if available, otherwise local
  const durationSeconds = (dbDuration && dbDuration > 0) ? dbDuration : localDuration;

  if (error) throw error;

  return { durationSeconds, missedContent };
}

export async function getActiveSession(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function cancelSession(sessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .is('ended_at', null);

  if (error) throw error;
}
