import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CalendarHeatmap } from '@/components/calendar-heatmap';
import { StatCard } from '@/components/stat-card';
import { SessionListItem } from '@/components/session-list-item';
import { useAuth } from '@/hooks/use-auth';
import * as statsService from '@/lib/stats-service';
import { formatDurationShort } from '@/lib/format';
import type { Database } from '@/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];

const PAGE_SIZE = 20;

export default function StatsScreen() {
  const { user } = useAuth();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [stats, setStats] = useState({ total_sever_seconds: 0, best_session_seconds: 0, total_sessions: 0 });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bestId, setBestId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Fetch stats and calendar data
  useEffect(() => {
    if (!user) return;

    (async () => {
      const [statsData, calData, best] = await Promise.all([
        statsService.getUserStats(user.id),
        statsService.getCalendarData(user.id, calYear, calMonth),
        statsService.getPersonalBest(user.id),
      ]);
      setStats(statsData);
      setActiveDates(calData);
      setBestId(best?.id ?? null);
    })();
  }, [user, calYear, calMonth]);

  // Fetch session history
  const loadSessions = useCallback(async (pageNum: number) => {
    if (!user || loading) return;
    setLoading(true);

    const result = await statsService.getSessionHistory(user.id, pageNum, PAGE_SIZE);
    if (pageNum === 0) {
      setSessions(result.sessions);
    } else {
      setSessions((prev) => [...prev, ...result.sessions]);
    }
    setHasMore(result.hasMore);
    setPage(pageNum);
    setLoading(false);
  }, [user, loading]);

  useEffect(() => {
    loadSessions(0);
  }, [user]);

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const renderSession = ({ item }: { item: Session }) => (
    <SessionListItem session={item} isPersonalBest={item.id === bestId} />
  );

  const ListHeader = () => (
    <>
      {/* Calendar */}
      <CalendarHeatmap
        activeDates={activeDates}
        year={calYear}
        month={calMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Stat cards */}
      <View style={styles.statRow}>
        <StatCard label="Total Time" value={formatDurationShort(stats.total_sever_seconds)} />
        <StatCard label="Best" value={formatDurationShort(stats.best_session_seconds)} highlight />
        <StatCard label="Sessions" value={String(stats.total_sessions)} />
      </View>

      {/* Section header */}
      <ThemedText style={styles.sectionTitle}>Session History</ThemedText>
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        onEndReached={() => hasMore && loadSessions(page + 1)}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>No sessions yet. Start severing!</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 24,
  },
});
