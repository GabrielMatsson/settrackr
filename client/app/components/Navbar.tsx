"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { label: "Hem", href: "/dashboard" },
  { label: "Träning", href: "/dashboard/tracking" },
  { label: "Statistik", href: "/dashboard/statistics" },
  { label: "Profil", href: "/dashboard/profile" },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-8">
      <span className="text-white font-bold text-lg tracking-tight">
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
                : "text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-gray-800"
            }
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
