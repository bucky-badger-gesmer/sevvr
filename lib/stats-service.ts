import { supabase } from './supabase';

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('total_sever_seconds, best_session_seconds, total_sessions')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? { total_sever_seconds: 0, best_session_seconds: 0, total_sessions: 0 };
}

export async function getSessionHistory(userId: string, page: number, limit: number) {
  const { data, error, count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) throw error;
  return {
    sessions: data ?? [],
    hasMore: (count ?? 0) > (page + 1) * limit,
  };
}

export async function getCalendarData(userId: string, year: number, month: number) {
  // Get all sessions for the given month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('sessions')
    .select('started_at')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', startDate)
    .lt('started_at', endDate);

  if (error) throw error;

  // Extract unique dates
  const dates = new Set(
    (data ?? []).map((s) => {
      const d = new Date(s.started_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );
  return Array.from(dates);
}

export async function getDailyTotal(userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_session_totals')
    .select('session_count, total_seconds')
    .eq('user_id', userId)
    .eq('session_date', date)
    .maybeSingle();

  if (error) throw error;
  return data ?? { session_count: 0, total_seconds: 0 };
}

export async function getPersonalBest(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('duration_seconds', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
