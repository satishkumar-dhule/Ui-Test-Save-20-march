import { motion, type Variants } from 'framer-motion'
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
  duration = 0.4,
  initialScale = 0.9,
  animateScale = 1,
  once = true,
  triggerOnView = true,
}: ScaleProps) {
  const variants: Variants = {
    initial: { opacity: 0, scale: initialScale },
    animate: { opacity: 1, scale: animateScale },
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
