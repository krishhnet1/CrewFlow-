import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Input } from '../../components/Input';
import { PrimaryButton } from '../../components/PrimaryButton';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';

// Minimal Phase 1: after signup, user either creates an organization or
// enters an invite code. A full onboarding wizard is Phase 2.
export default function OnboardingScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createOrg() {
    if (!session?.user) return;
    setError(null);
    setSubmitting(true);
    try {
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: orgName.trim(), owner_user_id: session.user.id })
        .select()
        .single();
      if (orgErr) throw orgErr;

      const meta = (session.user.user_metadata ?? {}) as Record<string, string>;
      const { error: pErr } = await supabase.from('profiles').insert({
        id: session.user.id,
        organization_id: (org as any).id,
        first_name: meta.first_name ?? 'User',
        last_name: meta.last_name ?? '',
        email: session.user.email ?? null,
        role: 'owner',
      });
      if (pErr) throw pErr;

      router.replace('/(manager)');
    } catch (e: any) {
      setError(e.message ?? 'Could not create organization');
    } finally {
      setSubmitting(false);
    }
  }

  async function joinWithCode() {
    setError('Invite code flow ships in Phase 2. Ask your manager to add you as an employee.');
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.logo}>Set up your team</Text>
          <Text style={styles.tag}>Create a new organization, or join one you've been invited to.</Text>
        </View>

        <View style={styles.tabs}>
          <TabButton active={mode === 'create'} label="Create" onPress={() => setMode('create')} />
          <TabButton active={mode === 'join'} label="Join" onPress={() => setMode('join')} />
        </View>

        {mode === 'create' ? (
          <View style={{ gap: Spacing.lg }}>
            <Input
              label="Organization name"
              value={orgName}
              onChangeText={setOrgName}
              placeholder="Teddy's Chevron"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label="Create organization"
              onPress={createOrg}
              loading={submitting}
              disabled={!orgName.trim()}
            />
          </View>
        ) : (
          <View style={{ gap: Spacing.lg }}>
            <Input
              label="Invite code"
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="ABC123"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Join team" onPress={joinWithCode} loading={submitting} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      {label}
    </Text>
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
  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tab: {
    ...Typography.headingSM,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  tabActive: { color: Colors.textInverse, backgroundColor: Colors.accent },
  error: { ...Typography.bodyMD, color: Colors.danger },
});
