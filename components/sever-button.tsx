import { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type SeverButtonProps = {
  onFillComplete: () => void;
  disabled: boolean;
};

const BUTTON_SIZE = 200;
const FILL_DURATION = 3000;

function triggerHeavyHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

function triggerLightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function SeverButton({ onFillComplete, disabled }: SeverButtonProps) {
  const progress = useSharedValue(0);

  // Reset progress when button becomes enabled again (e.g., after cancel)
  useEffect(() => {
    if (!disabled && progress.value >= 1) {
      progress.value = withTiming(0, { duration: 300 });
    }
  }, [disabled, progress]);

  const onPressIn = () => {
    if (disabled) return;
    triggerLightHaptic();
    progress.value = withTiming(1, { duration: FILL_DURATION, easing: Easing.linear });
  };

  const onPressOut = () => {
    if (progress.value < 1) {
      progress.value = withSpring(0, { damping: 15 });
    }
  };

  // Detect fill completion
  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (current >= 1 && (previous ?? 0) < 1) {
        runOnJS(onFillComplete)();
        runOnJS(triggerHeavyHaptic)();
      }
    }
  );

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: 0.3 + progress.value * 0.3,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.3,
  }));

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
      <Animated.Text style={[styles.text, textStyle]}>SEVER</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e94560',
    borderRadius: BUTTON_SIZE / 2,
  },
  text: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
  },
  disabled: {
    opacity: 0.5,
  },
});
