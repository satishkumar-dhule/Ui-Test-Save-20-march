import * as React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Badge, BadgeProps } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Text } from '@/components/atoms/Text'

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  icon?: LucideIcon
  label: string
  description?: string
  showBadge?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusColors: Record<StatusType, { color: string; bgColor: string; borderColor: string }> = {
  success: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
  },
  warning: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
  },
  info: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  neutral: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
  },
}

const statusBadgeVariant: Record<StatusType, BadgeProps['variant']> = {
  success: 'success',
  warning: 'warning',
  error: 'destructive',
  info: 'default',
  neutral: 'secondary',
}

export const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  (
    { status, icon, label, description, showBadge = true, size = 'md', className, ...props },
    ref
  ) => {
    const colors = statusColors[status]

    return (
      <div ref={ref} className={cn('flex items-start gap-3', className)} {...props}>
        <div
          className={cn(
            'flex-shrink-0 rounded-lg p-2',
            colors.bgColor,
            colors.borderColor,
            'border'
          )}
        >
          {icon ? (
            <Icon
              icon={icon}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              color="inherit"
              decorative
            />
          ) : (
            <div
              className={cn(
                'rounded-full',
                size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5',
                colors.bgColor
              )}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Text
              variant="p"
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base'}
              weight="medium"
              className={colors.color}
            >
              {label}
            </Text>
            {showBadge && (
              <Badge variant={statusBadgeVariant[status]} size="sm">
                {status}
              </Badge>
            )}
          </div>

          {description && (
            <Text variant="p" size="sm" color="muted" className="mt-1">
              {description}
            </Text>
          )}
        </div>
      </div>
    )
  }
)

StatusIndicator.displayName = 'StatusIndicator'
