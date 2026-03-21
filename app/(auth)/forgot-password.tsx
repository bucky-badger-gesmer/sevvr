import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Check Your Email</ThemedText>
        <ThemedText style={styles.subtitle}>
          We sent a password reset link to {email}
        </ThemedText>
        <Link href="/(auth)/login" style={styles.link}>
          <ThemedText type="link">Back to Log In</ThemedText>
        </Link>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Reset Password</ThemedText>
      <ThemedText style={styles.subtitle}>
        Enter your email and we'll send you a reset link.
      </ThemedText>

      <TextInput
        style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
        placeholder="Email"
        placeholderTextColor={Colors[colorScheme].icon}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>Send Reset Link</ThemedText>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="link">Back to Log In</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: '#e53e3e',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    alignSelf: 'center',
  },
});
