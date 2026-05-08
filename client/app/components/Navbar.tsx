"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

const links = [
  { label: "Hem", href: "/dashboard" },
  { label: "Träning", href: "/dashboard/tracking" },
  { label: "Statistik", href: "/dashboard/statistics" },
  { label: "Profil", href: "/dashboard/profile" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Växla tema"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>
    </nav>
  )
}
