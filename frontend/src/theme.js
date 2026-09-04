// ─── Warm Spiritual Saffron Dark Theme ───
// Inspired by peaceful spiritual ambiance (Kesari / Saffron & Gold accents)

const theme = {
  colors: {
    // Backgrounds
    bg: '#0b0f19',
    bgDark: '#0b0f19',
    bgCard: '#151b2a',
    bgElevated: '#1c2438',
    bgInput: '#111624',
    bgOverlay: 'rgba(0, 0, 0, 0.7)',

    // Primary accent (Saffron Orange / Kesari)
    primary: '#ff6b00',
    primaryLight: '#ff8833',
    primaryDark: '#d95b00',

    // Secondary accent (Warm Gold)
    accent: '#ffaa00',
    accentLight: '#ffcc00',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#a0aec0',
    textMuted: '#64748b',
    textDark: '#0b0f19',

    // Borders
    border: '#232c3f',
    borderLight: '#2e3a52',

    // Gradients
    gradientPrimary: ['#ff6b00', '#d95b00'],
    gradientAccent: ['#ffaa00', '#e69900'],
    gradientDark: ['#0b0f19', '#151b2a'],
    gradientCard: ['#1c2438', '#151b2a'],
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 100,
  },

  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    title: 34,
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },

  shadow: {
    sm: {
      shadowColor: '#ff6b00',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#ff6b00',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#ff6b00',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#ff6b00',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

export default theme;
