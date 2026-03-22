/**
 * Spacing scale based on Apple Glass Theme tokens.
 * These values align with CSS variables defined in layout.css.
 */

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
  '5xl': '8rem', // 128px
} as const

export type SpacingKey = keyof typeof spacing

/**
 * Returns a CSS variable reference for dynamic spacing
 */
export function getSpacingVariable(key: SpacingKey): string {
  return `var(--space-${key === 'xs' ? '1' : key === 'sm' ? '2' : key === 'md' ? '3' : key === 'lg' ? '4' : key === 'xl' ? '5' : key === '2xl' ? '6' : key === '3xl' ? '8' : key === '4xl' ? '10' : key === '5xl' ? '12' : '16'})`
}

/**
 * Responsive spacing presets for different contexts
 */
export const responsiveSpacing = {
  containerPadding: {
    sm: { mobile: spacing.md, tablet: spacing.lg, desktop: spacing.xl },
    md: { mobile: spacing.lg, tablet: spacing.xl, desktop: spacing['2xl'] },
    lg: { mobile: spacing.xl, tablet: spacing['2xl'], desktop: spacing['3xl'] },
  },
  sectionGap: {
    sm: { mobile: spacing.lg, tablet: spacing.xl, desktop: spacing['2xl'] },
    md: { mobile: spacing.xl, tablet: spacing['2xl'], desktop: spacing['3xl'] },
    lg: { mobile: spacing['2xl'], tablet: spacing['3xl'], desktop: spacing['4xl'] },
  },
  cardPadding: {
    sm: { mobile: spacing.sm, tablet: spacing.md, desktop: spacing.lg },
    md: { mobile: spacing.md, tablet: spacing.lg, desktop: spacing.xl },
    lg: { mobile: spacing.lg, tablet: spacing.xl, desktop: spacing['2xl'] },
  },
}
