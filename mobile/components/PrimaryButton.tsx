import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Radius, Typography } from '../constants/theme';

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const isDisabled = !!disabled || !!loading;
  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? Colors.textPrimary : Colors.textInverse} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' && { color: Colors.textPrimary },
            variant === 'danger' && { color: '#fff' },
            isDisabled && { color: Colors.textMuted },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  danger: { backgroundColor: Colors.danger },
  disabled: { backgroundColor: Colors.cardHover },
  pressed: { backgroundColor: Colors.accentPressed, transform: [{ scale: 0.97 }] },
  label: { ...Typography.headingSM, color: Colors.textInverse, fontWeight: '700' },
});
