import { StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';

export default function ChallengeDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Challenge Invite</ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign up to accept this challenge!
        </ThemedText>
        <Link href="/(auth)/signup">
          <ThemedText type="link">Create Account</ThemedText>
        </Link>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Challenge Invite</ThemedText>
      <ThemedText style={styles.subtitle}>Token: {id}</ThemedText>
      <ThemedText style={styles.subtitle}>
        Challenge accept/decline UI coming soon.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  subtitle: {
    opacity: 0.6,
  },
});
