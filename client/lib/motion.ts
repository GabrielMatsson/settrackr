// Shared Motion conventions — single source for easings, springs and entrance
// variants. Specs are documented in .claude/skills/settrackr-design/SKILL.md.
import type { Transition } from "motion/react"

export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const snappySpring: Transition = { type: "spring", stiffness: 400, damping: 32 }
export const pressSpring: Transition = { type: "spring", stiffness: 400, damping: 25 }
export const gentleSpring: Transition = { type: "spring", stiffness: 60, damping: 16 }
export const popSpring: Transition = { type: "spring", stiffness: 350, damping: 22 }
export const layoutSpring: Transition = { type: "spring", stiffness: 400, damping: 30 }
export const accordionSpring: Transition = { type: "spring", stiffness: 300, damping: 32 }

// Standard fade-up entrance; pass a list index to fadeUpTransition for stagger
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export const staggerDelay = (i: number) => Math.min(i * 0.06, 0.3)

export const fadeUpTransition = (i = 0): Transition => ({
  duration: 0.3,
  ease: easeOut,
  delay: staggerDelay(i),
})
