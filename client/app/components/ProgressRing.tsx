"use client"

import { motion } from "motion/react"
import { gentleSpring } from "@/lib/motion"
import AnimatedNumber from "./AnimatedNumber"

type Props = {
  value: number
  target: number
  label: string
  centerText?: React.ReactNode
  color?: string
}

export default function ProgressRing({ value, target, label, centerText, color = "#6366f1" }: Props) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const percent = target > 0 ? Math.min(value / target, 1) : 0
  const offset = circumference * (1 - percent)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="8" />
          <motion.circle
            cx="35" cy="35" r={radius}
            fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={gentleSpring}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-900 dark:text-white font-semibold text-xs">
            {centerText ?? (
              <>
                <AnimatedNumber value={value} />/{target}
              </>
            )}
          </span>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-xs">{label}</p>
    </div>
  )
}
