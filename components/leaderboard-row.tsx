import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDurationShort } from '@/lib/format';
import type { LeaderboardEntry } from '@/types/social';

const RANK_ICONS = ['', '🌸', '🌿', '🌱'];

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
};

export function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <ThemedView
      style={[
        styles.row,
        { borderColor: colors.border },
        entry.isCurrentUser && { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' },
      ]}
    >
      <View style={styles.left}>
        <ThemedText style={styles.rank}>
          {entry.rank <= 3 ? RANK_ICONS[entry.rank] : `${entry.rank}.`}
        </ThemedText>
        <View style={[styles.avatar, { backgroundColor: colors.tint + '30' }]}>
          <ThemedText style={[styles.avatarText, { color: colors.tint }]}>
            {(entry.username[0] ?? '?').toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={[styles.username, entry.isCurrentUser && styles.bold]}>
          @{entry.username}
        </ThemedText>
      </View>
      <ThemedText style={[styles.time, { color: colors.muted }]}>
        {formatDurationShort(entry.weeklySeconds)}
      </ThemedText>
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rank: {
    width: 28,
    fontSize: 16,
    textAlign: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  username: {
    fontSize: 15,
  },
  bold: {
    fontWeight: '700',
  },
  time: {
    fontSize: 15,
    fontFamily: 'Menlo',
    fontWeight: '500',
  },
});