"use client"

import { useEffect } from "react"
import { Heart, MessageCircle, Dumbbell, X } from "lucide-react"
import { useNotifications } from "./NotificationProvider"
import type { Toast, NotificationType } from "./NotificationProvider"

function ToastIcon({ type }: { type: NotificationType }) {
  if (type === "like") return <Heart size={16} className="text-pink-400 shrink-0" />
  if (type === "comment") return <MessageCircle size={16} className="text-indigo-400 shrink-0" />
  return <Dumbbell size={16} className="text-green-400 shrink-0" />
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useNotifications()

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, dismissToast])

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 w-72 toast-slide-in">
      <ToastIcon type={toast.type} />
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

export default function ToastContainer() {
  const { toasts } = useNotifications()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
