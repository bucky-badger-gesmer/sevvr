import { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCountdown } from '@/hooks/use-countdown';

type CountdownOverlayProps = {
  onComplete: () => void;
  onCancel: () => void;
};

export function CountdownOverlay({ onComplete, onCancel }: CountdownOverlayProps) {
  const { secondsLeft, isRunning, start } = useCountdown(5);
  const scale = useSharedValue(1);

  useEffect(() => {
    start();
  }, [start]);

  // Haptic tick + scale pulse on each second change
  useEffect(() => {
    if (!isRunning) return;

    if (secondsLeft > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [secondsLeft, isRunning, scale]);

  // Fire onComplete when countdown reaches 0 (once only)
  const hasCompletedRef = useRef(false);
  useEffect(() => {
    if (secondsLeft === 0 && !isRunning && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  }, [secondsLeft, isRunning, onComplete]);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <ThemedView style={styles.overlay}>
      <Animated.Text style={[styles.number, numberStyle]}>
        {secondsLeft}
      </Animated.Text>
      <ThemedText style={styles.message}>Lock your phone now</ThemedText>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <ThemedText style={styles.cancelText}>Cancel</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  number: {
    fontSize: 120,
    fontWeight: '800',
    color: '#e94560',
  },
  message: {
    fontSize: 18,
    marginTop: 16,
    opacity: 0.7,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 80,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
