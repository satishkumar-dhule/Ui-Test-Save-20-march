import React from 'react'
import { motion, type Variants } from 'framer-motion'
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

export function Stagger({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
  once = true,
  triggerOnView = true,
  direction = 'up',
  distance = 20,
}: StaggerProps) {
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

  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  }

  const itemVariants: Variants = {
    initial,
    animate,
  }

  return (
    <motion.div
      initial="initial"
      whileInView={triggerOnView ? 'animate' : undefined}
      animate={!triggerOnView ? 'animate' : undefined}
      viewport={{ once }}
      variants={containerVariants}
      className={cn('', className)}
    >
      {React.Children.map(children, child => (
        <motion.div variants={itemVariants} className="will-change-transform">
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
