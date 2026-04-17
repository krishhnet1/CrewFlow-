import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface Props {
  label: string;
  value: string | number;
  accent?: string;
}

export function StatCard({ label, value, accent }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: 2,
  },
  value: { ...Typography.displaySM, color: Colors.textPrimary, fontWeight: '900' },
  label: {
    ...Typography.overline,
    color: Colors.textSecondary,
  },
});
