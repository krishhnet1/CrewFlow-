import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { formatTimeRange } from '../lib/format';
import { Avatar } from './Avatar';

interface Props {
  startsAt: string;
  endsAt: string;
  areaName?: string;
  areaColor?: string;
  employeeFirstName?: string;
  employeeLastName?: string;
  notes?: string | null;
}

export function ShiftCard({
  startsAt,
  endsAt,
  areaName,
  areaColor,
  employeeFirstName,
  employeeLastName,
  notes,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {areaColor ? <View style={[styles.dot, { backgroundColor: areaColor }]} /> : null}
        <Text style={styles.time}>{formatTimeRange(startsAt, endsAt)}</Text>
      </View>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}>
          {employeeFirstName ? (
            <Avatar firstName={employeeFirstName} lastName={employeeLastName ?? ''} size={32} />
          ) : null}
          <Text style={styles.employee} numberOfLines={1}>
            {employeeFirstName ? `${employeeFirstName} ${employeeLastName ?? ''}` : 'Unassigned'}
          </Text>
        </View>
        {areaName ? <Text style={styles.area}>{areaName}</Text> : null}
      </View>
      {notes ? <Text style={styles.notes}>{notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  time: { ...Typography.headingMD, color: Colors.textPrimary },
  employee: { ...Typography.bodyLG, color: Colors.textPrimary, fontWeight: '600' },
  area: { ...Typography.caption, color: Colors.textSecondary, textTransform: 'uppercase' },
  notes: { ...Typography.bodyMD, color: Colors.textSecondary },
});
