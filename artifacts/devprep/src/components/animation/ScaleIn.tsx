import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/animation/useReducedMotion'
import { cn } from '@/lib/utils'

export interface ScaleProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  initialScale?: number
  animateScale?: number
  once?: boolean
  triggerOnView?: boolean
}

export function Scale({
  children,
  className,
  delay = 0,
  duration = 300,
  initialScale = 0.95,
  animateScale = 1,
  once = true,
  triggerOnView = true,
}: ScaleProps) {
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

  return (
    <div
      ref={elementRef}
      className={cn(
        'anim-initial',
        isVisible && !reducedMotion && 'anim-scale-in',
        isVisible && reducedMotion && 'anim-fade-in-fast',
        className
      )}
      style={{
        '--scale-initial': initialScale,
        '--scale-final': animateScale,
        '--anim-duration': `${duration}ms`,
        '--anim-delay': `${delay}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

// Alias for compatibility
export const ScaleIn = Scale