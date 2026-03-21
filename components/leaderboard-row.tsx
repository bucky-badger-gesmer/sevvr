import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDurationShort } from '@/lib/format';
import type { LeaderboardEntry } from '@/types/social';

const MEDALS = ['', '\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49']; // gold, silver, bronze

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
};

export function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView
      style={[
        styles.row,
        entry.isCurrentUser && { backgroundColor: Colors[colorScheme].tint + '15' },
      ]}
    >
      <View style={styles.left}>
        <ThemedText style={styles.rank}>
          {entry.rank <= 3 ? MEDALS[entry.rank] : `${entry.rank}.`}
        </ThemedText>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {(entry.username[0] ?? '?').toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={[styles.username, entry.isCurrentUser && styles.bold]}>
          @{entry.username}
        </ThemedText>
      </View>
      <ThemedText style={styles.time}>
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
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
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
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
    fontWeight: '600',
  },
});
