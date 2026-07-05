"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Salad } from "lucide-react"

const tabs = [
  { label: "Dagbok", href: "/dashboard/foodtracking" },
  { label: "Statistik", href: "/dashboard/foodtracking/stats" },
]

export default function FoodShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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

      <div className="flex gap-1 flex-wrap">
        {tabs.map(({ label, href }) => {
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

      {children}
    </div>
  )
}
