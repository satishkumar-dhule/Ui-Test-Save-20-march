import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label'
export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
export type TextWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
export type TextColor =
  | 'default'
  | 'muted'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  size?: TextSize
  weight?: TextWeight
  color?: TextColor
  asChild?: boolean
  truncate?: boolean
  italic?: boolean
}

const variantMap: Record<TextVariant, string> = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',
  h5: 'text-base font-medium',
  h6: 'text-sm font-medium',
  p: 'text-base',
  span: 'text-base',
  label: 'text-sm font-medium',
}

const sizeMap: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
}

const weightMap: Record<TextWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const colorMap: Record<TextColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  destructive: 'text-destructive',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
}

const elementMap: Record<TextVariant, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'p',
  span: 'span',
  label: 'label',
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      variant = 'p',
      size,
      weight,
      color = 'default',
      className,
      truncate = false,
      italic = false,
      children,
      ...props
    },
    ref
  ) => {
    const Element = elementMap[variant]

    return React.createElement(
      Element,
      {
        ref,
        className: cn(
          variantMap[variant],
          size && sizeMap[size],
          weight && weightMap[weight],
          colorMap[color],
          truncate && 'truncate',
          italic && 'italic',
          className
        ),
        ...props,
      },
      children
    )
  }
)

Text.displayName = 'Text'
