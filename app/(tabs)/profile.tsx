import { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatCard } from '@/components/stat-card';
import { StreakBadge } from '@/components/streak-badge';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as statsService from '@/lib/stats-service';
import * as streakService from '@/lib/streak-service';
import { formatDurationShort } from '@/lib/format';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total_sever_seconds: 0, best_session_seconds: 0, total_sessions: 0 });
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      (async () => {
        const [statsData, streakData] = await Promise.all([
          statsService.getUserStats(user.id),
          streakService.getStreak(user.id),
        ]);
        setStats(statsData);
        setStreak(streakData);
      })();
    }, [user])
  );

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your account will be permanently deleted in 24 hours. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount();
            } catch {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        {/* User info */}
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
        <ThemedText style={styles.username}>
          @{user?.user_metadata?.username ?? 'unknown'}
        </ThemedText>

        {/* Stat cards */}
        <View style={styles.statGrid}>
          <View style={styles.statRow}>
            <StatCard label="Total Time" value={formatDurationShort(stats.total_sever_seconds)} />
            <StatCard label="Streak" value={`${streak.currentStreak}d`} />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Best Session" value={formatDurationShort(stats.best_session_seconds)} highlight />
            <StatCard label="Longest Streak" value={`${streak.longestStreak}d`} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { borderColor: Colors[colorScheme].icon }]}
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors[colorScheme].text} />
            ) : (
              <ThemedText>Log Out</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <ThemedText style={styles.deleteText}>Delete Account</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    gap: 8,
  },
  email: {
    opacity: 0.6,
  },
  username: {
    marginBottom: 16,
  },
  statGrid: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  deleteButton: {
    borderColor: '#e53e3e',
  },
  deleteText: {
    color: '#e53e3e',
  },
});
