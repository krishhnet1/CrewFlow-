import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useShifts } from '../../lib/hooks/useShifts';
import { supabase } from '../../lib/supabase';
import { ShiftCard } from '../../components/ShiftCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { addDays, isSameDay, startOfWeek } from '../../lib/format';
import type { Area } from '../../lib/types';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ManagerSchedule() {
  const { profile } = useAuth();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

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

  useEffect(() => {
    if (!locationId) return;
    supabase
      .from('areas')
      .select('*')
      .eq('location_id', locationId)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setAreas((data as Area[]) ?? []));
  }, [locationId]);

  const rangeEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const { shifts, loading } = useShifts({
    locationId,
    rangeStart: weekStart,
    rangeEnd,
  });

  const shiftsByArea = useMemo(() => {
    const map = new Map<string, typeof shifts>();
    for (const s of shifts) {
      if (!isSameDay(new Date(s.starts_at), selectedDay)) continue;
      const arr = map.get(s.area_id) ?? [];
      arr.push(s);
      map.set(s.area_id, arr);
    }
    return map;
  }, [shifts, selectedDay]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { backgroundColor: Colors.accentPressed }]}
          onPress={() => {}}
          accessibilityLabel="Add shift"
        >
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.weekNav}>
        <Pressable onPress={() => setWeekStart(addDays(weekStart, -7))}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.weekLabel}>
          Week of {weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </Text>
        <Pressable onPress={() => setWeekStart(addDays(weekStart, 7))}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(weekStart, i);
          const isSelected = isSameDay(d, selectedDay);
          return (
            <Pressable
              key={i}
              onPress={() => setSelectedDay(d)}
              style={[styles.dayPill, isSelected && styles.dayPillActive]}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>{DAY_LABELS[i]}</Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <View style={{ gap: Spacing.md }}>
            <Skeleton height={80} radius={Radius.card} />
            <Skeleton height={80} radius={Radius.card} />
          </View>
        ) : areas.length === 0 ? (
          <EmptyState
            title="No areas yet"
            subtitle="Set up areas from the web dashboard to start scheduling."
          />
        ) : (
          areas.map((area) => {
            const areaShifts = shiftsByArea.get(area.id) ?? [];
            return (
              <View key={area.id} style={{ gap: Spacing.md }}>
                <View style={styles.areaRow}>
                  <View style={[styles.dot, { backgroundColor: area.color }]} />
                  <Text style={styles.areaName}>{area.name}</Text>
                  <Text style={styles.areaCount}>
                    {areaShifts.length} {areaShifts.length === 1 ? 'shift' : 'shifts'}
                  </Text>
                </View>
                {areaShifts.length === 0 ? (
                  <View style={styles.emptyArea}>
                    <Text style={styles.emptyAreaText}>No shifts scheduled</Text>
                  </View>
                ) : (
                  areaShifts.map((s) => (
                    <ShiftCard
                      key={s.id}
                      startsAt={s.starts_at}
                      endsAt={s.ends_at}
                      areaColor={area.color}
                      areaName={area.name}
                      employeeFirstName={s.employee?.first_name}
                      employeeLastName={s.employee?.last_name}
                      notes={s.notes}
                    />
                  ))
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  weekLabel: { ...Typography.bodyMD, color: Colors.textSecondary, fontWeight: '600' },
  daysRow: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.sm },
  dayPill: {
    width: 44,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: { backgroundColor: Colors.accent },
  dayName: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  dayNameActive: { color: Colors.textInverse },
  dayNum: { ...Typography.headingMD, color: Colors.textPrimary, fontWeight: '700' },
  dayNumActive: { color: Colors.textInverse },
  body: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  areaName: { ...Typography.headingMD, color: Colors.textPrimary, flex: 1 },
  areaCount: { ...Typography.caption, color: Colors.textSecondary },
  emptyArea: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyAreaText: { ...Typography.bodyMD, color: Colors.textMuted },
});
