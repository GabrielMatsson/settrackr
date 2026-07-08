"use client"

import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { MotionConfig } from "motion/react"
import ColdStartBanner from "./components/ColdStartBanner"
import { warmUp } from "@/lib/api"

export function Providers({ children }: { children: React.ReactNode }) {
  // Start waking the Render container immediately — the free tier spins down
  // after 15 idle minutes, so the boot overlaps login/rendering instead of
  // stalling the first data fetch
  useEffect(() => {
    warmUp()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MotionConfig reducedMotion="user">
        {children}
        <ColdStartBanner />
      </MotionConfig>
    </ThemeProvider>
  )
}
