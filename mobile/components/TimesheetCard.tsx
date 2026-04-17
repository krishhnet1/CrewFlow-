import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { formatCurrency, formatHours, formatShortDate, formatTimeRange } from '../lib/format';
import { Avatar } from './Avatar';
import { StatusBadge, StatusKind } from './StatusBadge';
import type { TimesheetStatus } from '../lib/types';

interface Props {
  firstName: string;
  lastName: string;
  avatarColor?: string | null;
  clockInAt: string;
  clockOutAt: string | null;
  hoursWorked: number | null;
  payAmount: number | null;
  status: TimesheetStatus;
  onApprove?: () => void;
  onPress?: () => void;
}

function mapStatus(s: TimesheetStatus): StatusKind {
  if (s === 'in_progress' || s === 'upcoming' || s === 'paid' || s === 'auto_closed' || s === 'discarded' || s === 'late') return s;
  if (s === 'pending') return 'pending';
  if (s === 'approved') return 'approved';
  return 'pending';
}

export function TimesheetCard({
  firstName,
  lastName,
  avatarColor,
  clockInAt,
  clockOutAt,
  hoursWorked,
  payAmount,
  status,
  onApprove,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.row}>
        <Avatar firstName={firstName} lastName={lastName} color={avatarColor} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.meta}>
            {formatShortDate(clockInAt)} · {clockOutAt ? formatTimeRange(clockInAt, clockOutAt) : 'In progress'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.hours}>{formatHours(hoursWorked)}</Text>
          <Text style={styles.pay}>{formatCurrency(payAmount)}</Text>
        </View>
      </View>
      <View style={styles.rowBetween}>
        <StatusBadge status={mapStatus(status)} />
        {status === 'pending' && onApprove ? (
          <Pressable
            onPress={onApprove}
            style={({ pressed }) => [styles.approve, pressed && styles.approvePressed]}
          >
            <Text style={styles.approveLabel}>Approve</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardPressed: { backgroundColor: Colors.cardHover, transform: [{ scale: 0.99 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { ...Typography.bodyLG, color: Colors.textPrimary, fontWeight: '700' },
  meta: { ...Typography.bodyMD, color: Colors.textSecondary, marginTop: 2 },
  hours: { ...Typography.headingMD, color: Colors.textPrimary },
  pay: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  approve: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.button,
  },
  approvePressed: { backgroundColor: Colors.accentPressed, transform: [{ scale: 0.97 }] },
  approveLabel: { color: Colors.textInverse, fontWeight: '700', fontSize: 14 },
});
