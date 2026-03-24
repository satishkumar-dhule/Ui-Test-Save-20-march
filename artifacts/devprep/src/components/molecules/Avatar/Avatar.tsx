import { cn } from '@/lib/utils/cn'
import { forwardRef, useState, useEffect } from 'react'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'square' | 'rounded'
  status?: 'online' | 'offline' | 'busy' | 'away'
  showStatus?: boolean
}

const sizeMap = {
  xs: { container: 'w-6 h-6 text-[10px]', status: 'w-1.5 h-1.5 border' },
  sm: { container: 'w-8 h-8 text-xs', status: 'w-2 h-2 border' },
  md: { container: 'w-10 h-10 text-sm', status: 'w-2.5 h-2.5 border-[2px]' },
  lg: { container: 'w-14 h-14 text-lg', status: 'w-3.5 h-3.5 border-[2px]' },
  xl: { container: 'w-20 h-20 text-2xl', status: 'w-5 h-5 border-[3px]' },
}

const shapeMap = {
  circle: 'rounded-full',
  square: 'rounded',
  rounded: 'rounded-xl',
}

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-text-tertiary',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    { className, src, alt, fallback, size = 'md', shape = 'circle', status, showStatus, ...props },
    ref
  ) => {
    const [imgError, setImgError] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    }

    const showFallback = !src || imgError

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden bg-neutral-200 text-neutral-600 font-medium',
          sizeMap[size].container,
          shapeMap[shape],
          className
        )}
        {...props}
      >
        {showFallback ? (
          <span className="flex items-center justify-center w-full h-full uppercase">
            {fallback ? getInitials(fallback) : '?'}
          </span>
        ) : mounted ? (
          <img
            src={src}
            alt={alt || ''}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : null}
        {showStatus && status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full',
              statusColors[status],
              sizeMap[size].status
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'
