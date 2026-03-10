import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useUIState } from '../contexts/UIStateContext';
import { designTokens } from '../design-tokens';
import '../styles/layout.css';

export default function Layout({ children }) {
  const { isDark } = useContext(ThemeContext);
  const { mobileMenuOpen } = useUIState();

  return (
    <div
      className="layout"
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        '--color-primary-50': designTokens.colors.primary[50],
        '--color-primary-100': designTokens.colors.primary[100],
        '--color-primary-200': designTokens.colors.primary[200],
        '--color-primary-500': designTokens.colors.primary[500],
        '--color-primary-600': designTokens.colors.primary[600],
        '--color-primary-700': designTokens.colors.primary[700],
        '--color-primary-900': designTokens.colors.primary[900],
        '--color-success-500': designTokens.colors.success[500],
        '--color-success-600': designTokens.colors.success[600],
        '--color-warning-500': designTokens.colors.warning[500],
        '--color-warning-600': designTokens.colors.warning[600],
        '--color-error-500': designTokens.colors.error[500],
        '--color-error-600': designTokens.colors.error[600],
        '--color-neutral-0': designTokens.colors.neutral[0],
        '--color-neutral-50': designTokens.colors.neutral[50],
        '--color-neutral-100': designTokens.colors.neutral[100],
        '--color-neutral-200': designTokens.colors.neutral[200],
        '--color-neutral-500': designTokens.colors.neutral[500],
        '--color-neutral-600': designTokens.colors.neutral[600],
        '--color-neutral-700': designTokens.colors.neutral[700],
        '--color-neutral-900': designTokens.colors.neutral[900],
        '--font-sans': designTokens.typography.fontFamily.sans,
        '--font-mono': designTokens.typography.fontFamily.mono,
        '--spacing-xs': designTokens.spacing.xs,
        '--spacing-sm': designTokens.spacing.sm,
        '--spacing-md': designTokens.spacing.md,
        '--spacing-lg': designTokens.spacing.lg,
        '--spacing-xl': designTokens.spacing.xl,
        '--spacing-2xl': designTokens.spacing['2xl'],
        '--spacing-3xl': designTokens.spacing['3xl'],
        '--spacing-4xl': designTokens.spacing['4xl'],
        '--radius-sm': designTokens.borderRadius.sm,
        '--radius-md': designTokens.borderRadius.md,
        '--radius-lg': designTokens.borderRadius.lg,
        '--radius-xl': designTokens.borderRadius.xl,
        '--shadow-sm': designTokens.shadows.sm,
        '--shadow-md': designTokens.shadows.md,
        '--shadow-lg': designTokens.shadows.lg,
        '--transition-fast': designTokens.transitions.fast,
        '--transition-base': designTokens.transitions.base,
        '--transition-slow': designTokens.transitions.slow,
      }}
    >
      {children}
    </div>
  );
}
