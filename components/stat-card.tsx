import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type StatCardProps = {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: string;
};

export function StatCard({ label, value, highlight, icon }: StatCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <ThemedView
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[
          styles.card,
          { borderColor: colors.border },
          highlight && { backgroundColor: colors.tint + '12', borderColor: colors.tint + '40' },
        ]}
      >
        {icon && <ThemedText style={styles.icon}>{icon}</ThemedText>}
        <ThemedText
          style={[
            styles.label,
            { color: colors.muted },
          ]}
        >
          {label}
        </ThemedText>
        <ThemedText style={styles.value}>{value}</ThemedText>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Menlo',
    letterSpacing: -0.5,
  },
});