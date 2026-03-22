import { type ReactNode, type HTMLAttributes } from 'react'

interface ResponsiveTextProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  as?: 'p' | 'span' | 'div' | 'label'
  variant?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'default' | 'muted' | 'accent' | 'primary' | 'destructive' | 'foreground'
  align?: 'left' | 'center' | 'right'
  truncate?: boolean
  className?: string
}

const variantClasses = {
  xs: 'text-responsive-xs',
  sm: 'text-responsive-sm',
  base: 'text-responsive-base',
  lg: 'text-responsive-lg',
  xl: 'text-responsive-xl',
  '2xl': 'text-responsive-2xl',
  '3xl': 'text-responsive-3xl',
  '4xl': 'text-responsive-4xl',
  '5xl': 'text-responsive-5xl',
}

const weightClasses = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const colorClasses = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  accent: 'text-accent-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
  foreground: 'text-foreground',
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function ResponsiveText({
  children,
  as: Component = 'p',
  variant = 'base',
  weight = 'normal',
  color = 'default',
  align = 'left',
  truncate = false,
  className = '',
  ...props
}: ResponsiveTextProps) {
  return (
    <Component
      className={`
        ${variantClasses[variant]}
        ${weightClasses[weight]}
        ${colorClasses[color]}
        ${alignClasses[align]}
        ${truncate ? 'truncate' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  )
}

// Responsive heading component
interface ResponsiveHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
  variant?: 'responsive' | 'fixed'
  className?: string
}

const headingLevelClasses = {
  1: 'text-responsive-4xl font-bold tracking-tight',
  2: 'text-responsive-3xl font-bold tracking-tight',
  3: 'text-responsive-2xl font-semibold tracking-tight',
  4: 'text-responsive-xl font-semibold',
  5: 'text-responsive-lg font-medium',
  6: 'text-responsive-base font-medium',
}

const fixedHeadingClasses = {
  1: 'text-4xl md:text-5xl font-bold tracking-tight',
  2: 'text-3xl md:text-4xl font-bold tracking-tight',
  3: 'text-2xl md:text-3xl font-semibold tracking-tight',
  4: 'text-xl md:text-2xl font-semibold',
  5: 'text-lg md:text-xl font-medium',
  6: 'text-base md:text-lg font-medium',
}

export function ResponsiveHeading({
  children,
  level = 1,
  variant = 'responsive',
  className = '',
  ...props
}: ResponsiveHeadingProps) {
  const classes = `
    ${variant === 'responsive' ? headingLevelClasses[level] : fixedHeadingClasses[level]}
    ${className}
  `

  switch (level) {
    case 1:
      return (
        <h1 className={classes} {...props}>
          {children}
        </h1>
      )
    case 2:
      return (
        <h2 className={classes} {...props}>
          {children}
        </h2>
      )
    case 3:
      return (
        <h3 className={classes} {...props}>
          {children}
        </h3>
      )
    case 4:
      return (
        <h4 className={classes} {...props}>
          {children}
        </h4>
      )
    case 5:
      return (
        <h5 className={classes} {...props}>
          {children}
        </h5>
      )
    case 6:
      return (
        <h6 className={classes} {...props}>
          {children}
        </h6>
      )
    default:
      return (
        <h1 className={classes} {...props}>
          {children}
        </h1>
      )
  }
}

// Responsive paragraph
interface ResponsiveParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
  size?: 'sm' | 'base' | 'lg'
  color?: 'default' | 'muted'
  leading?: 'tight' | 'normal' | 'relaxed' | 'loose'
  className?: string
}

const paragraphSizeClasses = {
  sm: 'text-responsive-sm',
  base: 'text-responsive-base',
  lg: 'text-responsive-lg',
}

const paragraphColorClasses = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
}

const leadingClasses = {
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
}

export function ResponsiveParagraph({
  children,
  size = 'base',
  color = 'default',
  leading = 'normal',
  className = '',
  ...props
}: ResponsiveParagraphProps) {
  return (
    <p
      className={`
        ${paragraphSizeClasses[size]}
        ${paragraphColorClasses[color]}
        ${leadingClasses[leading]}
        ${className}
      `}
      {...props}
    >
      {children}
    </p>
  )
}

// Responsive label
interface ResponsiveLabelProps extends HTMLAttributes<HTMLLabelElement> {
  children: ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export function ResponsiveLabel({
  children,
  htmlFor,
  required = false,
  className = '',
  ...props
}: ResponsiveLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`
        block text-responsive-sm font-medium text-foreground mb-2
        ${className}
      `}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}
