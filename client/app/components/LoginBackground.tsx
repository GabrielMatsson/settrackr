"use client"

import { motion, useReducedMotion } from "motion/react"
import { easeOut } from "@/lib/motion"

// A stylised "strength progress" line that climbs from lower-left to upper-right,
// echoing the app's stats charts. Purely decorative, sits behind the login card.
const MAIN_LINE = "M0,520 L150,470 L300,500 L450,400 L600,430 L750,300 L900,340 L1050,180 L1200,120"
const MAIN_AREA = `${MAIN_LINE} L1200,600 L0,600 Z`
const FAINT_LINE = "M0,560 L200,520 L400,540 L600,470 L800,420 L1000,320 L1200,250"
const DOTS = [
  [450, 400],
  [750, 300],
  [1050, 180],
] as const

export default function LoginBackground() {
  const reduce = useReducedMotion()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Soft glow for depth behind the card */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] rounded-full bg-indigo-400/15 dark:bg-indigo-500/20 blur-[90px] sm:blur-[120px]" />

      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="loginArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Secondary faint line */}
        <motion.path
          d={FAINT_LINE}
          fill="none"
          className="stroke-indigo-300/50 dark:stroke-indigo-500/25"
          strokeWidth={2}
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: easeOut, delay: 0.1 }}
        />

        {/* Gradient area under the main line */}
        <motion.path
          d={MAIN_AREA}
          fill="url(#loginArea)"
          stroke="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: easeOut, delay: 0.6 }}
        />

        {/* Main climbing line */}
        <motion.path
          d={MAIN_LINE}
          fill="none"
          className="stroke-indigo-500 dark:stroke-indigo-400"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, ease: easeOut }}
        />

        {/* Vertex dots */}
        {DOTS.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={5}
            className="fill-indigo-500 dark:fill-indigo-400"
            initial={{ scale: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1 + i * 0.2, duration: 0.4, ease: easeOut }}
          />
        ))}
      </svg>
    </div>
  )
}
