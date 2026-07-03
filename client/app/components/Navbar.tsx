"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef, useCallback } from "react"
import { Sun, Moon, Bell, Dumbbell, X, Home, BarChart2, User } from "lucide-react"
import { useNotifications } from "./NotificationProvider"

function NotifIcon() {
  return <Dumbbell size={14} className="text-green-400 shrink-0" />
}

const links = [
  { label: "Hem", href: "/dashboard", icon: Home },
  { label: "Träning", href: "/dashboard/tracking", icon: Dumbbell },
  { label: "Statistik", href: "/dashboard/statistics", icon: BarChart2 },
  { label: "Profil", href: "/dashboard/profile", icon: User },
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

  const notifPanel = (
    <div className="max-h-80 overflow-y-auto">
      {history.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Inga notifikationer än</p>
      ) : (
        [...history].reverse().map((n) => (
          <div key={n.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <NotifIcon />
            <span className="text-gray-700 dark:text-gray-200 text-sm">{n.message}</span>
          </div>
        ))
      )}
    </div>
  )

  return (
    <>
      {/* Sidebar — visible at lg (1024px) and above */}
      <nav className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-56 sticky top-0 h-screen hidden lg:flex flex-col px-4 py-6 shrink-0">
        <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight mb-6">
          Set<span className="text-indigo-400">Trackr</span>
        </span>

        <div className="flex flex-col gap-1 flex-1">
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={
                pathname === href
                  ? "bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full flex items-center gap-3"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 w-full flex items-center gap-3"
              }
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        {mounted && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm w-full"
              aria-label="Växla tema"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === "dark" ? "Ljust läge" : "Mörkt läge"}</span>
            </button>

            <div ref={panelRef} className="relative">
              <button
                onClick={togglePanel}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm w-full"
                aria-label="Notifikationer"
              >
                <Bell size={18} className="shrink-0" />
                <span>Notifikationer</span>
                {unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center leading-none shrink-0">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showPanel && (
                <div className="absolute left-full bottom-0 ml-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
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
                  {notifPanel}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>


      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-stretch justify-around">
        {links.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 flex-1"
          >
            <Icon size={22} className={pathname === href ? "text-indigo-600" : "text-gray-400 dark:text-gray-500"} />
            <span className={`text-[10px] font-medium ${pathname === href ? "text-indigo-600" : "text-gray-400 dark:text-gray-500"}`}>{label}</span>
          </Link>
        ))}

        {mounted && (
          <>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 flex-1 text-gray-400 dark:text-gray-500"
              aria-label="Växla tema"
            >
              {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
              <span className="text-[10px] font-medium">Tema</span>
            </button>

            <div ref={panelRef} className="relative flex-1">
              <button
                onClick={togglePanel}
                className="w-full h-full flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-gray-400 dark:text-gray-500"
                aria-label="Notifikationer"
              >
                <div className="relative">
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-indigo-500 text-white text-[9px] rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">Notiser</span>
              </button>

              {showPanel && (
                <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
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
                  {notifPanel}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
