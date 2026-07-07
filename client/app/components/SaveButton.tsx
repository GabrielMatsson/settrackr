"use client"

import { motion, AnimatePresence } from "motion/react"
import { pressSpring } from "@/lib/motion"
import SuccessCheck from "./SuccessCheck"

type Props = {
  status: "idle" | "saving" | "success"
  idleLabel: string
  savingLabel?: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

// Save button whose content morphs label → "Sparar…" → drawn checkmark and
// back, so the confirmation lives inside the button itself. The parent owns
// the status state and flips it back to "idle" after the success moment.
export default function SaveButton({ status, idleLabel, savingLabel = "Sparar…", onClick, disabled, className }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={pressSpring}
      onClick={onClick}
      disabled={disabled || status !== "idle"}
      className={className}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center gap-2"
        >
          {status === "success" ? (
            <SuccessCheck size={16} className="text-white" />
          ) : status === "saving" ? (
            savingLabel
          ) : (
            idleLabel
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
