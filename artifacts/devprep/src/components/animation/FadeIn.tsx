import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/animation/useReducedMotion'
import { cn } from '@/lib/utils'

export interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  once?: boolean
  triggerOnView?: boolean
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 300,
  direction = 'up',
  distance = 20,
  once = true,
  triggerOnView = true,
}: FadeInProps) {
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true)
      return
    }

    if (!triggerOnView) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [reducedMotion, triggerOnView, once])

  const animationClass = getAnimationClass(direction, duration, delay)

  return (
    <div
      ref={elementRef}
      className={cn(
        'anim-initial',
        isVisible && !reducedMotion && animationClass,
        isVisible && reducedMotion && 'anim-fade-in-fast',
        className
      )}
      style={{
        '--anim-distance': `${distance}px`,
        '--anim-duration': `${duration}ms`,
        '--anim-delay': `${delay}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

function getAnimationClass(
  direction: FadeInProps['direction'],
  duration: number,
  delay: number
): string {
  // For custom durations/delays, we could use CSS variables
  // For now, return base class
  switch (direction) {
    case 'up':
      return 'anim-slide-in-up'
    case 'down':
      return 'anim-slide-in-down'
    case 'left':
      return 'anim-slide-in-left'
    case 'right':
      return 'anim-slide-in-right'
    case 'none':
    default:
      return 'anim-fade-in'
  }
}

// Preset variants for common use cases
export const fadeInPresets = {
  subtle: { duration: 200, distance: 10 },
  default: { duration: 300, distance: 20 },
  slow: { duration: 500, distance: 30 },
  spring: { duration: 300, distance: 20 },
} as const