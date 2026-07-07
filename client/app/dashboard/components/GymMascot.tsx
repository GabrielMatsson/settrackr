"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react"
import { Sparkles } from "lucide-react"
import { easeOut, gentleSpring } from "@/lib/motion"
import { useHoverCapable } from "@/lib/useHoverCapable"

type Mood = "sleepy" | "ready" | "pumped" | "goal"

const LABELS: Record<Mood, string> = {
  sleepy: "Var har du varit?!",
  ready: "Träna. Nu.",
  pumped: "Starkt jobbat idag!",
  goal: "Veckomålet klart!",
}

// Angry when no workout is logged today; happy once you've trained (or hit the goal)
const IS_ANGRY: Record<Mood, boolean> = {
  sleepy: true,
  ready: true,
  pumped: false,
  goal: false,
}

// How droopy the eyes are per mood (scaleY on each eye)
const EYE_DROOP: Record<Mood, number> = {
  sleepy: 0.45,
  ready: 1,
  pumped: 1,
  goal: 1,
}

// Sparkle burst positions when the weekly goal is reached
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

// Pupil travel: clamped to ±2 SVG units so a r=2 pupil stays inside the r=4.5
// eye white; screen-pixel delta is scaled down by PUPIL_GAIN before clamping.
const MAX_PUPIL = 2
const PUPIL_GAIN = 0.02

type Props = {
  weekCount: number
  weeklyGoal: number
  daysSinceLast: number | null
  compact?: boolean
}

