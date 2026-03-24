import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';

type StreakBadgeProps = {
  count: number;
  size?: 'small' | 'large';
};

const getStreakIcon = (count: number): string => {
  if (count >= 100) return '🌸';
  if (count >= 30) return '🌿';
  if (count >= 7) return '🌱';
  return '🔥';
};

const getStreakGlow = (count: number): string | null => {
  if (count >= 100) return '#D4A853';
  if (count >= 30) return '#8FA88B';
  if (count >= 7) return '#C67D5E';
  return null;
};

export function StreakBadge({ count, size = 'large' }: StreakBadgeProps) {
  const isLarge = size === 'large';
  const pulse = useSharedValue(1);

  const glowColor = getStreakGlow(count);

  if (count > 0) {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: count > 0 ? pulse.value : 1 }],
  }));

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
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <ThemedText style={[styles.icon, !isLarge && styles.smallIcon]}>
          {getStreakIcon(count)}
        </ThemedText>
        {glowColor && (
          <View
            style={[
              styles.glow,
              { backgroundColor: glowColor },
            ]}
          />
        )}
      </Animated.View>
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
    gap: 8,
  },
  iconContainer: {
    position: 'relative',
  },
  icon: {
    fontSize: 28,
  },
  smallIcon: {
    fontSize: 18,
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    opacity: 0.15,
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