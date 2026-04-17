import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { Avatar } from '../../components/Avatar';
import { StatCard } from '../../components/StatCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../lib/hooks/useAuth';
import { useShifts } from '../../lib/hooks/useShifts';
import { useCurrentTimesheet } from '../../lib/hooks/useCurrentTimesheet';
import { useTeamStatus } from '../../lib/hooks/useTeamStatus';
import { supabase } from '../../lib/supabase';
import { formatElapsed, formatTimeRange } from '../../lib/format';

export default function EmployeeHome() {
  const { profile } = useAuth();
  const [clock, setClock] = useState(new Date());
  const [locationId, setLocationId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const now = useMemo(() => new Date(), []);
  const in24h = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  }, []);

  const { shifts, refresh: refreshShifts } = useShifts({
    employeeId: profile?.id ?? null,
    rangeStart: now,
    rangeEnd: in24h,
  });
  const { timesheet, clockIn, clockOut, refresh: refreshTs } = useCurrentTimesheet(profile?.id ?? null);
  const team = useTeamStatus(locationId);

  const nextShift = shifts[0];
  const isOnShift = !!timesheet;

  async function onClockIn() {
    if (!profile || !locationId) return;
    const areaId = nextShift?.area_id ?? profile.primary_area_id;
    if (!areaId) return;
    await clockIn({
      locationId,
      areaId,
      organizationId: profile.organization_id,
    });
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refreshShifts(), refreshTs(), team.refresh()]);
    setRefreshing(false);
  }

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
            <Text style={styles.greeting}>{profile ? `Hi, ${profile.first_name}` : 'Hi'}</Text>
            <Text style={styles.sub}>
              {clock.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.clockCard}>
          <Text style={styles.clockTime}>
            {clock.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
          {isOnShift ? (
            <>
              <Text style={styles.clockLabel}>On shift · {formatElapsed(timesheet!.clock_in_at)}</Text>
              <PrimaryButton label="Clock Out" onPress={clockOut} variant="danger" />
            </>
          ) : (
            <>
              {nextShift ? (
                <Text style={styles.clockLabel}>
                  Next shift · {formatTimeRange(nextShift.starts_at, nextShift.ends_at)}
                </Text>
              ) : (
                <Text style={styles.clockLabel}>No upcoming shift</Text>
              )}
              <PrimaryButton
                label="Clock In"
                onPress={onClockIn}
                disabled={!profile?.primary_area_id && !nextShift?.area_id}
              />
            </>
          )}
        </View>

        {!isOnShift && !nextShift ? (
          <EmptyState
            title="No shifts scheduled"
            subtitle="When your manager schedules you, your next shift will show here."
          />
        ) : null}

        <Text style={styles.sectionEyebrow}>Today</Text>
        <View style={styles.statRow}>
          <StatCard label="On shift" value={team.loading ? '—' : team.onShift} accent={Colors.success} />
          <StatCard label="Late" value={team.loading ? '—' : team.late} accent={team.late > 0 ? Colors.warning : undefined} />
          <StatCard label="Scheduled" value={team.loading ? '—' : team.scheduled} />
        </View>

        {!team.loading && team.members.length === 0 ? (
          <Skeleton height={0} />
        ) : null}
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
  clockCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  clockTime: { fontSize: 64, lineHeight: 72, fontWeight: '900', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  clockLabel: { ...Typography.headingSM, color: Colors.textSecondary },
  sectionEyebrow: { ...Typography.overline, color: Colors.textSecondary, marginTop: Spacing.sm },
  statRow: { flexDirection: 'row', gap: Spacing.md },
});
