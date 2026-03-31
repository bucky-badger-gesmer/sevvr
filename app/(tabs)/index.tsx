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
import * as streakService from '@/lib/streak-service';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const { sessionState, activeSession, dismissMessage, dispatch } = useSession();
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [streak, setStreak] = useState(0);
  const [dailySeconds, setDailySeconds] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      (async () => {
        const streakData = await streakService.getStreak(user.id).catch(() => null);
        if (streakData) setStreak(streakData.currentStreak);

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

  useEffect(() => {
    if (sessionState === 'ended') {
      router.push('/(modals)/life-unlocked');
    }
  }, [sessionState, router]);

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

  if (sessionState === 'active' && activeSession) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.activeIcon}>🌿</ThemedText>
        <ThemedText type="heading">Session Active</ThemedText>
        <ThemedText style={[styles.hint, { color: colors.muted }]}>
          Lock your phone to keep severing
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Daily stats header */}
      <View style={styles.header}>
        <ThemedText type="mono" style={[styles.dailyStat, { color: colors.muted }]}>
          Today: {formatTime(dailySeconds)}
          {dailyCount > 0 ? `  (${dailyCount})` : ''}
        </ThemedText>
      </View>

      {/* Dismiss message */}
      {dismissMessage && (
        <View style={[styles.dismissBanner, { backgroundColor: colors.error + '15' }]}>
          <ThemedText style={[styles.dismissText, { color: colors.error }]}>
            {dismissMessage}
          </ThemedText>
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

      {/* Countdown overlay */}
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
  activeIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  header: {
    position: 'absolute',
    top: 80,
  },
  dailyStat: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  streakContainer: {
    marginTop: 32,
  },
  hint: {
    marginTop: 8,
    fontSize: 15,
  },
  dismissBanner: {
    position: 'absolute',
    top: 120,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
  },
});