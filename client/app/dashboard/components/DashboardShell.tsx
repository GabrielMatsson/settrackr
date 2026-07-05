"use client"

import { usePathname } from "next/navigation"
import { NotificationProvider } from "@/app/components/NotificationProvider"
import ToastContainer from "@/app/components/ToastContainer"
import Navbar from "@/app/components/Navbar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFood = pathname.startsWith("/dashboard/foodtracking")
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-row">
        <Navbar />
        <main
          className={`flex-1 p-4 lg:p-8 min-w-0 overflow-y-auto ${
            isFood
              ? "bg-gradient-to-b from-emerald-50 via-lime-50/50 to-emerald-50/30 dark:from-emerald-950/40 dark:via-gray-950 dark:to-gray-950"
              : ""
          }`}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
        >
          {children}
        </main>
      </div>
      <ToastContainer />
    </NotificationProvider>
  )
}
