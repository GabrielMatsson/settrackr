"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { easeOut } from "@/lib/motion"

// Section order matches the navbar tabs: moving right in the nav slides the new
// page in from the right, moving left slides it in from the left.
const sections = [
  "/dashboard",
  "/dashboard/tracking",
  "/dashboard/foodtracking",
  "/dashboard/statistics",
  "/dashboard/profile",
]

function sectionIndex(pathname: string): number {
  for (let i = sections.length - 1; i >= 1; i--) {
    if (pathname.startsWith(sections[i])) return i
  }
  return 0
}

// Module-level so it survives the remount this template does on every route change
let lastSectionIndex: number | null = null

// template.tsx remounts on every route change under /dashboard,
// giving each page a directional entrance without exit-animation complexity
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const index = sectionIndex(pathname)
  // Captured in state so strict-mode double renders keep the same direction
  const [direction] = useState(() => (lastSectionIndex === null ? 0 : Math.sign(index - lastSectionIndex)))

  useEffect(() => {
    lastSectionIndex = index
  }, [index])

  return (
    <motion.div
      initial={direction === 0 ? { opacity: 0, y: 8 } : { opacity: 0, x: direction * 24 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}
