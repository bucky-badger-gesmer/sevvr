import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ChallengeInviteModal() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Challenge!</ThemedText>
      <ThemedText style={styles.subtitle}>Someone challenged you to sever</ThemedText>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
        onPress={() => router.back()}
      >
        <ThemedText style={styles.buttonText}>Accept</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonOutline, { borderColor: Colors[colorScheme].icon }]}
        onPress={() => router.back()}
      >
        <ThemedText>Decline</ThemedText>
      </TouchableOpacity>
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
    marginBottom: 24,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonOutline: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
});
