"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2, Copy, Coffee, Utensils, UtensilsCrossed, Cookie } from "lucide-react"
import { accordionSpring } from "@/lib/motion"
import { calcMacros, sumMacros, mealAccent, todayStr, type Meal, type MealAccentKey } from "@/lib/food-utils"

const ACCENTS: Record<MealAccentKey, { border: string; chip: string; icon: typeof Coffee }> = {
  amber:   { border: "border-l-amber-400",   chip: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",       icon: Coffee },
  emerald: { border: "border-l-emerald-500", chip: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400", icon: Utensils },
  teal:    { border: "border-l-teal-500",    chip: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",           icon: UtensilsCrossed },
  orange:  { border: "border-l-orange-400",  chip: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",   icon: Cookie },
}

type Props = {
  meal: Meal
  index: number
  onEdit: () => void
  onCopy: () => void
  onMove: (delta: number) => void
  onDelete: () => void
}

export default function MealCard({ meal, index, onEdit, onCopy, onMove, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const accent = ACCENTS[mealAccent(meal.title, index)]
  const totals = sumMacros(meal.items)
  const Icon = accent.icon
  const canMoveForward = meal.date < todayStr()

  return (
    <div className={`bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 border-l-4 ${accent.border} rounded-2xl shadow-card overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent.chip}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{meal.title}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
            {meal.items.length} livsmedel · {totals.kcal} kcal · {totals.protein} g protein
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={accordionSpring}
          className="overflow-hidden border-t border-emerald-50 dark:border-emerald-900/30">
          <div className="divide-y divide-emerald-50 dark:divide-emerald-900/30">
            {meal.items.map((item) => {
              const m = calcMacros(item)
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    {item.brand && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.brand}</p>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {item.grams} g · {m.kcal} kcal · {m.protein} g protein
                  </p>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totals.carbs} g kolhydrater · {totals.fat} g fett
            </p>
            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setConfirmDelete(false); onDelete() }}
                  className="text-xs px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Ta bort
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Avbryt
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 mr-0.5">Flytta</span>
                <button
                  onClick={() => onMove(-1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors"
                  aria-label="Flytta till föregående dag"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => onMove(1)}
                  disabled={!canMoveForward}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                  aria-label="Flytta till nästa dag"
                >
                  <ChevronRight size={15} />
                </button>
                <span className="w-px h-4 bg-emerald-200/70 dark:bg-emerald-800 mx-1" />
                <button
                  onClick={onCopy}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors"
                  aria-label="Kopiera måltid"
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors"
                  aria-label="Redigera måltid"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="Ta bort måltid"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
