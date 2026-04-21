import { supabase } from './supabase';
import type { LeaderboardEntry } from '@/types/social';

export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_friends_leaderboard', {
    p_user_id: userId,
  });

  if (error) throw error;

  return (data ?? []).map((row: any, index: number) => ({
    rank: index + 1,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    weeklySeconds: row.weekly_seconds,
    isCurrentUser: row.user_id === userId,
  }));
}

export async function getGlobalLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_global_leaderboard');

  if (error) throw error;

  return (data ?? []).map((row: any, index: number) => ({
    rank: index + 1,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    weeklySeconds: row.weekly_seconds,
    isCurrentUser: row.user_id === userId,
  }));
}
