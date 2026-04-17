import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface Props {
  eyebrow?: string;
  bigValue: string;
  subtitle?: string;
  style?: ViewStyle;
}

// Uses a solid orange; a gradient would need expo-linear-gradient.
export function HeroCard({ eyebrow, bigValue, subtitle, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.big}>{bigValue}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  eyebrow: {
    ...Typography.overline,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  big: {
    ...Typography.displayXL,
    color: Colors.textInverse,
    fontWeight: '900',
  },
  subtitle: {
    ...Typography.bodyLG,
    color: Colors.textInverse,
    opacity: 0.8,
  },
});
