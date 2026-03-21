import { supabase } from './supabase';
import type { Friend, FriendRequest } from '@/types/social';

export async function searchUsers(query: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query}%`)
    .neq('id', user.id)
    .is('deleted_at', null)
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function sendFriendRequest(addresseeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
    });

  if (error && error.code !== '23505') throw error; // Ignore unique constraint violation
}

export async function respondToRequest(friendshipId: string, accept: boolean) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', friendshipId);

  if (error) throw error;
}

export async function getFriends(userId: string): Promise<Friend[]> {
  // Get all accepted friendships where user is either requester or addressee
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Get the other user's ID for each friendship
  const friendIds = data.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  // Fetch profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', friendIds);

  if (profileError) throw profileError;
  return (profiles ?? []) as Friend[];
}

export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, created_at, requester_id')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fetch requester profiles
  const requesterIds = data.map((f) => f.requester_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', requesterIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.map((f) => ({
    id: f.id,
    requester: profileMap.get(f.requester_id) ?? {
      id: f.requester_id,
      username: 'unknown',
      display_name: null,
      avatar_url: null,
    },
    createdAt: f.created_at,
  }));
}

export async function removeFriend(friendshipId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) throw error;
}
