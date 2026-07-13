"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Star, Plus, Trash2 } from "lucide-react"
import { layoutSpring } from "@/lib/motion"
import { sumMacros } from "@/lib/food-utils"
import type { FavoriteMeal } from "@/lib/api"

type Props = {
  favorites: FavoriteMeal[]
  onLog: (fav: FavoriteMeal) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function FavoritesPanel({ favorites, onLog, onDelete }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null)

  async function handleLog(fav: FavoriteMeal) {
    if (busyId !== null) return
    setBusyId(fav.id)
    try {
      await onLog(fav)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Star size={16} className="text-amber-400 fill-amber-400" />
        <p className="text-gray-900 dark:text-white font-semibold">Favoritmåltider</p>
      </div>

      {favorites.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Inga favoriter ännu. Tryck på stjärnan på en måltid för att spara den som favorit.
        </p>
      ) : (
        <div className="divide-y divide-emerald-50 dark:divide-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl overflow-hidden">
          {favorites.map((fav) => {
            const totals = sumMacros(fav.items)
            return (
              <motion.div
                key={fav.id}
                layout
                transition={layoutSpring}
                className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-900"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">{fav.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {fav.items.length} livsmedel · {totals.kcal} kcal · {totals.protein} g protein
                  </p>
                </div>
                <button
                  onClick={() => handleLog(fav)}
                  disabled={busyId !== null}
                  className="group bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={14} className="transition-transform duration-200 group-hover:rotate-90" />
                  {busyId === fav.id ? "Loggar…" : "Logga"}
                </button>
                <button
                  onClick={() => onDelete(fav.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  aria-label={`Ta bort favoriten ${fav.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
