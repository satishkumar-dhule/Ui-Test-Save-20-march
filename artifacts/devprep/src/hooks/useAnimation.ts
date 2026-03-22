import { useState, useEffect, useCallback, useRef } from 'react'
import { useReducedMotion } from './animation/useReducedMotion'

export interface AnimationOptions {
  /** Duration in milliseconds */
  duration?: number
  /** Delay in milliseconds */
  delay?: number
  /** Easing function */
  easing?: string
  /** Whether to respect reduced motion preference */
  respectReducedMotion?: boolean
}

export interface UseAnimationReturn {
  /** Whether reduced motion is preferred */
  reducedMotion: boolean
  /** Start an animation by adding a CSS class */
  startAnimation: (element: HTMLElement, className: string, options?: AnimationOptions) => void
  /** Stop an animation by removing a CSS class */
  stopAnimation: (element: HTMLElement, className: string) => void
  /** Toggle an animation class */
  toggleAnimation: (element: HTMLElement, className: string, options?: AnimationOptions) => void
  /** Apply animation with automatic cleanup */
  applyAnimation: (element: HTMLElement, className: string, options?: AnimationOptions) => () => void
}

/**
 * Hook for CSS-based animations with reduced motion support
 */
export function useAnimation(): UseAnimationReturn {
  const reducedMotion = useReducedMotion()
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current.clear()
    }
  }, [])

  const startAnimation = useCallback(
    (element: HTMLElement, className: string, options: AnimationOptions = {}) => {
      const { delay = 0, respectReducedMotion = true } = options

      if (respectReducedMotion && reducedMotion) {
        // Skip animation, just apply final state
        element.classList.add(className)
        return
      }

      const addClass = () => {
        element.classList.add(className)
      }

      if (delay > 0) {
        const timeoutId = setTimeout(addClass, delay)
        timeoutsRef.current.add(timeoutId)
      } else {
        addClass()
      }
    },
    [reducedMotion]
  )

  const stopAnimation = useCallback((element: HTMLElement, className: string) => {
    element.classList.remove(className)
  }, [])

  const toggleAnimation = useCallback(
    (element: HTMLElement, className: string, options: AnimationOptions = {}) => {
      if (element.classList.contains(className)) {
        stopAnimation(element, className)
      } else {
        startAnimation(element, className, options)
      }
    },
    [startAnimation, stopAnimation]
  )

  const applyAnimation = useCallback(
    (element: HTMLElement, className: string, options: AnimationOptions = {}) => {
      startAnimation(element, className, options)

      // Return cleanup function
      return () => {
        stopAnimation(element, className)
      }
    },
    [startAnimation, stopAnimation]
  )

  return {
    reducedMotion,
    startAnimation,
    stopAnimation,
    toggleAnimation,
    applyAnimation,
  }
}

/**
 * Preset animation configurations
 */
export const animationPresets = {
  fadeIn: {
    className: 'anim-fade-in',
    duration: 300,
  },
  fadeInSlow: {
    className: 'anim-fade-in-slow',
    duration: 500,
  },
  slideInUp: {
    className: 'anim-slide-in-up',
    duration: 300,
  },
  slideInDown: {
    className: 'anim-slide-in-down',
    duration: 300,
  },
  slideInLeft: {
    className: 'anim-slide-in-left',
    duration: 300,
  },
  slideInRight: {
    className: 'anim-slide-in-right',
    duration: 300,
  },
  scaleIn: {
    className: 'anim-scale-in',
    duration: 300,
  },
  scaleInSlow: {
    className: 'anim-scale-in-slow',
    duration: 500,
  },
  stagger: {
    className: 'anim-stagger',
  },
  buttonHover: {
    className: 'anim-button-hover',
  },
  cardHover: {
    className: 'anim-card-hover',
  },
} as const

export type AnimationPreset = keyof typeof animationPresets