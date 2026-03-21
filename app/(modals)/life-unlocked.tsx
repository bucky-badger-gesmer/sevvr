import { StyleSheet, TouchableOpacity, Share, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/hooks/use-session';

export default function LifeUnlockedModal() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
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
      <ThemedText type="title" style={styles.title}>LIFE UNLOCKED</ThemedText>

      <ThemedText style={styles.duration}>{formatDuration(duration)}</ThemedText>

      {missed && (
        <View style={styles.missedContainer}>
          <ThemedText style={styles.missedHeader}>While you were gone:</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.tweets} tweets</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.tiktoks} TikToks</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.instagram_posts} IG posts</ThemedText>
          <ThemedText style={styles.missedItem}>{missed.youtube_videos} YT videos</ThemedText>
        </View>
      )}

      <TouchableOpacity
        style={[styles.shareButton, { borderColor: Colors[colorScheme].tint }]}
        onPress={handleShare}
      >
        <ThemedText style={{ color: Colors[colorScheme].tint }}>Share</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: Colors[colorScheme].tint }]}
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
  title: {
    marginBottom: 8,
  },
  duration: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 32,
  },
  missedContainer: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 40,
  },
  missedHeader: {
    opacity: 0.6,
    marginBottom: 8,
  },
  missedItem: {
    fontSize: 18,
  },
  shareButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 12,
  },
  doneButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  doneText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
