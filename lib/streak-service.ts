import { supabase } from './supabase';

export async function getStreak(userId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_session_date')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastSessionDate: data.last_session_date,
  };
}