// State-driven mascot for the dashboard home: a stoic iron dumbbell whose
// mood follows this week's training, with an always-on idle loop (breathing +
// blinking), tap-to-lift, a subtle 3D pointer tilt, and googly eyes whose
// pupils track the cursor anywhere in the viewport. The body never moves per
// mood — all expression lives in the face. Transform/opacity only.
export default function GymMascot({ weekCount, weeklyGoal, daysSinceLast, compact = false }: Props) {
  const mood: Mood =
    weeklyGoal > 0 && weekCount >= weeklyGoal
      ? "goal"
      : daysSinceLast === 0
        ? "pumped"
        : daysSinceLast !== null && daysSinceLast >= 3
          ? "sleepy"
          : "ready"

  // Remounting the lift wrapper replays the keyframes
  const [jumpCount, setJumpCount] = useState(0)
  // Slightly off-beat vs the 3s breathing loop so the idle never looks metronomic
  const blinkDelay = 3.4

  const hoverable = useHoverCapable()

  // 3D tilt toward the pointer — hover devices only
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 })
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 })

  // Googly eyes — pupils follow the cursor globally (hover devices only)
  const figureRef = useRef<HTMLDivElement>(null)
  const pupilX = useMotionValue(0)
  const pupilY = useMotionValue(0)
  const springPupilX = useSpring(pupilX, { stiffness: 200, damping: 20 })
  const springPupilY = useSpring(pupilY, { stiffness: 200, damping: 20 })

  useEffect(() => {
    if (!hoverable) return
    function onMove(e: MouseEvent) {
      const el = figureRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      const len = Math.hypot(dx, dy) || 1
      const r = Math.min(MAX_PUPIL, len * PUPIL_GAIN)
      pupilX.set((dx / len) * r)
      pupilY.set((dy / len) * r)
    }
    function onLeave() {
      pupilX.set(0)
      pupilY.set(0)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    document.documentElement.addEventListener("mouseleave", onLeave)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.documentElement.removeEventListener("mouseleave", onLeave)
    }
  }, [hoverable, pupilX, pupilY])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    rotateY.set(((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 12)
    rotateX.set(((e.clientY - (rect.top + rect.height / 2)) / rect.height) * -12)
  }

  function resetTilt() {
    rotateX.set(0)
    rotateY.set(0)
  }

  // One eye per weight plate — deadpan googly eyes on a serious piece of iron
  const eye = (cx: number) => (
    <motion.g animate={{ scaleY: EYE_DROOP[mood] }} transition={{ duration: 0.25 }} style={svgOrigin}>
      <circle cx={cx} cy="46" r="5" fill="#ffffff" stroke="#1e293b" strokeWidth="0.75" />
      <motion.g style={{ x: springPupilX, y: springPupilY }}>
        <circle cx={cx} cy="46" r="2.2" fill="#0f172a" />
        <circle cx={cx - 0.7} cy="45.3" r="0.6" fill="#ffffff" />
      </motion.g>
    </motion.g>
  )

  const figure = (
    <motion.div
      ref={figureRef}
      className="relative cursor-pointer select-none shrink-0"
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
        <svg viewBox="0 0 200 120" className={compact ? "w-32 h-auto" : "w-44 h-auto mx-auto"} aria-hidden="true">
          {/* ground shadow */}
          <motion.ellipse
            cx="100" cy="108" rx="64" ry="5"
            className="fill-gray-900/10 dark:fill-black/40"
            animate={{ scaleX: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={svgOrigin}
          />

          {/* body group — breathing from the base */}
          <motion.g
            animate={{ scaleY: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
          >
            {/* bar */}
            <rect x="66" y="54" width="68" height="12" rx="2" fill="#94a3b8" />
            <rect x="66" y="61" width="68" height="5" rx="2" fill="#64748b" />
            {/* knurling */}
            {[72, 76, 80, 120, 124, 128].map((x) => (
              <line key={x} x1={x} y1="56" x2={x} y2="64" stroke="#64748b" strokeWidth="1" opacity="0.5" />
            ))}

            {/* collars */}
            <rect x="58" y="50" width="10" height="20" rx="2" fill="#64748b" />
            <rect x="132" y="50" width="10" height="20" rx="2" fill="#64748b" />

            {/* big plates with highlight + indigo edge */}
            <rect x="38" y="22" width="18" height="76" rx="3" fill="#334155" />
            <rect x="40" y="26" width="3" height="68" rx="1.5" fill="#475569" />
            <rect x="51" y="26" width="3" height="68" rx="1.5" fill="#4f46e5" opacity="0.9" />
            <rect x="144" y="22" width="18" height="76" rx="3" fill="#334155" />
            <rect x="146" y="26" width="3" height="68" rx="1.5" fill="#4f46e5" opacity="0.9" />
            <rect x="157" y="26" width="3" height="68" rx="1.5" fill="#475569" />

            {/* outer plates */}
            <rect x="22" y="32" width="14" height="56" rx="3" fill="#1e293b" />
            <rect x="164" y="32" width="14" height="56" rx="3" fill="#1e293b" />

            {/* end caps */}
            <rect x="10" y="44" width="10" height="32" rx="2" fill="#475569" />
            <rect x="180" y="44" width="10" height="32" rx="2" fill="#475569" />

            {/* brows — scowl (inner ends dip toward the bar) until today's workout is logged */}
            <motion.g animate={{ rotate: IS_ANGRY[mood] ? 0 : -30, y: IS_ANGRY[mood] ? 0 : -2 }} transition={gentleSpring} style={svgOrigin}>
              <line x1="47" y1="36.5" x2="59" y2="40.5" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            </motion.g>
            <motion.g animate={{ rotate: IS_ANGRY[mood] ? 0 : 30, y: IS_ANGRY[mood] ? 0 : -2 }} transition={gentleSpring} style={svgOrigin}>
              <line x1="141" y1="40.5" x2="153" y2="36.5" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            </motion.g>

            {/* eyes — one per weight plate; parent blinks, each droops per mood, pupils follow cursor */}
            <motion.g
              animate={{ scaleY: [1, 1, 0.1, 1] }}
              transition={{ duration: 3.6, times: [0, 0.92, 0.96, 1], repeat: Infinity, repeatDelay: blinkDelay }}
              style={svgOrigin}
            >
              {eye(53)}
              {eye(147)}
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>

      {/* one-shot sparkle burst when the weekly goal is reached */}
      {mood === "goal" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          {SPARKS.map(({ x, y, size, delay }, i) => (
            <motion.span
              key={i}
              className="absolute text-indigo-500 dark:text-indigo-400"
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
        className={`text-sm text-gray-500 dark:text-gray-400 ${compact ? "" : "text-center"}`}
      >
        {LABELS[mood]}
      </motion.p>
    </AnimatePresence>
  )

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-4 flex items-center gap-5">
        {figure}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-gray-900 dark:text-white font-semibold text-sm">Hasse</p>
          {label}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 flex flex-col items-center gap-3">
      <p className="text-gray-900 dark:text-white font-semibold text-sm self-start">Hasse</p>
      {figure}
      {label}
    </div>
  )
}
