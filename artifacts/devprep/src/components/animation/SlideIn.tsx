import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/animation/useReducedMotion'
import { cn } from '@/lib/utils'

export interface SlideInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'left' | 'right' | 'up' | 'down'
  distance?: number
  once?: boolean
  triggerOnView?: boolean
}

export function SlideIn({
  children,
  className,
  delay = 0,
  duration = 300,
  direction = 'left',
  distance = 100,
  once = true,
  triggerOnView = true,
}: SlideInProps) {
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

  const animationClass = getSlideAnimationClass(direction)

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

function getSlideAnimationClass(direction: SlideInProps['direction']): string {
  switch (direction) {
    case 'left':
      return 'anim-slide-in-left'
    case 'right':
      return 'anim-slide-in-right'
    case 'up':
      return 'anim-slide-in-up'
    case 'down':
      return 'anim-slide-in-down'
    default:
      return 'anim-slide-in-left'
  }
}