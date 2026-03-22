import { useAnimation } from 'framer-motion'

export type AnimationControls = ReturnType<typeof useAnimation>

export function useAnimationControls(): AnimationControls {
  return useAnimation()
}

// Preset animation sequences
export const animationPresets = {
  fadeIn: async (controls: AnimationControls) => {
    await controls.start({
      opacity: 1,
      transition: { duration: 0.5 },
    })
  },
  fadeOut: async (controls: AnimationControls) => {
    await controls.start({
      opacity: 0,
      transition: { duration: 0.5 },
    })
  },
  slideInLeft: async (controls: AnimationControls) => {
    await controls.start({
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    })
  },
  slideInRight: async (controls: AnimationControls) => {
    await controls.start({
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    })
  },
  scaleIn: async (controls: AnimationControls) => {
    await controls.start({
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    })
  },
}
