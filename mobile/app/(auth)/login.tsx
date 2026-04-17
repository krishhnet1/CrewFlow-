import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Input } from '../../components/Input';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../lib/hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e.message ?? 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', default: undefined })}
      >
        <View style={styles.container}>
          <View style={styles.brand}>
            <Text style={styles.logo}>CrewFlow</Text>
            <Text style={styles.tag}>Simple scheduling for small teams.</Text>
          </View>

          <View style={{ gap: Spacing.lg }}>
            <Input
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@work.com"
            />
            <Input
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Log in" onPress={onSubmit} loading={submitting} />
          </View>

          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={styles.link}>
                New to CrewFlow? <Text style={{ color: Colors.accent }}>Create an account</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  brand: { gap: Spacing.xs, alignItems: 'flex-start' },
  logo: { ...Typography.displayLG, color: Colors.textPrimary },
  tag: { ...Typography.bodyLG, color: Colors.textSecondary },
  error: { ...Typography.bodyMD, color: Colors.danger },
  link: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
