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
  // Use local midnight boundaries to avoid UTC date attribution errors
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select('started_at')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', startDate)
    .lt('started_at', endDate);

  if (error) throw error;

  // Return unique local dates — calendar only needs to know if a day had any sessions
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

export async function getSessionsForDate(userId: string, date: string) {
  const parts = date.split('-');
  const startOfDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toISOString();
  const endOfDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + 1).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', startOfDay)
    .lt('started_at', endOfDay)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
