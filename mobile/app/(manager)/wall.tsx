import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useMessages } from '../../lib/hooks/useMessages';
import { MessageCard } from '../../components/MessageCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { supabase } from '../../lib/supabase';

export default function ManagerWall() {
  const { profile } = useAuth();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile?.organization_id) return;
    supabase
      .from('locations')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLocationId((data as any)?.id ?? null));
  }, [profile?.organization_id]);

  const { messages, loading, refresh, post, toggleReaction } = useMessages(locationId);

  async function submit() {
    if (!profile || !body.trim()) return;
    setPosting(true);
    try {
      await post(body.trim(), { pinned, authorId: profile.id });
      setBody('');
      setPinned(false);
      setComposerOpen(false);
    } finally {
      setPosting(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const myReactions = useMemo(() => {
    const out = new Map<string, ('👍' | '👀' | '✅')[]>();
    for (const m of messages) {
      const mine = (m.reactions ?? [])
        .filter((r) => r.profile_id === profile?.id)
        .map((r) => r.emoji);
      out.set(m.id, mine);
    }
    return out;
  }, [messages, profile?.id]);

  const reactionCounts = useMemo(() => {
    const out = new Map<string, Partial<Record<'👍' | '👀' | '✅', number>>>();
    for (const m of messages) {
      const counts: Partial<Record<'👍' | '👀' | '✅', number>> = {};
      for (const r of m.reactions ?? []) {
        counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      }
      out.set(m.id, counts);
    }
    return out;
  }, [messages]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Wall</Text>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { backgroundColor: Colors.accentPressed }]}
          onPress={() => setComposerOpen(true)}
          accessibilityLabel="New message"
        >
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {loading ? (
          <View style={{ gap: Spacing.md }}>
            <Skeleton height={120} radius={16} />
            <Skeleton height={120} radius={16} />
          </View>
        ) : messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            subtitle="Post an update to keep the team in the loop."
          />
        ) : (
          messages.map((m) => (
            <MessageCard
              key={m.id}
              firstName={m.author?.first_name ?? '—'}
              lastName={m.author?.last_name ?? ''}
              avatarColor={m.author?.avatar_color}
              body={m.body}
              createdAt={m.created_at}
              pinned={m.pinned}
              reactions={reactionCounts.get(m.id)}
              myReactions={myReactions.get(m.id)}
              onToggleReaction={(e) => profile && toggleReaction(m.id, profile.id, e)}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <SafeAreaView style={styles.root}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setComposerOpen(false)}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New message</Text>
            <View style={{ width: 52 }} />
          </View>
          <View style={{ padding: Spacing.xl, gap: Spacing.lg, flex: 1 }}>
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              placeholder="What's happening?"
              placeholderTextColor={Colors.textMuted}
              style={styles.textarea}
            />
            <Pressable
              onPress={() => setPinned((p) => !p)}
              style={[styles.pinToggle, pinned && styles.pinToggleActive]}
            >
              <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={18} color={pinned ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.pinLabel, pinned && { color: Colors.accent }]}>Pin to top</Text>
            </Pressable>
            <PrimaryButton
              label="Post"
              onPress={submit}
              loading={posting}
              disabled={!body.trim()}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...Typography.displayMD, color: Colors.textPrimary },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['4xl'] },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitle: { ...Typography.headingMD, color: Colors.textPrimary },
  cancelLabel: { ...Typography.bodyLG, color: Colors.accent, fontWeight: '600' },
  textarea: {
    backgroundColor: Colors.card,
    color: Colors.textPrimary,
    borderRadius: Radius.input,
    padding: Spacing.lg,
    minHeight: 140,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.button,
    backgroundColor: Colors.card,
  },
  pinToggleActive: { backgroundColor: Colors.accentSoft },
  pinLabel: { ...Typography.bodyMD, color: Colors.textSecondary, fontWeight: '600' },
});
