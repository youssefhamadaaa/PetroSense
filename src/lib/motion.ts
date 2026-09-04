import type { Variants } from 'framer-motion'

// ---------------------------------------------------------------------------
// Shared Framer Motion variants. Timings kept in the 150–350ms ease-out range
// per the brief. Components pass a reduced-motion flag to soften/skip movement.
// ---------------------------------------------------------------------------

const EASE = [0.16, 1, 0.3, 1] as const // ease-out (expo-ish)

/** Container that staggers its children in. */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
})

/** Fade + slide-up item. Distance collapses to 0 when reduced motion is on. */
export const fadeSlideUp = (reduced = false): Variants => ({
  hidden: { opacity: 0, y: reduced ? 0 : 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE },
  },
})

/** Simple fade — used where movement would be distracting. */
export const fadeIn = (): Variants => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
})

/** Props to reveal a section as it scrolls into view (once). */
export const scrollReveal = {
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: { once: true, amount: 0.3 },
}
