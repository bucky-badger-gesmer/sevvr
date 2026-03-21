import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDuration } from '@/lib/format';
import type { Database } from '@/types/database';

type Challenge = Database['public']['Tables']['challenges']['Row'];

type ChallengeCardProps = {
  challenge: Challenge;
  currentUserId: string;
  onAccept?: () => void;
  onDecline?: () => void;
};

export function ChallengeCard({ challenge, currentUserId, onAccept, onDecline }: ChallengeCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isSender = challenge.challenger_id === currentUserId;

  if (challenge.status === 'pending') {
    if (isSender) {
      return (
        <ThemedView style={styles.card}>
          <ThemedText style={styles.status}>Waiting for opponent...</ThemedText>
        </ThemedView>
      );
    }
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.status}>You've been challenged!</ThemedText>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={onAccept}
          >
            <ThemedText style={styles.btnText}>Accept</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.declineBtn, { borderColor: Colors[colorScheme].icon }]}
            onPress={onDecline}
          >
            <ThemedText>Decline</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (challenge.status === 'accepted' || challenge.status === 'active') {
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.status}>Challenge active</ThemedText>
        <ThemedText style={styles.sub}>Start a sever session to compete!</ThemedText>
      </ThemedView>
    );
  }

  if (challenge.status === 'completed') {
    const won = challenge.winner_id === currentUserId;
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.status}>{won ? 'You won!' : 'You lost'}</ThemedText>
        <ThemedText style={styles.sub}>
          {formatDuration(challenge.challenger_duration ?? 0)} vs{' '}
          {formatDuration(challenge.challenged_duration ?? 0)}
        </ThemedText>
      </ThemedView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  status: {
    fontSize: 15,
    fontWeight: '600',
  },
  sub: {
    fontSize: 13,
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  declineBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
});
