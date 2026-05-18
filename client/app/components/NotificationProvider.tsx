"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { getApiToken } from "@/lib/api"

const API_URL = "http://localhost:8000"

export type NotificationType = "like" | "comment" | "new_log"

export type Toast = {
  id: number
  type: NotificationType
  message: string
}

type NotificationContextType = {
  toasts: Toast[]
  history: Toast[]
  unreadCount: number
  clearUnread: () => void
  dismissToast: (id: number) => void
}

const NotificationContext = createContext<NotificationContextType>({
  toasts: [],
  history: [],
  unreadCount: 0,
  clearUnread: () => {},
  dismissToast: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

let toastIdCounter = 0

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [history, setHistory] = useState<Toast[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let mounted = true
    let es: EventSource | null = null

    getApiToken().then((token) => {
      if (!mounted) return
      es = new EventSource(`${API_URL}/notifications/stream?token=${token}`)
      es.onmessage = (e) => {
        try {
          const events: { type: NotificationType; message: string }[] = JSON.parse(e.data)
          const newToasts: Toast[] = events.map((ev) => ({
            id: ++toastIdCounter,
            type: ev.type,
            message: ev.message,
          }))
          setToasts((prev) => [...prev, ...newToasts].slice(-3))
          setHistory((prev) => [...prev, ...newToasts].slice(-50))
          setUnreadCount((prev) => prev + newToasts.length)
        } catch {}
      }
      es.onerror = () => { es?.close() }
    })

    return () => { mounted = false; es?.close() }
  }, [])

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function clearUnread() {
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ toasts, history, unreadCount, clearUnread, dismissToast }}>
      {children}
    </NotificationContext.Provider>
  )
}
