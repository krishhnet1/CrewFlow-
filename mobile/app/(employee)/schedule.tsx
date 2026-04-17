import { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useShifts } from '../../lib/hooks/useShifts';
import { ShiftCard } from '../../components/ShiftCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { addDays, isSameDay, startOfWeek } from '../../lib/format';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function EmployeeSchedule() {
  const { profile } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const rangeEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const { shifts, loading } = useShifts({
    employeeId: profile?.id ?? null,
    rangeStart: weekStart,
    rangeEnd,
  });

  const daysShifts = useMemo(
    () => shifts.filter((s) => isSameDay(new Date(s.starts_at), selectedDay)),
    [shifts, selectedDay]
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My schedule</Text>
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
        ) : daysShifts.length === 0 ? (
          <EmptyState title="Nothing scheduled" subtitle="No shifts on this day." />
        ) : (
          daysShifts.map((s) => (
            <ShiftCard
              key={s.id}
              startsAt={s.starts_at}
              endsAt={s.ends_at}
              areaColor={s.area?.color}
              areaName={s.area?.name}
              employeeFirstName={profile?.first_name}
              employeeLastName={profile?.last_name}
              notes={s.notes}
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
  body: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['4xl'] },
});
