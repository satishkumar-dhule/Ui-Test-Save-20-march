import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

export type MiniChartType = 'line' | 'bar'
export type MiniChartColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'destructive'

interface MiniChartProps {
  data: number[]
  type?: MiniChartType
  color?: MiniChartColor
  loading?: boolean
  className?: string
}

const colorMap: Record<MiniChartColor, string> = {
  primary: 'var(--theme-primary-color)',
  secondary: 'var(--theme-fg-muted)',
  accent: 'var(--theme-accent-color)',
  success: 'var(--theme-success)',
  warning: 'var(--theme-warning)',
  destructive: 'var(--theme-destructive)',
}

function generatePath(data: number[], width: number, height: number): string {
  if (data.length < 2) return ''

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data.map((value, index) => {
    const x = index * step
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
}

function generateAreaPath(data: number[], width: number, height: number): string {
  if (data.length < 2) return ''

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data.map((value, index) => {
    const x = index * step
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const closePath = ` L ${width},${height} L 0,${height} Z`

  return linePath + closePath
}

export function MiniChart({
  data,
  type = 'line',
  color = 'primary',
  loading = false,
  className,
}: MiniChartProps) {
  const [animatedData, setAnimatedData] = useState<number[]>([])
  const [dimensions, setDimensions] = useState({ width: 100, height: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading || data.length === 0) {
      setAnimatedData(data)
      return
    }

    const animTimeout = setTimeout(() => {
      setAnimatedData(data)
    }, 50)

    return () => clearTimeout(animTimeout)
  }, [data, loading])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setDimensions({ width: width || 100, height: 50 })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const chartColor = colorMap[color]
  const padding = 4
  const chartWidth = dimensions.width - padding * 2
  const chartHeight = dimensions.height - padding * 2

  if (loading || data.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'h-[50px] w-full bg-[var(--theme-bg-muted)] rounded animate-pulse',
          className
        )}
      />
    )
  }

  if (type === 'line') {
    const path = generatePath(animatedData, chartWidth, chartHeight)
    const areaPath = generateAreaPath(animatedData, chartWidth, chartHeight)

    return (
      <div ref={containerRef} className={cn('h-[50px] w-full', className)}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={areaPath}
            fill={`url(#gradient-${color})`}
            className="transition-all duration-1000 ease-out"
          />
          <path
            d={path}
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>
    )
  }

  const barWidth = chartWidth / data.length
  const maxValue = Math.max(...data)

  return (
    <div ref={containerRef} className={cn('h-[50px] w-full flex items-end gap-px', className)}>
      {animatedData.map((value, index) => (
        <div
          key={index}
          className="flex-1 transition-all duration-500 ease-out"
          style={{
            height: `${(value / maxValue) * 100}%`,
            backgroundColor: chartColor,
            opacity: 0.7 + (value / maxValue) * 0.3,
          }}
        />
      ))}
    </div>
  )
}

export default MiniChart
