import { supabase } from './supabase';
import * as Crypto from 'expo-crypto';

function generateToken(): string {
  return Crypto.randomUUID();
}

export async function createChallenge(challengedId: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      challenger_id: user.id,
      challenged_id: challengedId,
      invite_token: generateToken(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptChallenge(challengeId: string) {
  const { error } = await supabase
    .from('challenges')
    .update({ status: 'accepted' })
    .eq('id', challengeId);

  if (error) throw error;
}

export async function declineChallenge(challengeId: string) {
  const { error } = await supabase
    .from('challenges')
    .update({ status: 'declined' })
    .eq('id', challengeId);

  if (error) throw error;
}

export async function getActiveChallenges(userId: string) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .or(`status.in.(pending,accepted,active),and(status.eq.completed,completed_at.gte.${twentyFourHoursAgo})`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getChallengeByToken(token: string) {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function recordChallengeDuration(
  challengeId: string,
  userId: string,
  durationSeconds: number
): Promise<void> {
  const { data: challenge, error: fetchError } = await supabase
    .from('challenges')
    .select('challenger_id, challenged_id, challenger_duration, challenged_duration')
    .eq('id', challengeId)
    .single();

  if (fetchError || !challenge) throw fetchError ?? new Error('Challenge not found');

  const isChallenger = challenge.challenger_id === userId;
  const column = isChallenger ? 'challenger_duration' : 'challenged_duration';

  const { error: updateError } = await supabase
    .from('challenges')
    .update({ [column]: durationSeconds, status: 'active' })
    .eq('id', challengeId);

  if (updateError) throw updateError;

  const otherDuration = isChallenger
    ? challenge.challenged_duration
    : challenge.challenger_duration;

  if (otherDuration !== null) {
    await supabase.rpc('resolve_challenge', { p_challenge_id: challengeId });
  }
}

export async function acceptChallengeByToken(challengeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('challenges')
    .update({ challenged_id: user.id, status: 'accepted' })
    .eq('id', challengeId);

  if (error) throw error;
}
