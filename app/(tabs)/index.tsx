import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SeverButton } from '@/components/sever-button';
import { CountdownOverlay } from '@/components/countdown-overlay';
import { StreakBadge } from '@/components/streak-badge';
import { useSession } from '@/hooks/use-session';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { sessionState, activeSession, dismissMessage, dispatch } = useSession();
  const { user } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [dailySeconds, setDailySeconds] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  // Refetch streak and daily stats on tab focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      (async () => {
        const { data: streakData } = await supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .single();
        if (streakData) setStreak(streakData.current_streak);

        // Use local timezone for "today" range
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
        const { data: todaySessions } = await supabase
          .from('sessions')
          .select('duration_seconds')
          .eq('user_id', user.id)
          .not('ended_at', 'is', null)
          .gte('started_at', startOfDay)
          .lt('started_at', endOfDay);
        if (todaySessions) {
          setDailyCount(todaySessions.length);
          setDailySeconds(todaySessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0));
        }
      })();
    }, [user])
  );

  // Navigate to Life Unlocked when session ends
  useEffect(() => {
    if (sessionState === 'ended') {
      router.push('/(modals)/life-unlocked');
    }
  }, [sessionState, router]);

  // Auto-clear dismiss message after 3 seconds
  useEffect(() => {
    if (!dismissMessage) return;
    const timer = setTimeout(() => dispatch({ type: 'DISMISS' }), 3000);
    return () => clearTimeout(timer);
  }, [dismissMessage, dispatch]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Active session — user briefly opened app during session
  if (sessionState === 'active' && activeSession) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Session Active</ThemedText>
        <ThemedText style={styles.hint}>Lock your phone to keep severing</ThemedText>
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

      {/* Dismiss message */}
      {dismissMessage && (
        <View style={styles.dismissBanner}>
          <ThemedText style={styles.dismissText}>{dismissMessage}</ThemedText>
        </View>
      )}

      {/* Sever button */}
      <SeverButton
        onFillComplete={() => dispatch({ type: 'FILL_COMPLETE' })}
        disabled={sessionState !== 'idle' && sessionState !== 'holding'}
      />

      {/* Streak badge */}
      <View style={styles.streakContainer}>
        <StreakBadge count={streak} />
      </View>

      {/* Countdown overlay — lock phone during this window */}
      {sessionState === 'countdown' && (
        <CountdownOverlay
          onComplete={() => dispatch({ type: 'CANCEL', message: "Phone wasn't locked in time" })}
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
  hint: {
    marginTop: 8,
    opacity: 0.5,
  },
  dismissBanner: {
    position: 'absolute',
    top: 120,
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dismissText: {
    color: '#e53e3e',
    fontSize: 14,
  },
});
