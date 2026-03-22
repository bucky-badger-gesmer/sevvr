import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDuration } from '@/lib/format';
import type { Challenge } from '@/types/social';

type ChallengeCardProps = {
  challenge: Challenge;
  currentUserId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onStart?: () => void;
};

export function ChallengeCard({ challenge, currentUserId, onAccept, onDecline, onStart }: ChallengeCardProps) {
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
    const myDuration = isSender ? challenge.challenger_duration : challenge.challenged_duration;
    const alreadyGone = myDuration !== null;

    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.status}>Challenge active</ThemedText>
        {alreadyGone ? (
          <>
            <ThemedText style={styles.sub}>Your time: {formatDuration(myDuration!)}</ThemedText>
            <ThemedText style={styles.sub}>Waiting for opponent...</ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={styles.sub}>Start a sever session to compete!</ThemedText>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={onStart}
            >
              <ThemedText style={styles.btnText}>Start your session</ThemedText>
            </TouchableOpacity>
          </>
        )}
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
  startBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
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
