import { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CalendarHeatmap } from '@/components/calendar-heatmap';
import { StatCard } from '@/components/stat-card';
import { SessionListItem } from '@/components/session-list-item';
import { BotanicalEmptyState } from '@/components/botanical-empty-state';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as statsService from '@/lib/stats-service';
import { formatDurationShort } from '@/lib/format';
import type { Database } from '@/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const monthName = d.toLocaleDateString('en-US', { month: 'long' });
  const day = d.getDate();
  return `${DAY_NAMES[d.getDay()]}, ${monthName} ${day}`;
}

function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StatsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const now = new Date();
  const today = getToday();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [stats, setStats] = useState({ total_sever_seconds: 0, best_session_seconds: 0, total_sessions: 0 });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bestId, setBestId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  useFocusEffect(
    useCallback(() => {
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
    }, [user, calYear, calMonth])
  );

  useFocusEffect(
    useCallback(() => {
      if (!user || !selectedDate) return;

      (async () => {
        const data = await statsService.getSessionsForDate(user.id, selectedDate);
        setSessions(data);
      })();
    }, [user, selectedDate])
  );

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handlePrevDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) {
      setSelectedDate(next);
    }
  };

  const renderSession = ({ item }: { item: Session }) => (
    <SessionListItem session={item} isPersonalBest={item.id === bestId} />
  );

  const ListHeader = () => (
    <>
      <CalendarHeatmap
        activeDates={activeDates}
        year={calYear}
        month={calMonth}
        selectedDate={selectedDate}
        onMonthChange={handleMonthChange}
        onDayPress={handleDayPress}
      />

      <View style={styles.statRow}>
        <StatCard label="Total Time" value={formatDurationShort(stats.total_sever_seconds)} icon="⏱" />
        <StatCard label="Best" value={formatDurationShort(stats.best_session_seconds)} highlight icon="🌸" />
        <StatCard label="Sessions" value={String(stats.total_sessions)} icon="📊" />
      </View>

      <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

      {/* Day header with navigation */}
      <View style={styles.dayHeader}>
        <TouchableOpacity
          onPress={handlePrevDay}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ThemedText style={[styles.dayNav, { color: colors.muted }]}>‹</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.dayTitle}>{formatDateLabel(selectedDate)}</ThemedText>

        <TouchableOpacity
          onPress={handleNextDay}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={selectedDate >= today}
        >
          <ThemedText style={[
            styles.dayNav,
            { color: selectedDate >= today ? colors.border : colors.muted },
          ]}>›</ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <BotanicalEmptyState
            icon="🌱"
            title="No sessions on this day"
            subtitle="Tap another day in the calendar to see its sessions"
          />
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
  sectionDivider: {
    height: 1,
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayNav: {
    fontSize: 24,
    fontWeight: '300',
  },
});