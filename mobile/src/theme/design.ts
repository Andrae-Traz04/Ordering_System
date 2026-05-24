// theme/design.ts
export const colors = {
  // Primary brand colors - purple theme consistent with web
  primary: '#7C3AED',
  primaryDark: '#6C47FF',
  primaryLight: '#9B6DFF',
  primarySoft: '#F3EEFF',
  primaryBg: '#EFF6FF',

  // Background colors - soft, light surfaces
  bgPrimary: '#FAF8FF',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F3EEFF',
  bgCard: '#FFFFFF',

  // Text colors
  textPrimary: '#1e293b',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  // Accent colors
  accent: '#7C3AED',
  accentDark: '#6C47FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Border colors
  border: '#F0EBFF',
  borderLight: '#E0D8FF',

  // Status colors
  statusPending: '#F59E0B',
  statusProcessing: '#6C47FF',
  statusShipped: '#9B6DFF',
  statusCompleted: '#10B981',
  statusCancelled: '#EF4444',

  // UI Elements
  shadow: '#2D1F6E',
  overlay: 'rgba(0, 0, 0, 0.5)',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
}

export const typeScale = {
  caption: 12,
  body: 14,
  subheading: 16,
  heading: 20,
  title: 24,
  hero: 32,
  display: 40,
}

export const typography = {
  caption: {
    fontSize: typeScale.caption,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: typeScale.body,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: typeScale.body,
    fontWeight: '600' as const,
  },
  subheading: {
    fontSize: typeScale.subheading,
    fontWeight: '600' as const,
  },
  heading: {
    fontSize: typeScale.heading,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: typeScale.title,
    fontWeight: '700' as const,
  },
  hero: {
    fontSize: typeScale.hero,
    fontWeight: '800' as const,
  },
}

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 7,
  },
}