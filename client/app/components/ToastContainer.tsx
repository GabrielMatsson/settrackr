"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Dumbbell, X } from "lucide-react"
import { snappySpring } from "@/lib/motion"
import { useNotifications } from "./NotificationProvider"
import type { Toast } from "./NotificationProvider"

function ToastIcon() {
  return <Dumbbell size={16} className="text-green-400 shrink-0" />
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useNotifications()

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, dismissToast])

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 w-72">
      <ToastIcon />
      <span className="text-gray-900 dark:text-white text-sm flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => dismissToast(toast.id)}
        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
        aria-label="Stäng"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// TEMP: notifications hidden — re-enable when they become meaningful again (e.g. push notifications)
const SHOW_NOTIFICATIONS = false

export default function ToastContainer() {
  const { toasts } = useNotifications()

  if (!SHOW_NOTIFICATIONS) return null

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {/* layout makes remaining toasts glide up when one exits */}
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={snappySpring}
          >
            <ToastItem toast={toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
