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
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex gap-6">
      {links.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? "text-white font-medium" : "text-gray-400 hover:text-white"}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
