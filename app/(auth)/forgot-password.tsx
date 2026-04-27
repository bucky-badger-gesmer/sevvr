import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
        <View style={styles.header}>
          <ThemedText style={styles.accent}>📬</ThemedText>
          <ThemedText type="display" style={styles.title}>Sent</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
            Check your email for a reset link
          </ThemedText>
        </View>
        <Link href="/(auth)/login">
          <ThemedText style={[styles.linkText, { color: colors.tint }]}>Back to Log In</ThemedText>
        </Link>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.accent}>🔑</ThemedText>
        <ThemedText type="display" style={styles.title}>Reset</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
          We will send you a reset link
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        {error ? <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Send Reset Link</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.links}>
        <Link href="/(auth)/login">
          <ThemedText style={[styles.linkText, { color: colors.muted }]}>Back to Log In</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  accent: {
    fontSize: 32,
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 16,
    fontSize: 16,
    fontFamily: Typography.body.fontFamily,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  links: {
    alignItems: 'center',
    marginTop: 32,
  },
  linkText: {
    fontSize: 14,
  },
});