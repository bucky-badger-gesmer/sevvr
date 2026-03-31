import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message ?? 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.accent}>🌱</ThemedText>
        <ThemedText type="display" style={styles.title}>sevvr</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
          Put your phone down. Compete.
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        {error ? <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Log In</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password">
          <ThemedText style={[styles.linkText, { color: colors.muted }]}>Forgot Password?</ThemedText>
        </Link>
        <Link href="/(auth)/signup">
          <ThemedText style={[styles.linkText, { color: colors.tint }]}>Create Account</ThemedText>
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
    lineHeight: 42,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 32,
  },
  linkText: {
    fontSize: 14,
  },
});