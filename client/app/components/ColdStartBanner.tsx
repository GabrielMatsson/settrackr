"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Loader2 } from "lucide-react"
import { onColdChange } from "@/lib/api"
import { easeOut } from "@/lib/motion"

// Shows while API requests are slow or retrying — in practice: the Render
// free-tier container is cold-booting (30-60s). Subscribed to api.ts's
// cold-state notifier; renders nothing when everything is responsive.
export default function ColdStartBanner() {
  const [cold, setCold] = useState(false)

  useEffect(() => onColdChange(setCold), [])

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {cold && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <Loader2 size={15} className="animate-spin" />
            Servern vaknar…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
