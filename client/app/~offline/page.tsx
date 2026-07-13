import { WifiOff } from "lucide-react"

// Offline fallback served by the service worker when a page navigation fails
// (see app/sw.ts). Static — no data fetching, no client JS requirements.
export default function OfflinePage() {
  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-6 max-w-sm w-full flex flex-col items-center gap-3 text-center">
        <WifiOff size={28} className="text-gray-400 dark:text-gray-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Du är offline</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ingen internetanslutning just nu. Ett pågående pass finns kvar sparat
          på den här enheten — anslut igen för att fortsätta.
        </p>
      </div>
    </div>
  )
}
