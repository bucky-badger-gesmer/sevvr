import { useEffect } from 'react';
import { Platform, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SeverButtonProps = {
  onFillComplete: () => void;
  disabled: boolean;
  streakMilestone?: number;
};

const BUTTON_SIZE = 200;
const FILL_DURATION = 3000;

function triggerHeavyHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

function triggerSuccessHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

function triggerLightHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function SeverButton({ onFillComplete, disabled, streakMilestone }: SeverButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const burstOpacity = useSharedValue(0);
  const burstScale = useSharedValue(0);

  useEffect(() => {
    if (!disabled) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [disabled, scale]);

  useEffect(() => {
    if (!disabled && progress.value >= 1) {
      progress.value = withTiming(0, { duration: 300 });
      burstOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 600 })
      );
      burstScale.value = withSequence(
        withSpring(1.2, { damping: 12, stiffness: 200 }),
        withTiming(0, { duration: 400 })
      );
    }
  }, [disabled, progress, burstOpacity, burstScale]);

  const onPressIn = () => {
    if (disabled) return;
    triggerLightHaptic();
    progress.value = withTiming(1, {
      duration: FILL_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  };

  const onPressOut = () => {
    if (progress.value < 1) {
      progress.value = withSpring(0, { damping: 15, stiffness: 150 });
    }
  };

  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (current >= 1 && (previous ?? 0) < 1) {
        runOnJS(onFillComplete)();
        runOnJS(triggerHeavyHaptic)();
        runOnJS(triggerSuccessHaptic)();
      }
    }
  );

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: 0.2 + progress.value * 0.4,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.4,
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [{ scale: burstScale.value }],
  }));

  const getMilestoneIcon = () => {
    if (streakMilestone && streakMilestone >= 30) return '🌸';
    if (streakMilestone && streakMilestone >= 7) return '🌿';
    return null;
  };

  const milestoneIcon = getMilestoneIcon();
  const showGlow = streakMilestone && streakMilestone > 0;

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      {milestoneIcon && (
        <Animated.View style={[styles.burst, burstStyle]}>
          <ThemedText style={styles.burstIcon}>{milestoneIcon}</ThemedText>
        </Animated.View>
      )}
      <Animated.View
        style={[
          styles.container,
          { borderColor: colors.tint },
          showGlow ? styles.glow : undefined,
          disabled && styles.disabled,
          containerStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            fillStyle,
            { backgroundColor: colors.tint },
          ]}
        />
        <Animated.Text style={[styles.text, textStyle]}>SEVER</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    // Prevent text selection on web during long-press
    userSelect: 'none',
  },
  glow: {
    shadowColor: '#C67D5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUTTON_SIZE / 2,
  },
  text: {
    color: '#1A1A1A',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    userSelect: 'none',
  },
  burst: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  burstIcon: {
    fontSize: 32,
  },
  disabled: {
    opacity: 0.4,
  },
});