"use client"

import { motion } from "motion/react"
import { easeOut } from "@/lib/motion"

type Props = {
  size?: number
  className?: string
}

// Draw-on save confirmation: the circle sweeps in, then the check strokes.
// Color comes from currentColor so callers set it with a text-* class.
export default function SuccessCheck({ size = 18, className }: Props) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      initial="hidden"
      animate="visible"
      aria-hidden="true"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 0.35, ease: easeOut } },
        }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 0.3, delay: 0.2, ease: easeOut } },
        }}
      />
    </motion.svg>
  )
}
