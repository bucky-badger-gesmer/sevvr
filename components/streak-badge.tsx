import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type StreakBadgeProps = {
  count: number;
  size?: 'small' | 'large';
};

export function StreakBadge({ count, size = 'large' }: StreakBadgeProps) {
  const isLarge = size === 'large';

  if (count === 0) {
    return (
      <View style={styles.container}>
        <ThemedText style={[styles.label, !isLarge && styles.smallLabel]}>
          Start a streak!
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.flame, !isLarge && styles.smallFlame]}>
        {'\uD83D\uDD25'}
      </ThemedText>
      <ThemedText style={[styles.count, !isLarge && styles.smallCount]}>
        {count}-day streak
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flame: {
    fontSize: 24,
  },
  smallFlame: {
    fontSize: 16,
  },
  count: {
    fontSize: 18,
    fontWeight: '600',
  },
  smallCount: {
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    opacity: 0.5,
  },
  smallLabel: {
    fontSize: 12,
  },
});
