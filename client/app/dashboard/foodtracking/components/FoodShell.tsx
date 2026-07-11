"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Salad } from "lucide-react"
import { getMe } from "@/lib/api"

const tabs = [
  { label: "Dagbok", href: "/dashboard/foodtracking" },
  { label: "Statistik", href: "/dashboard/foodtracking/stats" },
  { label: "Coach", href: "/dashboard/foodtracking/coach" },
]

const COACH_HREF = "/dashboard/foodtracking/coach"

export default function FoodShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Both default on; only restrict once we learn a toggle is off (no flash).
  const [foodEnabled, setFoodEnabled] = useState(true)
  const [coachEnabled, setCoachEnabled] = useState(true)

  useEffect(() => {
    getMe()
      .then((p) => {
        setFoodEnabled(p.show_food_tracking !== false)
        setCoachEnabled(p.show_nutrition_coach !== false)
      })
      .catch(() => {})
  }, [])

  const visibleTabs = tabs.filter((t) => coachEnabled || t.href !== COACH_HREF)
  const coachDisabledHere = !coachEnabled && pathname.startsWith(COACH_HREF)

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-5">
      <div className="bg-gradient-to-r from-emerald-600 to-lime-500 dark:from-emerald-700 dark:to-lime-600 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-emerald-500/20">
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Salad size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Kost</h1>
          <p className="text-emerald-50/90 text-sm">Logga måltider och följ dina makros</p>
        </div>
      </div>

      {!foodEnabled ? (
        <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Kostspårning är avstängd.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Slå på den igen under Profil → Inställningar → Funktioner.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 flex-wrap">
            {visibleTabs.map(({ label, href }) => {
              const isActive = href === "/dashboard/foodtracking"
                ? pathname === href
                : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    isActive
                      ? "bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
                  }
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {coachDisabledHere ? (
            <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Kostcoach är avstängd.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Slå på den igen under Profil → Inställningar → Funktioner.</p>
            </div>
          ) : (
            children
          )}
        </>
      )}
    </div>
  )
}
