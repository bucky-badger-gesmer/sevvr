import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type StatCardProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

export function StatCard({ label, value, highlight }: StatCardProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView
      style={[
        styles.card,
        { backgroundColor: highlight ? Colors[colorScheme].tint + '15' : undefined },
      ]}
    >
      <ThemedText style={[styles.label, { color: Colors[colorScheme].icon }]}>
        {label}
      </ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
});
