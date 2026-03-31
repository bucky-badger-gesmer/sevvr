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


export function StreakBadge({ count, size = 'large' }: StreakBadgeProps) {
  const isLarge = size === 'large';
  const pulse = useSharedValue(1);

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
          🔥
        </ThemedText>
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
    overflow: 'visible',
    padding: 4,
  },
  icon: {
    fontSize: 28,
    lineHeight: 36,
  },
  smallIcon: {
    fontSize: 18,
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