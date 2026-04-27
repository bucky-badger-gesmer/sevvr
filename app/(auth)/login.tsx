import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, View, Modal, Pressable } from 'react-native';
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
  const [showDevInfo, setShowDevInfo] = useState(false);
  const isDev = __DEV__;

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
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
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

      {isDev && (
        <>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowDevInfo(true)}
          >
            <ThemedText style={[styles.infoButtonText, { color: colors.muted }]}>
              ℹ  Dev Setup Info
            </ThemedText>
          </TouchableOpacity>

          <Modal
            visible={showDevInfo}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDevInfo(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setShowDevInfo(false)}>
              <Pressable style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                  Local Development Setup
                </ThemedText>
                <ThemedText style={[styles.modalBody, { color: colors.muted }]}>
                  If running locally, you will need to add a{' '}
                  <ThemedText type="defaultSemiBold">.env</ThemedText> file in the
                  project root with the following secrets:
                </ThemedText>
                <View style={[styles.codeBlock, { backgroundColor: colors.background }]}>
                  <ThemedText style={styles.codeText}>EXPO_PUBLIC_SUPABASE_URL</ThemedText>
                  <ThemedText style={styles.codeText}>EXPO_PUBLIC_SUPABASE_ANON_KEY</ThemedText>
                  <ThemedText style={styles.codeText}>SUPABASE_SERVICE_ROLE_KEY</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.modalClose, { backgroundColor: colors.tint }]}
                  onPress={() => setShowDevInfo(false)}
                >
                  <ThemedText style={styles.buttonText}>Got it</ThemedText>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
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
  infoButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  infoButtonText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 17,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  codeBlock: {
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 4,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 13,
    fontFamily: 'Courier',
  },
  modalClose: {
    borderRadius: BorderRadius.lg,
    padding: 14,
    alignItems: 'center',
  },
});