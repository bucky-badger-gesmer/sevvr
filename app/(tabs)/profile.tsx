import { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatCard } from '@/components/stat-card';
import { useAuth } from '@/hooks/use-auth';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import * as statsService from '@/lib/stats-service';
import * as streakService from '@/lib/streak-service';
import { formatDurationShort } from '@/lib/format';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount, updateEmail } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total_sever_seconds: 0, best_session_seconds: 0, total_sessions: 0 });
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [challengeRecord, setChallengeRecord] = useState({ wins: 0, losses: 0 });
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      (async () => {
        const [statsData, streakData, recordData] = await Promise.all([
          statsService.getUserStats(user.id),
          streakService.getStreak(user.id),
          supabase.from('challenge_records').select('wins,losses').eq('user_id', user.id).single().then(({ data }) => data),
        ]);
        setStats(statsData);
        setStreak(streakData);
        setChallengeRecord(recordData ?? { wins: 0, losses: 0 });
        setNewEmail(user.email ?? '');
        setEmailSuccess(false);
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

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;
    setEmailLoading(true);
    setEmailSuccess(false);
    try {
      await updateEmail(newEmail);
      setEmailSuccess(true);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={[styles.container, { paddingTop: insets.top + 24 }]}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: colors.tint + '30' }]}>
          <ThemedText style={[styles.avatarText, { color: colors.tint }]}>
            {(user?.user_metadata?.username?.[0] ?? '?').toUpperCase()}
          </ThemedText>
        </View>

        {/* User info */}
        <ThemedText style={styles.username}>
          @{user?.user_metadata?.username ?? 'unknown'}
        </ThemedText>
        <ThemedText style={[styles.email, { color: colors.muted }]}>{user?.email}</ThemedText>

        {/* Stat cards */}
        <View style={styles.statGrid}>
          <View style={styles.statRow}>
            <StatCard label="Total Time" value={formatDurationShort(stats.total_sever_seconds)} icon="🌱" />
            <StatCard label="Streak" value={`${streak.currentStreak}d`} icon="🔥" />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Best Session" value={formatDurationShort(stats.best_session_seconds)} highlight icon="🌸" />
            <StatCard label="Longest Streak" value={`${streak.longestStreak}d`} icon="🌿" />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Wins" value={String(challengeRecord.wins)} icon="🏆" />
            <StatCard label="Losses" value={String(challengeRecord.losses)} icon="💔" />
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Email Update */}
        <View style={styles.emailSection}>
          <ThemedText style={styles.sectionLabel}>Email</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: Typography.body.fontFamily }]}
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.muted}
          />
          {emailSuccess && (
            <ThemedText style={[styles.successText, { color: colors.success ?? colors.tint }]}>
              Confirmation email sent. Check your inbox.
            </ThemedText>
          )}
          <TouchableOpacity
            style={[styles.button, { borderColor: colors.tint, backgroundColor: colors.tint + '10' }]}
            onPress={handleUpdateEmail}
            disabled={emailLoading || !newEmail || newEmail === user?.email}
          >
            {emailLoading ? (
              <ActivityIndicator color={colors.tint} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: colors.tint }]}>Update Email</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { borderColor: colors.border }]}
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <ThemedText style={styles.buttonText}>Log Out</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { borderColor: colors.error + '40' }]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <ThemedText style={[styles.buttonText, { color: colors.error }]}>Delete Account</ThemedText>
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
    paddingHorizontal: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  statGrid: {
    width: '100%',
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 32,
  },
  emailSection: {
    width: '100%',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  successText: {
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  button: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 15,
  },
});
