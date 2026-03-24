import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
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
  const colors = Colors[colorScheme];

  const date = new Date(session.started_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const duration = formatDuration(session.duration_seconds ?? 0);

  const getSessionIcon = () => {
    const seconds = session.duration_seconds ?? 0;
    if (seconds >= 3600) return '🌸';
    if (seconds >= 1800) return '🌿';
    return '🌱';
  };

  return (
    <ThemedView
      style={[
        styles.row,
        { borderColor: colors.border },
        isPersonalBest && { backgroundColor: colors.tint + '08', borderColor: colors.tint + '25' },
      ]}
    >
      <View style={styles.left}>
        <ThemedText style={styles.icon}>{getSessionIcon()}</ThemedText>
        <ThemedText style={[styles.date, { color: colors.muted }]}>{date}</ThemedText>
      </View>
      <View style={styles.right}>
        <ThemedText style={styles.duration}>{duration}</ThemedText>
        {isPersonalBest && <ThemedText style={styles.trophy}>🌸</ThemedText>}
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
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 0.5,
    marginBottom: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 16,
  },
  date: {
    fontSize: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  duration: {
    fontSize: 16,
    fontFamily: Typography.mono.fontFamily,
    fontWeight: '500',
  },
  trophy: {
    fontSize: 16,
  },
});