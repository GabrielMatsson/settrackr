"use client"

import { NotificationProvider } from "@/app/components/NotificationProvider"
import ToastContainer from "@/app/components/ToastContainer"
import Navbar from "@/app/components/Navbar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        <Navbar />
        <main className="flex-grow p-6">{children}</main>
      </div>
      <ToastContainer />
    </NotificationProvider>
  )
}
