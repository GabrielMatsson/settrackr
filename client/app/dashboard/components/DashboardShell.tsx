"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { NotificationProvider } from "@/app/components/NotificationProvider"
import ToastContainer from "@/app/components/ToastContainer"
import AppToaster from "@/app/components/AppToaster"
import Navbar from "@/app/components/Navbar"

// --- Pull-to-refresh -------------------------------------------------------
// The dashboard <main> is the scroll container, so the gesture lives here. A
// page opts in by registering a refresh handler via usePageRefresh(); pages
// that don't register simply have no pull gesture (the browser's own rubber-band
// PTR is already disabled in globals.css).

type RefreshCtx = { register: (fn: (() => unknown) | null) => void }
const RefreshContext = createContext<RefreshCtx>({ register: () => {} })

// Pass a memoized handler (useCallback) — it's registered as the page's
// pull-to-refresh action while mounted.
export function usePageRefresh(handler: () => unknown) {
  const { register } = useContext(RefreshContext)
  useEffect(() => {
    register(handler)
    return () => register(null)
  }, [register, handler])
}

const THRESHOLD = 64 // px pulled before a release triggers a refresh

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFood = pathname.startsWith("/dashboard/foodtracking")

  const mainRef = useRef<HTMLElement>(null)
  const handlerRef = useRef<(() => unknown) | null>(null)
  const register = useCallback((fn: (() => unknown) | null) => {
    handlerRef.current = fn
  }, [])

  const startY = useRef(0)
  const pulling = useRef(false)
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing || !handlerRef.current) return
    const el = mainRef.current
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      pulling.current = true
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!pulling.current || refreshing) return
    const el = mainRef.current
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0 || (el && el.scrollTop > 0)) {
      pulling.current = false
      setDragging(false)
      setPull(0)
      return
    }
    // Rubber-band resistance — the further you pull, the slower it moves.
    if (!dragging) setDragging(true)
    setPull(Math.min(dy * 0.5, 90))
  }

  function onTouchEnd() {
    if (!pulling.current) return
    pulling.current = false
    setDragging(false)
    if (pull >= THRESHOLD && handlerRef.current) {
      setRefreshing(true)
      setPull(THRESHOLD)
      Promise.resolve(handlerRef.current()).finally(() => {
        setRefreshing(false)
        setPull(0)
      })
    } else {
      setPull(0)
    }
  }

  const active = pull > 0 || refreshing

  return (
    <NotificationProvider>
      <RefreshContext.Provider value={{ register }}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-row">
          <Navbar />
          <main
            ref={mainRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`relative flex-1 p-4 lg:p-8 min-w-0 overflow-y-auto ${
              isFood
                ? "bg-gradient-to-b from-emerald-50 via-lime-50/50 to-emerald-50/30 dark:from-emerald-950/40 dark:via-gray-950 dark:to-gray-950"
                : ""
            }`}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
          >
            {/* Pull-to-refresh indicator — slides in from the top edge */}
            <div
              className="pointer-events-none absolute left-1/2 top-2 z-30 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white text-indigo-500 shadow-md dark:bg-gray-900"
              style={{
                transform: `translate(-50%, ${active ? pull - 4 : -48}px)`,
                opacity: active ? Math.min(pull / THRESHOLD, 1) : 0,
                transition: dragging ? "none" : "transform 0.25s, opacity 0.25s",
              }}
            >
              <Loader2
                size={18}
                className={refreshing ? "animate-spin" : ""}
                style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}
              />
            </div>
            {children}
          </main>
        </div>
        <ToastContainer />
        <AppToaster />
      </RefreshContext.Provider>
    </NotificationProvider>
  )
}
