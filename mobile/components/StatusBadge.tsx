import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';

export type StatusKind =
  | 'approved'
  | 'pending'
  | 'in_progress'
  | 'upcoming'
  | 'late'
  | 'auto_closed'
  | 'discarded'
  | 'paid';

interface Props {
  status: StatusKind;
  label?: string;
}

const PALETTE: Record<StatusKind, { bg: string; fg: string; label: string }> = {
  approved: { bg: Colors.successSoft, fg: Colors.success, label: 'Approved' },
  pending: { bg: Colors.warningSoft, fg: Colors.warning, label: 'Pending' },
  in_progress: { bg: Colors.infoSoft, fg: Colors.info, label: 'In progress' },
  upcoming: { bg: Colors.infoSoft, fg: Colors.info, label: 'Upcoming' },
  late: { bg: Colors.warningSoft, fg: Colors.warning, label: 'Late' },
  auto_closed: { bg: Colors.dangerSoft, fg: Colors.danger, label: 'Auto-closed' },
  discarded: { bg: Colors.dangerSoft, fg: Colors.danger, label: 'Discarded' },
  paid: { bg: Colors.successSoft, fg: Colors.success, label: 'Paid' },
};

export function StatusBadge({ status, label }: Props) {
  const p = PALETTE[status];
  return (
    <View style={[styles.pill, { backgroundColor: p.bg }]}>
      <Text style={[styles.label, { color: p.fg }]}>{label ?? p.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 24,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
