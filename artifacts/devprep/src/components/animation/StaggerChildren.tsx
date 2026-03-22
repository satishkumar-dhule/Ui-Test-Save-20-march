import React, { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/animation/useReducedMotion'
import { cn } from '@/lib/utils'

export interface StaggerProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
  initialDelay?: number
  once?: boolean
  triggerOnView?: boolean
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
}

export function Stagger({
  children,
  className,
  staggerDelay = 50,
  initialDelay = 0,
  once = true,
  triggerOnView = true,
  direction = 'up',
  distance = 20,
}: StaggerProps) {
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
          if (once && containerRef.current) {
            observer.unobserve(containerRef.current)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [reducedMotion, triggerOnView, once])

  const staggerClass = getStaggerClass(direction)

  return (
    <div
      ref={containerRef}
      className={cn(
        'anim-initial',
        isVisible && !reducedMotion && staggerClass,
        isVisible && reducedMotion && 'anim-fade-in-fast',
        className
      )}
      style={{
        '--anim-stagger-increment': `${staggerDelay}ms`,
        '--anim-delay': `${initialDelay}ms`,
        '--anim-distance': `${distance}px`,
      } as React.CSSProperties}
    >
      {React.Children.map(children, (child, index) => (
        <div key={index} className="stagger-child">
          {child}
        </div>
      ))}
    </div>
  )
}

function getStaggerClass(direction: StaggerProps['direction']): string {
  // We'll use the same anim-stagger class but customize via CSS variables
  // For different directions, we could have different keyframes, but for simplicity
  // we'll use anim-stagger (which uses slide-in-up). We can add CSS classes for each direction later.
  return 'anim-stagger'
}

// Alias for compatibility
export const StaggerChildren = Stagger