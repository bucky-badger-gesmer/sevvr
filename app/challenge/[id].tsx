import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as challengeService from '@/lib/challenge-service';
import type { Challenge } from '@/types/social';

const PENDING_CHALLENGE_KEY = 'pending_challenge_token';

export default function ChallengeDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;

    challengeService.getChallengeByToken(id)
      .then((data) => {
        if (!data) {
          setError('Challenge not found or expired.');
        } else {
          setChallenge(data);
        }
      })
      .catch(() => setError('Failed to load challenge.'))
      .finally(() => setLoading(false));
  }, [user, id]);

  useEffect(() => {
    if (!user && id) {
      AsyncStorage.setItem(PENDING_CHALLENGE_KEY, id);
    }
  }, [user, id]);

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Challenge Invite</ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign up to accept this challenge!
        </ThemedText>
        <Link href="/(auth)/signup">
          <ThemedText type="link">Create Account</ThemedText>
        </Link>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !challenge) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Challenge Invite</ThemedText>
        <ThemedText style={styles.subtitle}>{error ?? 'Something went wrong.'}</ThemedText>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <ThemedText type="link">Go Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const isSender = challenge.challenger_id === user.id;
  const alreadyClaimed = challenge.challenged_id !== null;

  const handleAccept = async () => {
    try {
      if (!alreadyClaimed) {
        // SMS invite — claim and accept in one step
        await challengeService.acceptChallengeByToken(challenge.id);
      } else {
        await challengeService.acceptChallenge(challenge.id);
      }
      router.replace('/(tabs)');
    } catch {
      setError('Failed to accept challenge.');
    }
  };

  const handleDecline = async () => {
    try {
      await challengeService.declineChallenge(challenge.id);
      router.replace('/(tabs)');
    } catch {
      setError('Failed to decline challenge.');
    }
  };

  if (isSender) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Your Challenge</ThemedText>
        <ThemedText style={styles.subtitle}>
          Waiting for someone to accept this challenge.
        </ThemedText>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <ThemedText type="link">Go Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Challenge Invite</ThemedText>
      <ThemedText style={styles.subtitle}>
        You&rsquo;ve been challenged! Do you accept?
      </ThemedText>
      <ThemedView style={styles.actions}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: Colors[colorScheme].tint }]}
          onPress={handleAccept}
        >
          <ThemedText style={styles.btnText}>Accept</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: Colors[colorScheme].icon }]}
          onPress={handleDecline}
        >
          <ThemedText>Decline</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  subtitle: {
    opacity: 0.6,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  acceptBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  declineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
  },
});
