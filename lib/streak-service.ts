import { supabase } from './supabase';

function isStreakActive(lastSessionDate: string | null): boolean {
  if (!lastSessionDate) return false;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return lastSessionDate === todayStr || lastSessionDate === yesterdayStr;
}

export async function getStreak(userId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_session_date')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  const active = isStreakActive(data.last_session_date);
  return {
    currentStreak: active ? data.current_streak : 0,
    longestStreak: data.longest_streak,
    lastSessionDate: data.last_session_date,
  };
}
