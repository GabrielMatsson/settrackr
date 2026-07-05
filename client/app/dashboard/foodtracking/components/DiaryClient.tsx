"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { getMeals, createMeal, updateMeal, deleteMeal, getMe } from "@/lib/api"
import { sumMealsMacros, mealItemsToInputs, todayStr, shiftDate, formatDateLabel, type Meal, type FoodItemInput } from "@/lib/food-utils"
import ProgressRing from "@/app/components/ProgressRing"
import MealBuilder from "./MealBuilder"
import MealCard from "./MealCard"

type BuilderState = null | { mode: "create" } | { mode: "edit"; meal: Meal }

export default function DiaryClient() {
  const [date, setDate] = useState(todayStr())
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kcalTarget, setKcalTarget] = useState(2200)
  const [proteinTarget, setProteinTarget] = useState(150)
  const [builder, setBuilder] = useState<BuilderState>(null)

  useEffect(() => {
    getMe()
      .then((p) => {
        setKcalTarget(p.kcal_target ?? 2200)
        setProteinTarget(p.protein_target ?? 150)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    getMeals(date)
      .then((data) => {
        setMeals(data as Meal[])
        setLoading(false)
      })
      .catch(() => {
        setError("Kunde inte hämta kostdata")
        setLoading(false)
      })
  }, [date])

  const totals = sumMealsMacros(meals)
  const isToday = date === todayStr()

  async function handleSave(data: { title: string; items: FoodItemInput[] }) {
    try {
      if (builder?.mode === "edit") {
        const updated = await updateMeal(builder.meal.id, { date: builder.meal.date, ...data })
        setMeals((prev) => prev.map((m) => (m.id === builder.meal.id ? (updated as Meal) : m)))
      } else {
        const created = await createMeal({ date, ...data })
        setMeals((prev) => [...prev, created as Meal])
      }
      setBuilder(null)
    } catch {
      setError("Kunde inte spara måltiden")
    }
  }

  async function handleCopy(meal: Meal) {
    try {
      const created = await createMeal({ date, title: meal.title, items: mealItemsToInputs(meal) })
      setMeals((prev) => [...prev, created as Meal])
    } catch {
      setError("Kunde inte kopiera måltiden")
    }
  }

  async function handleMove(meal: Meal, delta: number) {
    try {
      const newDate = shiftDate(meal.date, delta)
      await updateMeal(meal.id, { date: newDate, title: meal.title, items: mealItemsToInputs(meal) })
      setDate(newDate)
    } catch {
      setError("Kunde inte flytta måltiden")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMeal(id)
      setMeals((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setError("Kunde inte ta bort måltiden")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors"
            aria-label="Föregående dag"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[90px] text-center">
            {formatDateLabel(date)}
          </span>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Nästa dag"
          >
            <ChevronRight size={18} />
          </button>
          {!isToday && (
            <button
              onClick={() => setDate(todayStr())}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium px-2 py-1 transition-colors"
            >
              Idag
            </button>
          )}
        </div>

        {!builder && (
          <button
            onClick={() => setBuilder({ mode: "create" })}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-md shadow-emerald-500/20"
          >
            <Plus size={16} />
            Ny måltid
          </button>
        )}
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

      <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5 flex items-center justify-around gap-4 flex-wrap">
        <ProgressRing
          value={totals.kcal}
          target={kcalTarget}
          label="Kalorier"
          centerText={`${Math.round((totals.kcal / kcalTarget) * 100)}%`}
          color="#10b981"
        />
        <ProgressRing
          value={totals.protein}
          target={proteinTarget}
          label="Protein"
          centerText={`${Math.round((totals.protein / proteinTarget) * 100)}%`}
          color="#84cc16"
        />
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-gray-900 dark:text-white font-semibold">{totals.kcal} / {kcalTarget} kcal</p>
          <p className="text-gray-500 dark:text-gray-400">{totals.protein} / {proteinTarget} g protein</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{totals.carbs} g kolhydrater · {totals.fat} g fett</p>
        </div>
      </div>

      {builder && (
        <MealBuilder
          initial={builder.mode === "edit" ? builder.meal : undefined}
          onSave={handleSave}
          onCancel={() => setBuilder(null)}
        />
      )}

      {loading ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Laddar…</p>
      ) : meals.length === 0 && !builder ? (
        <div className="bg-white/60 dark:bg-gray-900/60 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isToday ? "Inga måltider loggade idag ännu." : "Inga måltider loggade den här dagen."}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Tryck på Ny måltid för att komma igång.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map((meal, i) => (
            <MealCard
              key={meal.id}
              meal={meal}
              index={i}
              onEdit={() => setBuilder({ mode: "edit", meal })}
              onCopy={() => handleCopy(meal)}
              onMove={(delta) => handleMove(meal, delta)}
              onDelete={() => handleDelete(meal.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
