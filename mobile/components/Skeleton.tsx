import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors, Radius } from '../constants/theme';

interface Props {
  height?: number;
  width?: number | string;
  style?: ViewStyle;
  radius?: number;
}

export function Skeleton({ height = 16, width = '100%', style, radius = Radius.sm }: Props) {
  return (
    <View
      style={[
        {
          height,
          width: width as any,
          backgroundColor: Colors.cardHover,
          borderRadius: radius,
        },
        style,
      ]}
    />
  );
}
