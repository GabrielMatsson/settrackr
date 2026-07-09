"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { easeOut } from "@/lib/motion"

const TAGLINES = [
  "Håll koll på din träning",
  "Slå dina rekord",
  "Bygg din styrka",
  "En rep i taget",
  "Se dina framsteg växa",
]

export default function LoginHero() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % TAGLINES.length), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
          SetTrackr
        </h1>
        <motion.div
          className="h-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 mt-1.5"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 56, opacity: 1 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.3 }}
        />
      </div>

      <div className="relative h-5 w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            className="text-gray-500 dark:text-gray-400 text-sm absolute inset-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: easeOut }}
          >
            {TAGLINES[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
