// CrewFlow design tokens — see docs/11-design-system.md.
// Dark-only theme. No pure white backgrounds anywhere.

export const Colors = {
  // Background
  bg: '#0B0F1A',
  card: '#141928',
  cardHover: '#1C2238',
  overlay: 'rgba(0,0,0,0.64)',

  // Accent
  accent: '#FF6B2C',
  accentPressed: '#E75A1F',
  accentSoft: 'rgba(255,107,44,0.12)',

  // Status
  success: '#00D67E',
  warning: '#FFB800',
  danger: '#FF4757',
  info: '#3B82F6',
  successSoft: 'rgba(0,214,126,0.12)',
  warningSoft: 'rgba(255,184,0,0.12)',
  dangerSoft: 'rgba(255,71,87,0.12)',
  infoSoft: 'rgba(59,130,246,0.12)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8B92A8',
  textMuted: '#555D75',
  textInverse: '#0B0F1A',

  // Borders
  borderSubtle: '#1F2538',
  borderDefault: '#2A3247',
  borderStrong: '#3A4360',
} as const;

// Area color palette (user-pickable identifiers).
export const AreaColors = [
  '#FF6B2C', // orange
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F59E0B', // amber
  '#EF4444', // red
] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const Radius = {
  sm: 8,
  button: 12,
  input: 12,
  card: 16,
  modal: 20,
  pill: 999,
  circle: 9999,
} as const;

export const Typography = {
  displayXL: { fontSize: 48, lineHeight: 56, fontWeight: '900' as const },
  displayLG: { fontSize: 40, lineHeight: 48, fontWeight: '900' as const },
  displayMD: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  displaySM: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  headingMD: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  headingSM: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  bodyLG: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMD: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

// Deterministic avatar color from name.
export function avatarColorFor(firstName: string, lastName: string): string {
  const key = `${firstName}${lastName}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AreaColors[hash % AreaColors.length];
}
