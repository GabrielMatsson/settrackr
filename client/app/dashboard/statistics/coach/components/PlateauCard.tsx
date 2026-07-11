"use client"

import { TrendingUp, AlertTriangle } from "lucide-react"
import { CoachPlateau } from "@/lib/api"

export default function PlateauCard({ plateaus }: { plateaus: CoachPlateau[] }) {
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-500 dark:text-amber-400 shrink-0" />
        <p className="text-gray-900 dark:text-white font-semibold">Platåer</p>
      </div>

      {plateaus.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <TrendingUp size={16} className="text-green-500 dark:text-green-400 shrink-0" />
          <span>Inga platåer just nu – dina lyft rör sig framåt. Fortsätt så!</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {plateaus.map((p) => (
            <li
              key={p.exercise}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-gray-900 dark:text-white font-medium">{p.exercise}</span>
                <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-full px-2 py-0.5 ring-1 ring-inset ring-amber-600/20">
                  {p.days_since_pr} dagar utan rekord
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{p.suggestion}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                Senast: {p.last_weight % 1 === 0 ? p.last_weight : p.last_weight.toFixed(1)} kg × {p.last_reps} · beräknad 1RM {p.best_e1rm % 1 === 0 ? p.best_e1rm : p.best_e1rm.toFixed(1)} kg
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
