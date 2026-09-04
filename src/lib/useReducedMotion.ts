import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/**
 * Thin re-export so app code has a single import path for reduced-motion.
 * Framer Motion already tracks the OS `prefers-reduced-motion` setting; use
 * this to gate/soften any custom animations.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false
}
