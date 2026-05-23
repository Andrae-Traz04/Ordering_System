// theme/design.ts
export const colors = {
  // Primary brand colors - Light Purple/Lavender theme
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  primarySoft: '#EDE9FE',
  primaryBg: '#F5F3FF',
  
  // Background colors - Light and airy
  bgPrimary: '#FAF8FF',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F5F3FF',
  bgCard: '#FFFFFF',
  
  // Text colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Accent colors
  accent: '#8B5CF6',
  accentDark: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status colors
  statusPending: '#F59E0B',
  statusProcessing: '#8B5CF6',
  statusShipped: '#3B82F6',
  statusCompleted: '#10B981',
  statusCancelled: '#EF4444',
  
  // UI Elements
  shadow: '#8B5CF6',
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
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
}