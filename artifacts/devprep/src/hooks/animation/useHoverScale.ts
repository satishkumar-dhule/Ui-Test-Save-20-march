import { type MotionProps } from 'framer-motion'

export interface UseHoverScaleOptions {
  scale?: number
  whileHover?: number
  whileTap?: number
  transition?: MotionProps['transition']
}

export function useHoverScale({
  scale = 1.02,
  whileHover,
  whileTap = 0.98,
  transition = { type: 'spring', stiffness: 400, damping: 17 },
}: UseHoverScaleOptions = {}): MotionProps {
  return {
    whileHover: { scale: whileHover ?? scale },
    whileTap: { scale: whileTap },
    transition,
  }
}
