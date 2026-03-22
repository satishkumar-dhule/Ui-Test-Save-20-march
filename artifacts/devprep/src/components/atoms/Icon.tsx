import * as React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type IconColor =
  | 'default'
  | 'muted'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'inherit'

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  icon: LucideIcon
  size?: IconSize
  color?: IconColor
  label?: string
  decorative?: boolean
}

const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
}

const colorMap: Record<IconColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  destructive: 'text-destructive',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  inherit: 'text-inherit',
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon: LucideIcon,
      size = 'md',
      color = 'default',
      label,
      decorative = false,
      className,
      ...props
    },
    ref
  ) => {
    const ariaProps = decorative
      ? { 'aria-hidden': true, focusable: false as const }
      : { 'aria-label': label || 'Icon', role: 'img' as const }

    return (
      <LucideIcon
        ref={ref}
        className={cn(sizeMap[size], colorMap[color], className)}
        {...ariaProps}
        {...props}
      />
    )
  }
)

Icon.displayName = 'Icon'
