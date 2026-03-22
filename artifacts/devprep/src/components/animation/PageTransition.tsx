import { AnimatePresence, type AnimatePresenceProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface PageTransitionProps extends Omit<AnimatePresenceProps, 'children'> {
  children: React.ReactNode
  className?: string
}

export function PageTransition({
  children,
  className,
  mode = 'wait',
  initial = false,
  ...props
}: PageTransitionProps) {
  return (
    <AnimatePresence mode={mode} initial={initial} {...props}>
      <div className={cn('', className)}>{children}</div>
    </AnimatePresence>
  )
}

// Re-export AnimatePresence for direct use
export { AnimatePresence }
