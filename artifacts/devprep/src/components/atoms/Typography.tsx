import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
export type HeadingWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
export type HeadingTracking = 'tighter' | 'tight' | 'normal' | 'wide'

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
  size?: HeadingSize
  weight?: HeadingWeight
  tracking?: HeadingTracking
  asChild?: boolean
}

const headingSizeMap: Record<HeadingSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
}

const headingWeightMap: Record<HeadingWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
}

const headingTrackingMap: Record<HeadingTracking, string> = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
}

const headingLevelSizeDefaults: Record<
  HeadingLevel,
  { size: HeadingSize; weight: HeadingWeight; tracking: HeadingTracking }
> = {
  1: { size: '4xl', weight: 'bold', tracking: 'tighter' },
  2: { size: '3xl', weight: 'semibold', tracking: 'tight' },
  3: { size: '2xl', weight: 'semibold', tracking: 'tight' },
  4: { size: 'xl', weight: 'medium', tracking: 'normal' },
  5: { size: 'lg', weight: 'medium', tracking: 'normal' },
  6: { size: 'md', weight: 'medium', tracking: 'normal' },
}

export function Heading({
  level = 1,
  size,
  weight,
  tracking,
  className,
  children,
  ...props
}: HeadingProps) {
  const defaults = headingLevelSizeDefaults[level]
  const resolvedSize = size ?? defaults.size
  const resolvedWeight = weight ?? defaults.weight
  const resolvedTracking = tracking ?? defaults.tracking

  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements

  return React.createElement(Tag, {
    className: cn(
      'scroll-m-20',
      headingSizeMap[resolvedSize],
      headingWeightMap[resolvedWeight],
      headingTrackingMap[resolvedTracking],
      'leading-tight',
      className
    ),
    ...props,
    children,
  })
}

export type TextVariant = 'p' | 'span' | 'div' | 'label' | 'blockquote' | 'code'
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
  truncate?: boolean
  lineClamp?: 2 | 3 | 4
  italic?: boolean
  asChild?: boolean
}

const textVariantMap: Record<TextVariant, string> = {
  p: 'leading-relaxed',
  span: '',
  div: '',
  label: '',
  blockquote: 'border-l-2 border-muted pl-4 italic text-muted-foreground',
  code: 'font-mono text-sm bg-muted px-1.5 py-0.5 rounded',
}

const textSizeMap: Record<TextSize, string> = {
  xs: 'text-xs leading-normal',
  sm: 'text-sm leading-normal',
  base: 'text-base leading-relaxed',
  lg: 'text-lg leading-relaxed',
  xl: 'text-xl leading-relaxed',
  '2xl': 'text-2xl leading-relaxed',
  '3xl': 'text-3xl leading-relaxed',
}

const textWeightMap: Record<TextWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const textColorMap: Record<TextColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  destructive: 'text-destructive',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
}

const textElementMap: Record<TextVariant, string> = {
  p: 'p',
  span: 'span',
  div: 'div',
  label: 'label',
  blockquote: 'blockquote',
  code: 'code',
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      variant = 'p',
      size = 'base',
      weight,
      color = 'default',
      className,
      truncate = false,
      lineClamp,
      italic = false,
      children,
      ...props
    },
    ref
  ) => {
    const Element = textElementMap[variant]
    const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : ''
    const truncateClass = truncate ? 'truncate' : ''

    return React.createElement(
      Element,
      {
        ref,
        className: cn(
          textVariantMap[variant],
          textSizeMap[size],
          weight && textWeightMap[weight],
          textColorMap[color],
          truncateClass,
          lineClampClass,
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

export interface CaptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'xs'
}

export function Caption({ size = 'sm', className, children, ...props }: CaptionProps) {
  return (
    <p
      className={cn(
        'text-muted-foreground tracking-wide',
        size === 'xs' ? 'text-xs' : 'text-sm',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export interface OverlineProps extends React.HTMLAttributes<HTMLSpanElement> {
  uppercase?: boolean
}

export function Overline({ className, children, uppercase = true, ...props }: OverlineProps) {
  return (
    <span
      className={cn(
        'text-xs font-semibold tracking-widest uppercase',
        uppercase && 'uppercase',
        'text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: '4xl' | '5xl' | '6xl'
}

export function Display({ size = '5xl', className, children, ...props }: DisplayProps) {
  return (
    <h1
      className={cn(
        'font-bold tracking-tighter leading-none',
        size === '4xl' && 'text-4xl',
        size === '5xl' && 'text-5xl',
        size === '6xl' && 'text-6xl',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export type LinkWeight = 'normal' | 'medium' | 'semibold'
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  weight?: LinkWeight
  underline?: boolean
}

export function Link({
  weight = 'medium',
  underline = true,
  className,
  children,
  ...props
}: LinkProps) {
  return (
    <a
      className={cn(
        'text-primary transition-colors',
        underline && 'hover:underline underline-offset-4',
        weight === 'normal' && 'font-normal',
        weight === 'medium' && 'font-medium',
        weight === 'semibold' && 'font-semibold',
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}
