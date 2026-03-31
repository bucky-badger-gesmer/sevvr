import { StyleSheet, TouchableOpacity, Share, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/hooks/use-session';

export default function LifeUnlockedModal() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { lastCompletedSession, dispatch } = useSession();

  const duration = lastCompletedSession?.durationSeconds ?? 0;
  const missed = lastCompletedSession?.missedContent;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleDone = () => {
    dispatch({ type: 'DISMISS' });
    router.back();
  };

  const handleShare = async () => {
    const message = [
      `I just severed for ${formatDuration(duration)}`,
      missed ? ` and missed ${missed.tweets} tweets, ${missed.tiktoks} TikToks, and ${missed.instagram_posts} Instagram posts.` : '.',
      '\n\nCan you beat me? sevvr.app',
    ].join('');

    await Share.share({ message });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.bloom}>🌸</ThemedText>
      <ThemedText type="display" style={styles.title}>Life Unlocked</ThemedText>

      <ThemedText type="mono" style={[styles.duration, { color: colors.tint }]}>
        {formatDuration(duration)}
      </ThemedText>

      {missed && (
        <View style={[styles.missedContainer, { backgroundColor: colors.surface }]}>
          <ThemedText style={[styles.missedHeader, { color: colors.muted }]}>While you were gone:</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.tweets} tweets</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.tiktoks} TikToks</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.instagram_posts} IG posts</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.youtube_videos} YT videos</ThemedText>
        </View>
      )}

      <TouchableOpacity
        style={[styles.shareButton, { borderColor: colors.border }]}
        onPress={handleShare}
      >
        <ThemedText style={{ color: colors.tint, fontWeight: '500' }}>Share</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: colors.tint }]}
        onPress={handleDone}
      >
        <ThemedText style={styles.doneText}>Done</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bloom: {
    fontSize: 48,
    lineHeight: 58,
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    letterSpacing: -1,
  },
  duration: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '500',
    marginBottom: 32,
  },
  missedContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
    padding: 20,
    borderRadius: BorderRadius.lg,
  },
  missedHeader: {
    marginBottom: 8,
    fontSize: 14,
  },
  missedItem: {
    fontSize: 18,
  },
  shareButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});