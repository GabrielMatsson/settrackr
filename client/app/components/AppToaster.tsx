"use client"

import { Toaster } from "sonner"
import { useTheme } from "next-themes"

// App-wide toast host (Sonner). Swipe-to-dismiss + stacking come for free.
// Top-center so it never collides with the mobile bottom tab bar, and offset
// past the notch/status bar on installed iOS. Theme is synced to next-themes.
export default function AppToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      toastOptions={{ style: { borderRadius: "0.9rem" } }}
    />
  )
}
