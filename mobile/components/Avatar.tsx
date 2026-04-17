import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, avatarColorFor } from '../constants/theme';
import { getInitials } from '../lib/format';

interface AvatarProps {
  firstName: string;
  lastName: string;
  color?: string | null;
  size?: 24 | 32 | 40 | 56 | 80;
}

export function Avatar({ firstName, lastName, color, size = 40 }: AvatarProps) {
  const bg = color ?? avatarColorFor(firstName, lastName);
  const fontSize = size <= 32 ? 12 : size <= 40 ? 14 : size <= 56 ? 20 : 28;
  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: Radius.circle,
          backgroundColor: bg,
        },
      ]}
      accessibilityLabel={`Avatar for ${firstName} ${lastName}`}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(firstName, lastName)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.textInverse, fontWeight: '700' },
});
