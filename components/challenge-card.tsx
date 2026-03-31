import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius } from '@/constants/theme';
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
  const colors = Colors[colorScheme];
  const isSender = challenge.challenger_id === currentUserId;

  const getStatusIcon = () => {
    if (challenge.status === 'pending') return isSender ? '🌱' : '🌿';
    if (challenge.status === 'accepted' || challenge.status === 'active') return '🌿';
    if (challenge.status === 'completed') {
      return challenge.winner_id === currentUserId ? '🌸' : '🍂';
    }
    return '🌿';
  };

  if (challenge.status === 'pending') {
    if (isSender) {
      return (
        <Animated.View entering={FadeIn.duration(300)}>
          <ThemedView style={[styles.card, { borderColor: colors.border }]}>
            <ThemedText style={styles.icon}>{getStatusIcon()}</ThemedText>
            <ThemedText style={styles.status}>Waiting for opponent...</ThemedText>
          </ThemedView>
        </Animated.View>
      );
    }
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <ThemedView style={[styles.card, { borderColor: colors.border }]}>
          <ThemedText style={styles.icon}>{getStatusIcon()}</ThemedText>
          <ThemedText style={styles.status}>You have been challenged!</ThemedText>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: colors.tint }]}
              onPress={onAccept}
            >
              <ThemedText style={styles.btnText}>Accept</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.declineBtn, { borderColor: colors.border }]}
              onPress={onDecline}
            >
              <ThemedText style={[styles.declineBtnText, { color: colors.muted }]}>Decline</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Animated.View>
    );
  }

  if (challenge.status === 'accepted' || challenge.status === 'active') {
    const myDuration = isSender ? challenge.challenger_duration : challenge.challenged_duration;
    const alreadyGone = myDuration !== null;

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <ThemedView style={[styles.card, { borderColor: colors.border }]}>
          <ThemedText style={styles.icon}>{getStatusIcon()}</ThemedText>
          <ThemedText style={styles.status}>Challenge active</ThemedText>
          {alreadyGone ? (
            <>
              <ThemedText style={[styles.sub, { color: colors.muted }]}>
                Your time: {formatDuration(myDuration!)}
              </ThemedText>
              <ThemedText style={[styles.sub, { color: colors.muted }]}>
                Waiting for opponent...
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={[styles.sub, { color: colors.muted }]}>
                Start a sever session to compete!
              </ThemedText>
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.tint }]}
                onPress={onStart}
              >
                <ThemedText style={styles.btnText}>Start your session</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>
      </Animated.View>
    );
  }

  if (challenge.status === 'completed') {
    const won = challenge.winner_id === currentUserId;
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <ThemedView style={[styles.card, { borderColor: colors.border }]}>
          <ThemedText style={styles.icon}>{getStatusIcon()}</ThemedText>
          <ThemedText style={[styles.status, won && { color: colors.success }]}>
            {won ? 'You won!' : 'You lost'}
          </ThemedText>
          <ThemedText style={[styles.sub, { color: colors.muted }]}>
            {formatDuration(challenge.challenger_duration ?? 0)} vs{' '}
            {formatDuration(challenge.challenged_duration ?? 0)}
          </ThemedText>
        </ThemedView>
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    gap: 8,
    borderWidth: 1,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  status: {
    fontSize: 15,
    fontWeight: '600',
  },
  sub: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  acceptBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.md,
  },
  startBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  declineBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});