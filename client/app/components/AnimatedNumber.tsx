"use client"

import { useEffect } from "react"
import { animate, motion, useMotionValue, useTransform, useReducedMotion } from "motion/react"
import { easeOut } from "@/lib/motion"

type Props = {
  value: number
  // Decimal places shown while rolling (default 0 — whole numbers only)
  decimals?: number
  // Receives the already-rounded value, so it can never print raw float spam
  format?: (v: number) => string
  className?: string
}

// Rolls a number from its previous value to the new one by writing a motion
// value straight to the DOM — no React re-render per frame, so it stays cheap
// even while the route is committing. MotionConfig's reducedMotion doesn't
// cover imperative animate(), hence the explicit useReducedMotion check.
export default function AnimatedNumber({ value, decimals = 0, format, className }: Props) {
  const reduceMotion = useReducedMotion()
  const mv = useMotionValue(reduceMotion ? value : 0)
  const text = useTransform(mv, (v) => {
    const factor = 10 ** decimals
    const rounded = Math.round(v * factor) / factor
    return format ? format(rounded) : String(rounded)
  })

  useEffect(() => {
    if (reduceMotion) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.9, ease: easeOut })
    return () => controls.stop()
  }, [value, mv, reduceMotion])

  // tabular-nums keeps digit width fixed so surrounding text doesn't shift while rolling
  return <motion.span className={`tabular-nums ${className ?? ""}`}>{text}</motion.span>
}
