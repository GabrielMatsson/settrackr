"use client"

import { motion } from "motion/react"
import { pressSpring } from "@/lib/motion"

type Props = React.ComponentProps<typeof motion.button>

// Standard press feedback for primary/secondary buttons — spring squish on tap.
// Tiny icon-only buttons keep plain <button>; this is for real CTAs.
export default function PressableButton({ children, ...props }: Props) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} transition={pressSpring} {...props}>
      {children}
    </motion.button>
  )
}
