import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Input } from '../../components/Input';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../lib/hooks/useAuth';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!firstName || !lastName || !email || password.length < 8) {
      setError('Fill all fields. Password must be 8+ characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, firstName.trim(), lastName.trim());
      // After signup, the root layout will handle routing once the profile exists.
      // Until an org/profile is wired, land on the create-org screen.
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      setError(e.message ?? 'Signup failed');
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
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.logo}>Create account</Text>
            <Text style={styles.tag}>Start a new team or join one.</Text>
          </View>
          <View style={{ gap: Spacing.lg }}>
            <Input label="First name" value={firstName} onChangeText={setFirstName} />
            <Input label="Last name" value={lastName} onChangeText={setLastName} />
            <Input
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Create account" onPress={onSubmit} loading={submitting} />
          </View>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.link}>
                Already have an account? <Text style={{ color: Colors.accent }}>Log in</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
    gap: Spacing['2xl'],
  },
  brand: { gap: Spacing.xs },
  logo: { ...Typography.displayMD, color: Colors.textPrimary },
  tag: { ...Typography.bodyLG, color: Colors.textSecondary },
  error: { ...Typography.bodyMD, color: Colors.danger },
  link: { ...Typography.bodyMD, color: Colors.textSecondary, textAlign: 'center' },
});
