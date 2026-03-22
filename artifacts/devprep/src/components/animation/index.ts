// Animation primitives - CSS-based implementations
export { FadeIn, fadeInPresets } from './FadeIn'
export { SlideIn } from './SlideIn'
export { Scale, ScaleIn } from './ScaleIn'
export { Stagger, StaggerChildren } from './StaggerChildren'
export {
  Transition,
  FadeIn as FadeInTransition,
  SlideUp,
  fadeInVariants,
  slideUpVariants,
  slideDownVariants,
  scaleVariants,
} from './Transition'
export { PageTransition, AnimatePresence } from './PageTransition'

// Types
export type { FadeInProps } from './FadeIn'
export type { SlideInProps } from './SlideIn'
export type { ScaleProps } from './ScaleIn'
export type { StaggerProps } from './StaggerChildren'
export type { TransitionProps } from './Transition'
export type { PageTransitionProps } from './PageTransition'