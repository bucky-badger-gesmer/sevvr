import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDuration } from '@/lib/format';
import type { Database } from '@/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];

type SessionListItemProps = {
  session: Session;
  isPersonalBest: boolean;
};

export function SessionListItem({ session, isPersonalBest }: SessionListItemProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const date = new Date(session.started_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const duration = formatDuration(session.duration_seconds ?? 0);

  return (
    <ThemedView
      style={[
        styles.row,
        isPersonalBest && { backgroundColor: Colors[colorScheme].tint + '10' },
      ]}
    >
      <ThemedText style={styles.date}>{date}</ThemedText>
      <View style={styles.right}>
        <ThemedText style={styles.duration}>{duration}</ThemedText>
        {isPersonalBest && <ThemedText style={styles.trophy}>&#127942;</ThemedText>}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  duration: {
    fontSize: 16,
    fontWeight: '600',
  },
  trophy: {
    fontSize: 16,
  },
});
