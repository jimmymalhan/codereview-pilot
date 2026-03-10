/**
 * Design Token System - Phase B
 * Central source of truth for all design values
 * WCAG 2.1 AA compliant
 */

export const designTokens = {
  // Color System
  colors: {
    // Primary
    primary: {
      50: '#F0F4FF',
      100: '#E0E7FF',
      200: '#C7D4FF',
      500: '#4F46E5',
      600: '#4338CA',
      700: '#3730A3',
      900: '#1E1B4B',
    },
    // Semantic
    success: {
      500: '#10B981',
      600: '#059669',
    },
    warning: {
      500: '#F59E0B',
      600: '#D97706',
    },
    error: {
      500: '#EF4444',
      600: '#DC2626',
    },
    // Neutral
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      900: '#111827',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'Courier New', Courier, monospace",
    },
    // Heading Scales
    h1: {
      fontSize: '3.5rem', // 56px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.75rem', // 44px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem', // 32px
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    // Body Text
    body: {
      lg: {
        fontSize: '1.125rem', // 18px
        fontWeight: 400,
        lineHeight: 1.6,
      },
      base: {
        fontSize: '1rem', // 16px
        fontWeight: 400,
        lineHeight: 1.6,
      },
      sm: {
        fontSize: '0.875rem', // 14px
        fontWeight: 400,
        lineHeight: 1.5,
      },
    },
    // Button Text
    buttonLarge: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
    },
    buttonMedium: {
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
    },
    // Caption
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      lineHeight: 1.4,
    },
  },

  // Spacing (16px base unit)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '80px',
  },

  // Border Radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
  },

  // Transitions
  transitions: {
    fast: '0.15s ease-in-out',
    base: '0.3s ease-in-out',
    slow: '0.5s ease-in-out',
  },

  // Breakpoints
  breakpoints: {
    mobile: '0px',
    tablet: '768px',
    desktop: '1200px',
    wide: '1400px',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    backdrop: 40,
    modal: 50,
    tooltip: 60,
  },

  // Container Sizes
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
  },
};

// Export individual token groups for convenience
export const {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  container,
} = designTokens;
