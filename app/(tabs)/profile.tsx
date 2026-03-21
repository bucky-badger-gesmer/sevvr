import { useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your account will be permanently deleted in 24 hours. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount();
            } catch {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedText style={styles.email}>{user?.email}</ThemedText>
      <ThemedText style={styles.username}>
        @{user?.user_metadata?.username ?? 'unknown'}
      </ThemedText>

      <TouchableOpacity
        style={[styles.button, { borderColor: Colors[colorScheme].icon }]}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors[colorScheme].text} />
        ) : (
          <ThemedText>Log Out</ThemedText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.deleteButton]}
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        <ThemedText style={styles.deleteText}>Delete Account</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  email: {
    opacity: 0.6,
  },
  username: {
    marginBottom: 24,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  deleteButton: {
    borderColor: '#e53e3e',
    marginTop: 12,
  },
  deleteText: {
    color: '#e53e3e',
  },
});
