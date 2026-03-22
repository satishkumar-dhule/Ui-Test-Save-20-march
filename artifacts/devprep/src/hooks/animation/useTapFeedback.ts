import { type MotionProps } from 'framer-motion'

export interface UseTapFeedbackOptions {
  scale?: number
  opacity?: number
  transition?: MotionProps['transition']
}

export function useTapFeedback({
  scale = 0.95,
  opacity = 0.8,
  transition = { duration: 0.1 },
}: UseTapFeedbackOptions = {}): MotionProps {
  return {
    whileTap: { scale, opacity },
    transition,
  }
}
