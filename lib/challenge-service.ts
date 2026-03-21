import { supabase } from './supabase';
import { nanoid } from 'nanoid';

export async function createChallenge(challengedId: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      challenger_id: user.id,
      challenged_id: challengedId,
      invite_token: nanoid(),
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
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .in('status', ['pending', 'accepted', 'active'])
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
