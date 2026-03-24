import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

export type ProgressBarColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'destructive'

interface ProgressBarProps {
  label: string
  value: number
  max?: number
  color?: ProgressBarColor
  showPercentage?: boolean
  showTooltip?: boolean
  loading?: boolean
  className?: string
}

const colorMap: Record<ProgressBarColor, string> = {
  primary: 'var(--theme-primary-color)',
  secondary: 'var(--theme-fg-muted)',
  accent: 'var(--theme-accent-color)',
  success: 'var(--theme-success)',
  warning: 'var(--theme-warning)',
  destructive: 'var(--theme-destructive)',
}

export function ProgressBar({
  label,
  value,
  max = 100,
  color = 'primary',
  showPercentage = true,
  showTooltip = true,
  loading = false,
  className,
}: ProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const [showFullTooltip, setShowFullTooltip] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      setAnimatedValue(percentage)
    }, 100)

    return () => clearTimeout(timer)
  }, [percentage, loading])

  useEffect(() => {
    if (!showTooltip) return

    const handleMouseEnter = () => setShowFullTooltip(true)
    const handleMouseLeave = () => setShowFullTooltip(false)

    const element = barRef.current
    element?.addEventListener('mouseenter', handleMouseEnter)
    element?.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element?.removeEventListener('mouseenter', handleMouseEnter)
      element?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [showTooltip])

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-[var(--theme-bg-muted)] rounded animate-pulse" />
          <div className="h-4 w-12 bg-[var(--theme-bg-muted)] rounded animate-pulse" />
        </div>
        <div className="h-3 w-full bg-[var(--theme-bg-muted)] rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-[var(--theme-bg-muted)] rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--theme-fg-base)' }}>
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm" style={{ color: 'var(--theme-fg-muted)' }}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div
        ref={barRef}
        className="relative h-3 w-full bg-[var(--theme-bg-muted)] rounded-full overflow-hidden cursor-pointer"
        style={{ backgroundColor: 'var(--theme-bg-muted)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${animatedValue}%`,
            backgroundColor: colorMap[color],
          }}
        />
        {showFullTooltip && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-xs text-white whitespace-nowrap z-10"
            style={{
              backgroundColor: 'var(--theme-fg-inverted)',
              color: 'var(--theme-fg-base)',
            }}
          >
            {value} / {max}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressBar
