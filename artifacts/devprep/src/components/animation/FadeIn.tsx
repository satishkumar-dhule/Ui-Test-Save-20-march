import { motion, type Variants } from 'framer-motion'
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

const directionVariants: Record<
  string,
  {
    initial: { opacity: number; x?: number; y?: number }
    animate: { opacity: number; x?: number; y?: number }
  }
> = {
  up: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  down: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
  left: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  },
  right: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
  none: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 20,
  once = true,
  triggerOnView = true,
}: FadeInProps) {
  const variant = directionVariants[direction]

  const initial = { ...variant.initial }
  const animate = { ...variant.animate }

  // Apply custom distance
  if (direction === 'up' || direction === 'down') {
    initial.y = direction === 'up' ? distance : -distance
    animate.y = 0
  } else if (direction === 'left' || direction === 'right') {
    initial.x = direction === 'left' ? distance : -distance
    animate.x = 0
  }

  const variants: Variants = {
    initial,
    animate,
  }

  return (
    <motion.div
      initial="initial"
      whileInView={triggerOnView ? 'animate' : undefined}
      animate={!triggerOnView ? 'animate' : undefined}
      viewport={{ once }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  )
}

// Preset variants for common use cases
// eslint-disable-next-line react-refresh/only-export-components
export const fadeInPresets = {
  subtle: { duration: 0.3, distance: 10 },
  default: { duration: 0.5, distance: 20 },
  slow: { duration: 0.8, distance: 30 },
  spring: { duration: 0.5, distance: 20 },
} as const
