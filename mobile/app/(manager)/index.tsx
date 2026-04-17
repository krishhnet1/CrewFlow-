import { View, Text, ScrollView, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { HeroCard } from '../../components/HeroCard';
import { StatCard } from '../../components/StatCard';
import { Avatar } from '../../components/Avatar';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../lib/hooks/useAuth';
import { useTimesheets } from '../../lib/hooks/useTimesheets';
import { useTeamStatus } from '../../lib/hooks/useTeamStatus';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';
import { formatCurrency, formatHours, startOfWeek, addDays } from '../../lib/format';

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Resolve the primary location for this org (Phase 1: first location).
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

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const { timesheets, loading: tsLoading, refresh: refreshTs } = useTimesheets({
    organizationId: profile?.organization_id ?? null,
  });
  const team = useTeamStatus(locationId);

  const weekStats = useMemo(() => {
    let hours = 0;
    let pay = 0;
    for (const t of timesheets) {
      const when = new Date(t.clock_in_at).getTime();
      if (when < weekStart.getTime() || when >= weekEnd.getTime()) continue;
      hours += t.hours_worked ?? 0;
      pay += t.pay_amount ?? 0;
    }
    return { hours, pay };
  }, [timesheets, weekStart, weekEnd]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTs(), team.refresh()]);
    setRefreshing(false);
  }, [refreshTs, team]);

  const greeting = profile ? `Hey, ${profile.first_name}` : 'Hey';
  const lateMembers = team.members.filter((m) => m.state === 'late');

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        <View style={styles.header}>
          {profile ? (
            <Avatar firstName={profile.first_name} lastName={profile.last_name} color={profile.avatar_color} size={56} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.sub}>Here's what's happening today.</Text>
          </View>
        </View>

        <HeroCard
          eyebrow="This week"
          bigValue={formatHours(weekStats.hours)}
          subtitle={`${formatCurrency(weekStats.pay)} labor cost`}
        />

        {lateMembers.length > 0 ? (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>
              {lateMembers.length} {lateMembers.length === 1 ? 'person is' : 'people are'} running late
            </Text>
            {lateMembers.map((m) => (
              <View key={m.profile.id} style={styles.alertRow}>
                <Avatar firstName={m.profile.first_name} lastName={m.profile.last_name} color={m.profile.avatar_color} size={24} />
                <Text style={styles.alertName}>{m.profile.first_name} {m.profile.last_name}</Text>
                <StatusBadge status="late" />
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionEyebrow}>Right now</Text>
        <View style={styles.statRow}>
          <StatCard label="On shift" value={team.loading ? '—' : team.onShift} accent={Colors.success} />
          <StatCard label="Late" value={team.loading ? '—' : team.late} accent={team.late > 0 ? Colors.warning : undefined} />
          <StatCard label="Scheduled" value={team.loading ? '—' : team.scheduled} />
        </View>

        <Text style={styles.sectionEyebrow}>Team activity</Text>
        {team.loading ? (
          <View style={{ gap: Spacing.md }}>
            <Skeleton height={56} radius={16} />
            <Skeleton height={56} radius={16} />
            <Skeleton height={56} radius={16} />
          </View>
        ) : team.members.length === 0 ? (
          <EmptyState
            title="No one on the schedule yet"
            subtitle="Create shifts from the Schedule tab to see team activity here."
          />
        ) : (
          <View style={{ gap: Spacing.md }}>
            {team.members.map((m) => (
              <View key={m.profile.id} style={styles.memberRow}>
                <Avatar firstName={m.profile.first_name} lastName={m.profile.last_name} color={m.profile.avatar_color} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.profile.first_name} {m.profile.last_name}</Text>
                  <Text style={styles.memberArea}>{m.area?.name ?? 'No area'}</Text>
                </View>
                {m.state === 'on_shift' ? (
                  <StatusBadge status="in_progress" label="On shift" />
                ) : m.state === 'late' ? (
                  <StatusBadge status="late" />
                ) : (
                  <StatusBadge status="upcoming" label="Scheduled" />
                )}
              </View>
            ))}
          </View>
        )}

        {tsLoading ? null : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  greeting: { ...Typography.displayMD, color: Colors.textPrimary },
  sub: { ...Typography.bodyMD, color: Colors.textSecondary, marginTop: 2 },
  sectionEyebrow: { ...Typography.overline, color: Colors.textSecondary, marginTop: Spacing.sm },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  alertCard: {
    backgroundColor: Colors.dangerSoft,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  alertTitle: { ...Typography.headingSM, color: Colors.textPrimary },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  alertName: { ...Typography.bodyMD, color: Colors.textPrimary, flex: 1 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  memberName: { ...Typography.bodyLG, color: Colors.textPrimary, fontWeight: '700' },
  memberArea: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
