"use client"

import { useState } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react"
import { Sparkles } from "lucide-react"
import { easeOut, gentleSpring } from "@/lib/motion"
import { useHoverCapable } from "@/lib/useHoverCapable"

type Mood = "hungry" | "content" | "full" | "overfull"

const LABELS: Record<Mood, string> = {
  hungry: "Dags att äta?",
  content: "Bra tempo!",
  full: "Mätt och nöjd!",
  overfull: "Oj, det räcker nu…",
}

// How droopy the eyes are per mood (scaleY on each eye)
const EYE_DROOP: Record<Mood, number> = {
  hungry: 0.7,
  content: 1,
  full: 1,
  overfull: 0.45,
}

// Sparkle burst positions when the protein goal is reached
const SPARKS = Array.from({ length: 6 }, (_, i) => {
  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
  return {
    x: Math.round(Math.cos(angle) * 52),
    y: Math.round(Math.sin(angle) * 52),
    size: i % 2 === 0 ? 14 : 10,
    delay: 0.1 + (i % 3) * 0.06,
  }
})

const svgOrigin = { transformBox: "fill-box", transformOrigin: "center" } as const

type Props = {
  kcal: number
  kcalTarget: number
  protein: number
  proteinTarget: number
  compact?: boolean
}

// "Rive-inspired" state-driven mascot for the food diary: a hand-drawn SVG
// avocado whose mood follows today's kcal progress, with an always-on idle
// loop (breathing + blinking), tap-to-jump, and a subtle 3D pointer tilt on
// hover devices. Transform/opacity only — no layout work per frame.
export default function KostMascot({ kcal, kcalTarget, protein, proteinTarget, compact = false }: Props) {
  const kcalPct = kcalTarget > 0 ? (kcal / kcalTarget) * 100 : 0
  const mood: Mood = kcalPct < 30 ? "hungry" : kcalPct <= 85 ? "content" : kcalPct <= 110 ? "full" : "overfull"
  const proteinDone = proteinTarget > 0 && protein >= proteinTarget

  // Remounting the jump wrapper replays the keyframes; restarting the idle
  // loops with it is imperceptible
  const [jumpCount, setJumpCount] = useState(0)
  // Slightly off-beat vs the 3s breathing loop so the idle never looks metronomic
  const blinkDelay = 3.4

  // 3D tilt toward the pointer — hover devices only
  const hoverable = useHoverCapable()
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 })
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    rotateY.set(((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 12)
    rotateX.set(((e.clientY - (rect.top + rect.height / 2)) / rect.height) * -12)
  }

  function resetTilt() {
    rotateX.set(0)
    rotateY.set(0)
  }

  const mouthProps = {
    fill: "none",
    stroke: "#1f2937",
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
  }

  const figure = (
    <motion.div
      className="relative cursor-pointer select-none"
      style={hoverable && !compact ? { rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 800 } : undefined}
      onMouseMove={hoverable && !compact ? handleMouseMove : undefined}
      onMouseLeave={hoverable && !compact ? resetTilt : undefined}
      onClick={() => setJumpCount((c) => c + 1)}
      role="img"
      aria-label={`Maskot: ${LABELS[mood]}`}
    >
      <motion.div
        key={jumpCount}
        animate={jumpCount > 0 ? { y: [0, -14, 0], scaleY: [1, 1.06, 0.94, 1] } : undefined}
        transition={{ duration: 0.5, ease: easeOut }}
        style={{ originY: 1 }}
      >
        <svg viewBox="0 0 120 130" className={compact ? "w-20 h-auto" : "w-36 h-auto mx-auto"} aria-hidden="true">
          {/* ground shadow */}
          <motion.ellipse
            cx="60" cy="122" rx="28" ry="5"
            className="fill-gray-900/10 dark:fill-black/40"
            animate={{ scaleX: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={svgOrigin}
          />

          {/* body group — breathing from the base */}
          <motion.g
            animate={{ scaleY: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
          >
            {/* skin */}
            <path
              d="M60 12 C44 12 36 28 34 46 C31 70 40 114 60 114 C80 114 89 70 86 46 C84 28 76 12 60 12 Z"
              fill="#059669"
            />
            {/* flesh */}
            <path
              d="M60 19 C47 19 40 32 38 48 C35.5 69 44 107 60 107 C76 107 84.5 69 82 48 C80 32 73 19 60 19 Z"
              fill="#d1fae5"
            />

            {/* pit — swells when full */}
            <motion.g
              animate={{ scale: mood === "full" || mood === "overfull" ? 1.12 : 1 }}
              transition={gentleSpring}
              style={svgOrigin}
            >
              <circle cx="60" cy="86" r="15" fill="#b45309" />
              <circle cx="55" cy="81" r="4.5" fill="#d97706" opacity="0.7" />
            </motion.g>

            {/* eyes — parent blinks, each eye droops per mood */}
            <motion.g
              animate={{ scaleY: [1, 1, 0.1, 1] }}
              transition={{ duration: 3.6, times: [0, 0.92, 0.96, 1], repeat: Infinity, repeatDelay: blinkDelay }}
              style={svgOrigin}
            >
              <motion.circle cx="49" cy="50" r="3.5" fill="#1f2937" animate={{ scaleY: EYE_DROOP[mood] }} transition={{ duration: 0.25 }} style={svgOrigin} />
              <motion.circle cx="71" cy="50" r="3.5" fill="#1f2937" animate={{ scaleY: EYE_DROOP[mood] }} transition={{ duration: 0.25 }} style={svgOrigin} />
            </motion.g>

            {/* mouths — one per mood, crossfaded */}
            <motion.path d="M50 66 Q60 60 70 66" {...mouthProps} animate={{ opacity: mood === "hungry" ? 1 : 0 }} transition={{ duration: 0.2 }} />
            <motion.path d="M50 62 Q60 70 70 62" {...mouthProps} animate={{ opacity: mood === "content" ? 1 : 0 }} transition={{ duration: 0.2 }} />
            <motion.path d="M48 60 Q60 76 72 60 Q60 67 48 60 Z" fill="#1f2937" stroke="none" animate={{ opacity: mood === "full" ? 1 : 0 }} transition={{ duration: 0.2 }} />
            <motion.path d="M50 64 q5 -4 10 0 q5 4 10 0" {...mouthProps} animate={{ opacity: mood === "overfull" ? 1 : 0 }} transition={{ duration: 0.2 }} />
          </motion.g>
        </svg>
      </motion.div>

      {/* one-shot sparkle burst when the protein goal is reached */}
      {proteinDone && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          {SPARKS.map(({ x, y, size, delay }, i) => (
            <motion.span
              key={i}
              className="absolute text-emerald-500 dark:text-emerald-400"
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x, y, scale: [0, 1, 0.85], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, delay, ease: easeOut }}
            >
              <Sparkles size={size} />
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  )

  const label = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={mood}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className={`text-gray-500 dark:text-gray-400 ${compact ? "text-sm" : "text-sm text-center"}`}
      >
        {LABELS[mood]}
      </motion.p>
    </AnimatePresence>
  )

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-4 flex items-center gap-4">
        {figure}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-gray-900 dark:text-white font-semibold text-sm">Avo</p>
          {label}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col items-center gap-3">
      <p className="text-gray-900 dark:text-white font-semibold text-sm self-start">Avo</p>
      {figure}
      {label}
    </div>
  )
}
