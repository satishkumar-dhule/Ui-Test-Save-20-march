import { motion, type Variants } from 'framer-motion'
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

const slideVariants: Record<
  string,
  { initial: { x?: number; y?: number }; animate: { x?: number; y?: number } }
> = {
  left: {
    initial: { x: -100 },
    animate: { x: 0 },
  },
  right: {
    initial: { x: 100 },
    animate: { x: 0 },
  },
  up: {
    initial: { y: -100 },
    animate: { y: 0 },
  },
  down: {
    initial: { y: 100 },
    animate: { y: 0 },
  },
}

export function SlideIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = 'left',
  distance = 100,
  once = true,
  triggerOnView = true,
}: SlideInProps) {
  const variant = slideVariants[direction]

  const initial = { ...variant.initial }
  const animate = { ...variant.animate }

  // Apply custom distance
  if (direction === 'left' || direction === 'right') {
    initial.x = direction === 'left' ? -distance : distance
  } else {
    initial.y = direction === 'up' ? -distance : distance
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
