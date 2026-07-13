"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight, Plus, Star } from "lucide-react"
import { getMeals, createMeal, updateMeal, deleteMeal, getMe, getWeightLogs, logWeight, deleteWeightLog, getFavoriteMeals, createFavoriteMeal, deleteFavoriteMeal, type GoalMode, type WeightEntry, type FavoriteMeal } from "@/lib/api"
import { sumMealsMacros, mealItemsToInputs, mealSignature, todayStr, shiftDate, formatDateLabel, type Meal, type FoodItemInput } from "@/lib/food-utils"
import { goalDirection, kcalRingColor } from "@/lib/weight-utils"
import ProgressRing from "@/app/components/ProgressRing"
import AnimatedNumber from "@/app/components/AnimatedNumber"
import PressableButton from "@/app/components/PressableButton"
import { easeOut, fadeUp, fadeUpTransition } from "@/lib/motion"
import MealBuilder from "./MealBuilder"
import MealCard from "./MealCard"
import KostMascot from "./KostMascot"
import WeightCard from "./WeightCard"
import FavoritesPanel from "./FavoritesPanel"

type BuilderState = null | { mode: "create" } | { mode: "edit"; meal: Meal }

export default function DiaryClient() {
  const [date, setDate] = useState(todayStr())
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kcalTarget, setKcalTarget] = useState(2200)
  const [proteinTarget, setProteinTarget] = useState(150)
  const [showFoodMascot, setShowFoodMascot] = useState(false)
  const [builder, setBuilder] = useState<BuilderState>(null)
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [showWeightTracking, setShowWeightTracking] = useState(false)
  const [goalMode, setGoalMode] = useState<GoalMode | null>(null)
  const [targetWeight, setTargetWeight] = useState<number | null>(null)
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])

  useEffect(() => {
    getMe()
      .then((p) => {
        setKcalTarget(p.kcal_target ?? 2200)
        setProteinTarget(p.protein_target ?? 150)
        setShowFoodMascot(p.show_food_mascot ?? false)
        setGoalMode(p.goal_mode ?? null)
        setTargetWeight(p.target_weight ?? null)
        const weightOn = p.show_weight_tracking !== false
        setShowWeightTracking(weightOn)
        if (weightOn) {
          getWeightLogs().then(setWeightEntries).catch(() => {})
        }
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

  useEffect(() => {
    getFavoriteMeals().then(setFavorites).catch(() => {})
  }, [])

  // signature -> favorite id, so each meal card knows if it's already a favorite
  const favoriteIdBySignature = useMemo(() => {
    const map = new Map<string, number>()
    for (const f of favorites) map.set(mealSignature(f.title, f.items), f.id)
    return map
  }, [favorites])

  const totals = sumMealsMacros(meals)
  const isToday = date === todayStr()

  // Ring color follows the goal mode (deff/maintain/bulk); without a mode the
  // ring keeps the neutral Kost emerald.
  const direction = goalDirection(goalMode)
  const kcalPct = kcalTarget > 0 ? (totals.kcal / kcalTarget) * 100 : 0
  const ringColor = direction === "none" ? "#10b981" : kcalRingColor(kcalPct, direction)

  async function handleLogWeight(weightKg: number) {
    const saved = await logWeight({ date, weight_kg: weightKg })
    setWeightEntries((prev) => {
      const rest = prev.filter((e) => e.date !== saved.date)
      return [...rest, saved].sort((a, b) => b.date.localeCompare(a.date))
    })
  }

  async function handleDeleteWeight(id: number) {
    await deleteWeightLog(id)
    setWeightEntries((prev) => prev.filter((e) => e.id !== id))
  }

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

  async function handleToggleFavorite(meal: Meal) {
    const sig = mealSignature(meal.title, meal.items)
    const existingId = favoriteIdBySignature.get(sig)
    try {
      if (existingId !== undefined) {
        await deleteFavoriteMeal(existingId)
        setFavorites((prev) => prev.filter((f) => f.id !== existingId))
      } else {
        const created = await createFavoriteMeal({ title: meal.title, items: mealItemsToInputs(meal) })
        setFavorites((prev) => [created as FavoriteMeal, ...prev])
      }
    } catch {
      setError("Kunde inte uppdatera favoriter")
    }
  }

  async function handleLogFavorite(fav: FavoriteMeal) {
    try {
      const created = await createMeal({ date, title: fav.title, items: fav.items })
      setMeals((prev) => [...prev, created as Meal])
      setShowFavorites(false)
    } catch {
      setError("Kunde inte logga favoriten")
    }
  }

  async function handleDeleteFavorite(id: number) {
    try {
      await deleteFavoriteMeal(id)
      setFavorites((prev) => prev.filter((f) => f.id !== id))
    } catch {
      setError("Kunde inte ta bort favoriten")
    }
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-5 lg:items-start">
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="group p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors"
            aria-label="Föregående dag"
          >
            <ChevronLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[90px] text-center">
            {formatDateLabel(date)}
          </span>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            className="group p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Nästa dag"
          >
            <ChevronRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
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
          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <PressableButton
                onClick={() => setShowFavorites((v) => !v)}
                className={`group border font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  showFavorites
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    : "border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                }`}
              >
                <Star size={15} className={showFavorites ? "fill-amber-400" : "transition-transform duration-200 group-hover:scale-110"} />
                Favoriter
              </PressableButton>
            )}
            <PressableButton
              onClick={() => setBuilder({ mode: "create" })}
              className="group bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-md shadow-emerald-500/20"
            >
              <Plus size={16} className="transition-transform duration-200 group-hover:rotate-90" />
              Ny måltid
            </PressableButton>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

      <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex items-center justify-around gap-4 flex-wrap">
        <ProgressRing
          value={totals.kcal}
          target={kcalTarget}
          label="Kalorier"
          centerText={<><AnimatedNumber value={Math.round((totals.kcal / kcalTarget) * 100)} />%</>}
          color={ringColor}
        />
        <ProgressRing
          value={totals.protein}
          target={proteinTarget}
          label="Protein"
          centerText={<><AnimatedNumber value={Math.round((totals.protein / proteinTarget) * 100)} />%</>}
          color="#84cc16"
        />
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-gray-900 dark:text-white font-semibold"><AnimatedNumber value={totals.kcal} /> / {kcalTarget} kcal</p>
          <p className="text-gray-500 dark:text-gray-400"><AnimatedNumber value={totals.protein} decimals={1} /> / {proteinTarget} g protein</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{totals.carbs} g kolhydrater · {totals.fat} g fett</p>
        </div>
      </div>

      {showFoodMascot && (
        <div className="lg:hidden">
          <KostMascot compact kcal={totals.kcal} kcalTarget={kcalTarget} protein={totals.protein} proteinTarget={proteinTarget} />
        </div>
      )}

      <AnimatePresence>
        {builder && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <MealBuilder
              initial={builder.mode === "edit" ? builder.meal : undefined}
              onSave={handleSave}
              onCancel={() => setBuilder(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFavorites && !builder && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <FavoritesPanel
              favorites={favorites}
              onLog={handleLogFavorite}
              onDelete={handleDeleteFavorite}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
        <div key={date} className="flex flex-col gap-3">
          {meals.map((meal, i) => (
            <motion.div
              key={meal.id}
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              transition={fadeUpTransition(i)}
            >
              <MealCard
                meal={meal}
                index={i}
                isFavorite={favoriteIdBySignature.has(mealSignature(meal.title, meal.items))}
                onEdit={() => setBuilder({ mode: "edit", meal })}
                onCopy={() => handleCopy(meal)}
                onMove={(delta) => handleMove(meal, delta)}
                onDelete={() => handleDelete(meal.id)}
                onToggleFavorite={() => handleToggleFavorite(meal)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {showWeightTracking && (
        <WeightCard
          date={date}
          entries={weightEntries}
          mode={goalMode}
          targetWeight={targetWeight}
          onLog={handleLogWeight}
          onDelete={handleDeleteWeight}
        />
      )}
    </div>

    {showFoodMascot && (
      <div className="hidden lg:block sticky top-8">
        <KostMascot kcal={totals.kcal} kcalTarget={kcalTarget} protein={totals.protein} proteinTarget={proteinTarget} />
      </div>
    )}
    </div>
  )
}
