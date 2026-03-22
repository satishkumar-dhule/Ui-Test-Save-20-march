import { motion, type Variants, type Transition as MotionTransition } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TransitionProps {
  children: React.ReactNode
  className?: string
  variants?: Variants
  transition?: MotionTransition
  initial?: string
  animate?: string
  exit?: string
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultTransition: MotionTransition = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1], // easeOutExpo
}

// eslint-disable-next-line react-refresh/only-export-components
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// eslint-disable-next-line react-refresh/only-export-components
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// eslint-disable-next-line react-refresh/only-export-components
export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

// eslint-disable-next-line react-refresh/only-export-components
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export function Transition({
  children,
  className,
  variants = slideUpVariants,
  transition = defaultTransition,
  initial = 'initial',
  animate = 'animate',
  exit = 'exit',
}: TransitionProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      variants={variants}
      transition={transition}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  )
}

// Specialized transitions

export function FadeIn({
  children,
  className,
  transition,
  ...props
}: Omit<TransitionProps, 'variants'> & { transition?: MotionTransition }) {
  return (
    <Transition variants={fadeInVariants} transition={transition} className={className} {...props}>
      {children}
    </Transition>
  )
}

export function SlideUp({
  children,
  className,
  transition,
  ...props
}: Omit<TransitionProps, 'variants'> & { transition?: MotionTransition }) {
  return (
    <Transition variants={slideUpVariants} transition={transition} className={className} {...props}>
      {children}
    </Transition>
  )
}
