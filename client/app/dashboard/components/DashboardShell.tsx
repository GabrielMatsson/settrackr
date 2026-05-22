"use client"

import { NotificationProvider } from "@/app/components/NotificationProvider"
import ToastContainer from "@/app/components/ToastContainer"
import Navbar from "@/app/components/Navbar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-row">
        <Navbar />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 min-w-0 overflow-y-auto">{children}</main>
      </div>
      <ToastContainer />
    </NotificationProvider>
  )
}
