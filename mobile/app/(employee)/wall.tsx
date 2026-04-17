import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useMessages } from '../../lib/hooks/useMessages';
import { MessageCard } from '../../components/MessageCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { supabase } from '../../lib/supabase';

export default function EmployeeWall() {
  const { profile } = useAuth();
  const [locationId, setLocationId] = useState<string | null>(null);
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

  const { messages, loading, refresh, toggleReaction } = useMessages(locationId);

  const myReactions = useMemo(() => {
    const out = new Map<string, ('👍' | '👀' | '✅')[]>();
    for (const m of messages) {
      out.set(
        m.id,
        (m.reactions ?? []).filter((r) => r.profile_id === profile?.id).map((r) => r.emoji)
      );
    }
    return out;
  }, [messages, profile?.id]);

  const reactionCounts = useMemo(() => {
    const out = new Map<string, Partial<Record<'👍' | '👀' | '✅', number>>>();
    for (const m of messages) {
      const counts: Partial<Record<'👍' | '👀' | '✅', number>> = {};
      for (const r of m.reactions ?? []) counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      out.set(m.id, counts);
    }
    return out;
  }, [messages]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Wall</Text>
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
            title="Quiet here"
            subtitle="Your team hasn't posted anything yet."
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { ...Typography.displayMD, color: Colors.textPrimary },
  body: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['4xl'] },
});
