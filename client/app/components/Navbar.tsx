"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef, useCallback } from "react"
import { Sun, Moon, Bell, Heart, MessageCircle, Dumbbell, X } from "lucide-react"
import { useNotifications } from "./NotificationProvider"
import type { NotificationType } from "./NotificationProvider"

function NotifIcon({ type }: { type: NotificationType }) {
  if (type === "like") return <Heart size={14} className="text-pink-400 shrink-0" />
  if (type === "comment") return <MessageCircle size={14} className="text-indigo-400 shrink-0" />
  return <Dumbbell size={14} className="text-green-400 shrink-0" />
}

const links = [
  { label: "Hem", href: "/dashboard" },
  { label: "Träning", href: "/dashboard/tracking" },
  { label: "Statistik", href: "/dashboard/statistics" },
  { label: "Profil", href: "/dashboard/profile" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { history, unreadCount, clearUnread } = useNotifications()
  const [mounted, setMounted] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setShowPanel(false)
    }
  }, [])

  useEffect(() => {
    if (!showPanel) return
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showPanel, handleClickOutside])

  function togglePanel() {
    if (!showPanel) clearUnread()
    setShowPanel((prev) => !prev)
  }

  return (
    <nav className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-8">
      <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">
        Set<span className="text-indigo-400">Trackr</span>
      </span>

      <div className="flex items-center gap-1 ml-auto">
        {links.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={
              pathname === href
                ? "bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          >
            {label}
          </Link>
        ))}

        {mounted && (
          <>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Växla tema"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div ref={panelRef} className="relative">
              <button
                onClick={togglePanel}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifikationer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white text-sm font-semibold">Notifikationer</span>
                    <button
                      onClick={() => setShowPanel(false)}
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      aria-label="Stäng"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Inga notifikationer än</p>
                    ) : (
                      [...history].reverse().map((n) => (
                        <div key={n.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <NotifIcon type={n.type} />
                          <span className="text-gray-700 dark:text-gray-200 text-sm">{n.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
