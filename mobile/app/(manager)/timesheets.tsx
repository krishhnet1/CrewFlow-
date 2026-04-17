import { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useTimesheets } from '../../lib/hooks/useTimesheets';
import { TimesheetCard } from '../../components/TimesheetCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { formatCurrency, formatHours } from '../../lib/format';
import type { TimesheetStatus } from '../../lib/types';

type Filter = 'all' | 'pending' | 'approved';

export default function ManagerTimesheets() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<Filter>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const statusFilter: TimesheetStatus | 'all' = filter === 'all' ? 'all' : filter;
  const { timesheets, loading, refresh, approve } = useTimesheets({
    organizationId: profile?.organization_id ?? null,
    status: statusFilter as any,
  });

  const totals = useMemo(() => {
    let hours = 0;
    let pay = 0;
    for (const t of timesheets) {
      hours += t.hours_worked ?? 0;
      pay += t.pay_amount ?? 0;
    }
    return { hours, pay };
  }, [timesheets]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Timesheets</Text>
      </View>

      <View style={styles.totals}>
        <Text style={styles.totalHours}>{formatHours(totals.hours)}</Text>
        <Text style={styles.totalPay}>{formatCurrency(totals.pay)} this period</Text>
      </View>

      <View style={styles.tabs}>
        {(['all', 'pending', 'approved'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.tab, filter === f && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, filter === f && styles.tabLabelActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {loading ? (
          <View style={{ gap: Spacing.md }}>
            <Skeleton height={112} radius={16} />
            <Skeleton height={112} radius={16} />
            <Skeleton height={112} radius={16} />
          </View>
        ) : timesheets.length === 0 ? (
          <EmptyState
            title="Nothing to review"
            subtitle={filter === 'pending' ? 'All timesheets are up to date.' : 'No timesheets in this view.'}
          />
        ) : (
          timesheets.map((t) => (
            <TimesheetCard
              key={t.id}
              firstName={t.employee?.first_name ?? '—'}
              lastName={t.employee?.last_name ?? ''}
              avatarColor={t.employee?.avatar_color}
              clockInAt={t.clock_in_at}
              clockOutAt={t.clock_out_at}
              hoursWorked={t.hours_worked}
              payAmount={t.pay_amount}
              status={t.status}
              onApprove={t.status === 'pending' ? () => approve(t.id) : undefined}
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
  totals: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  totalHours: { ...Typography.displayLG, color: Colors.textPrimary },
  totalPay: { ...Typography.bodyLG, color: Colors.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.card,
  },
  tabActive: { backgroundColor: Colors.accent },
  tabLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  tabLabelActive: { color: Colors.textInverse },
  body: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['4xl'] },
});
