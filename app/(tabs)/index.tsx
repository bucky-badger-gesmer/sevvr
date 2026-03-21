import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SeverButton } from '@/components/sever-button';
import { CountdownOverlay } from '@/components/countdown-overlay';
import { StreakBadge } from '@/components/streak-badge';
import { useSession } from '@/hooks/use-session';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { sessionState, activeSession, dispatch, startSession, endSession } = useSession();
  const { user } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [dailySeconds, setDailySeconds] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  // Fetch streak and daily stats
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();
      if (streakData) setStreak(streakData.current_streak);

      const today = new Date().toISOString().split('T')[0];
      const { data: dailyData } = await supabase
        .from('daily_session_totals')
        .select('session_count, total_seconds')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .maybeSingle();
      if (dailyData) {
        setDailySeconds(dailyData.total_seconds);
        setDailyCount(dailyData.session_count);
      }
    })();
  }, [user, sessionState]);

  // Navigate to Life Unlocked when session ends
  useEffect(() => {
    if (sessionState === 'ended') {
      router.push('/(modals)/life-unlocked');
    }
  }, [sessionState, router]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Active session — show elapsed timer
  if (sessionState === 'active' && activeSession) {
    const elapsed = Math.round(
      (Date.now() - activeSession.startedAt.getTime()) / 1000
    );
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Session Active</ThemedText>
        <ThemedText style={styles.elapsed}>{formatTime(elapsed)}</ThemedText>
        <ThemedText style={styles.hint}>Lock your phone to keep going</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Daily stats header */}
      <View style={styles.header}>
        <ThemedText style={styles.dailyStat}>
          Today: {formatTime(dailySeconds)}
          {dailyCount > 0 ? `  (${dailyCount})` : ''}
        </ThemedText>
      </View>

      {/* Sever button */}
      <SeverButton
        onFillComplete={() => dispatch({ type: 'FILL_COMPLETE' })}
        disabled={sessionState !== 'idle' && sessionState !== 'holding'}
      />

      {/* Streak badge */}
      <View style={styles.streakContainer}>
        <StreakBadge count={streak} />
      </View>

      {/* Countdown overlay */}
      {sessionState === 'countdown' && (
        <CountdownOverlay
          onComplete={() => startSession()}
          onCancel={() => dispatch({ type: 'CANCEL' })}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 80,
  },
  dailyStat: {
    fontSize: 16,
    opacity: 0.6,
  },
  streakContainer: {
    marginTop: 32,
  },
  elapsed: {
    fontSize: 48,
    fontWeight: '700',
    marginTop: 12,
  },
  hint: {
    marginTop: 8,
    opacity: 0.5,
  },
});
