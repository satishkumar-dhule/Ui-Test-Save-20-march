import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

export type StatColor = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive'

interface StatsCardProps {
  label: string
  value: number | string
  trend?: string
  icon?: string
  color?: StatColor
  loading?: boolean
  className?: string
}

const colorMap: Record<StatColor, { icon: string; bg: string; text: string }> = {
  primary: {
    icon: 'var(--theme-primary-color)',
    bg: 'var(--theme-primary-color)',
    text: 'var(--theme-primary-color)',
  },
  secondary: {
    icon: 'var(--theme-fg-muted)',
    bg: 'var(--theme-secondary-color)',
    text: 'var(--theme-fg-base)',
  },
  accent: {
    icon: 'var(--theme-accent-color)',
    bg: 'var(--theme-accent-color)',
    text: 'var(--theme-accent-color)',
  },
  success: {
    icon: 'var(--theme-success)',
    bg: 'var(--theme-success)',
    text: 'var(--theme-success)',
  },
  warning: {
    icon: 'var(--theme-warning)',
    bg: 'var(--theme-warning)',
    text: 'var(--theme-warning)',
  },
  destructive: {
    icon: 'var(--theme-destructive)',
    bg: 'var(--theme-destructive)',
    text: 'var(--theme-destructive)',
  },
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const startTime = performance.now()
    const startValue = 0
    const endValue = value

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut)

      setDisplayValue(currentValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  return <span>{displayValue}</span>
}

export function StatsCard({
  label,
  value,
  trend,
  icon,
  color = 'primary',
  loading = false,
  className,
}: StatsCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-[var(--theme-border-base)] bg-[var(--theme-surface-base)] p-4',
          'animate-pulse',
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 bg-[var(--theme-bg-muted)] rounded" />
          <div className="size-8 bg-[var(--theme-bg-muted)] rounded-lg" />
        </div>
        <div className="h-8 w-16 bg-[var(--theme-bg-muted)] rounded mb-2" />
        <div className="h-2 w-20 bg-[var(--theme-bg-muted)] rounded-full" />
      </div>
    )
  }

  const isPositiveTrend = trend && (trend.startsWith('+') || !trend.startsWith('-'))
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--theme-border-base)] bg-[var(--theme-surface-base)] p-4',
        'transition-all duration-300 hover:shadow-[var(--theme-shadow-md)] hover:-translate-y-1',
        'opacity-0',
        isVisible && 'animate-fade-in',
        className
      )}
      style={{
        opacity: isVisible ? undefined : 0,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm font-medium text-[var(--theme-fg-muted)]"
          style={{ color: 'var(--theme-fg-muted)' }}
        >
          {label}
        </span>
        {icon && (
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `color-mix(in hsl, ${colors.bg} 15%, transparent)`,
            }}
          >
            <span className="text-lg" style={{ color: colors.text }}>
              {icon}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-bold" style={{ color: 'var(--theme-fg-base)' }}>
          {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
        </span>
      </div>
      {trend && (
        <div className="flex items-center gap-1">
          <span
            className={cn('text-xs font-medium flex items-center gap-0.5')}
            style={{
              color: isPositiveTrend ? 'var(--theme-success)' : 'var(--theme-destructive)',
            }}
          >
            {isPositiveTrend ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
            {trend}
          </span>
        </div>
      )}
    </div>
  )
}

export default StatsCard
