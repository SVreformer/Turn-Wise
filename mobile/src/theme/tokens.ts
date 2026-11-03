export const Colors = {
  // Backgrounds - Modern Minimalist Slate & Off-White
  bgPrimary: '#F8F9FA',
  bgSecondary: '#F1F3F5',
  bgSurface: '#FFFFFF',
  bgHover: '#E9ECEF',
  bgElevated: '#FFFFFF',

  // Typography - High Contrast Minimalist
  textPrimary: '#111418',
  textSecondary: '#495057',
  textTertiary: '#6C757D',
  textMuted: '#ADB5BD',
  textWhite: '#FFFFFF',

  // Borders & Dividers
  border: '#E9ECEF',
  borderLight: '#F1F3F5',
  borderStrong: '#CED4DA',

  // ========================================================
  // PRIMARY PALETTE: CHARCOAL BLACK, FOREST GREEN, CRIMSON RED
  // ========================================================

  // 1. CHARCOAL BLACK
  charcoalPrimary: '#111418',
  charcoalSurface: '#181C21',
  charcoalCard: '#1F242C',
  charcoalMuted: '#2B313A',
  charcoalBorder: '#262C36',
  brandNavy: '#111418',
  brandNavyLight: '#181C21',

  // 2. FOREST GREEN (Safety, Accessibility, Navigation, Active Route)
  forestPrimary: '#165B33',
  forestDark: '#104526',
  forestEmerald: '#059669',
  forestLight: '#F0FDF4',
  forestTint: 'rgba(22, 91, 51, 0.08)',
  forestTintSolid: '#E8F5E9',

  // 3. CRIMSON RED (Emergency Rescue, Alerts, Attention, Disruption)
  crimsonPrimary: '#C1121F',
  crimsonDark: '#991B1B',
  crimsonBright: '#DC2626',
  crimsonLight: '#FEF2F2',
  crimsonTint: 'rgba(193, 18, 31, 0.08)',
  crimsonTintSolid: '#FEE2E2',

  // Transit Primary Brand mapped to Forest Green & Charcoal
  primary: '#165B33',
  primaryDark: '#104526',
  primaryLight: '#F0FDF4',
  primaryTint: 'rgba(22, 91, 51, 0.08)',
  primaryTintSolid: '#E8F5E9',

  // Aliases for compatibility
  goldPrimary: '#165B33',
  goldDark: '#104526',
  goldLight: '#86EFAC',
  goldTint: 'rgba(22, 91, 51, 0.08)',
  goldTintMedium: 'rgba(22, 91, 51, 0.16)',
  goldTintSolid: '#E8F5E9',

  // Semantic Colors
  success: '#165B33',
  successTint: 'rgba(22, 91, 51, 0.08)',
  successLight: '#F0FDF4',

  warning: '#D97706',
  warningTint: 'rgba(217, 119, 6, 0.08)',
  warningLight: '#FFFBEB',

  error: '#C1121F',
  errorTint: 'rgba(193, 18, 31, 0.08)',
  errorLight: '#FEF2F2',

  info: '#111418',
  infoTint: 'rgba(17, 20, 24, 0.08)',
  infoLight: '#F1F3F5',

  // Map & Platform colors
  mapBg: '#F8F9FA',
  mapGrid: '#E9ECEF',
  platformTrack: '#495057',
  platformBadgeBg: '#F0FDF4',
  platformBadgeBorder: '#165B33',
  platformBadgeText: '#111418'
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  hero: 24,
  button: 10,
  pill: 999
} as const;

export const Typography = {
  display: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.6
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.2
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 20
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 20
  },
  secondary: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 18
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.3
  }
} as const;

import { Platform, ViewStyle } from 'react-native';

const isWeb = Platform.OS === 'web';

export const Shadows = {
  card: (isWeb
    ? { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)' }
    : {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2
    }) as ViewStyle,
  floating: (isWeb
    ? { boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)' }
    : {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4
    }) as ViewStyle,
  sm: (isWeb
    ? { boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)' }
    : {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1
    }) as ViewStyle
};
