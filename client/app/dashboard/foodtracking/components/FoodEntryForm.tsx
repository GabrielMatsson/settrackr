"use client"

import { useState, useRef, useEffect } from "react"
import { calcMacros, type OFFProduct, type FoodItemInput } from "@/lib/food-utils"

const inputClass =
  "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"

type Props = {
  mode: "confirm" | "manual"
  product?: OFFProduct | null
  barcode?: string | null
  notice?: string | null
  initial?: FoodItemInput
  submitLabel?: string
  onAdd: (entry: {
    name: string
    brand: string | null
    barcode: string | null
    grams: number
    kcal_100g: number
    protein_100g: number
    carbs_100g: number
    fat_100g: number
  }) => void
  onCancel: () => void
}

export default function FoodEntryForm({ mode, product, barcode, notice, initial, submitLabel, onAdd, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? product?.name ?? "")
  const [grams, setGrams] = useState(initial?.grams ?? 100)
  const [kcal100, setKcal100] = useState(initial?.kcal_100g ?? product?.kcal_100g ?? 0)
  const [protein100, setProtein100] = useState(initial?.protein_100g ?? product?.protein_100g ?? 0)
  const [carbs100, setCarbs100] = useState(initial?.carbs_100g ?? product?.carbs_100g ?? 0)
  const [fat100, setFat100] = useState(initial?.fat_100g ?? product?.fat_100g ?? 0)
  const gramsRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    gramsRef.current?.focus()
    gramsRef.current?.select()
  }, [])

  const macros = calcMacros({ grams, kcal_100g: kcal100, protein_100g: protein100, carbs_100g: carbs100, fat_100g: fat100 })
  const valid = name.trim().length > 0 && grams > 0

  function handleAdd() {
    if (!valid) return
    onAdd({
      name: name.trim(),
      brand: initial?.brand ?? product?.brand ?? null,
      barcode: initial?.barcode ?? barcode ?? null,
      grams,
      kcal_100g: kcal100,
      protein_100g: protein100,
      carbs_100g: carbs100,
      fat_100g: fat100,
    })
  }

  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4 flex flex-col gap-4">
      {notice && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          <p className="text-sm text-amber-800 dark:text-amber-300">{notice}</p>
        </div>
      )}

      {mode === "confirm" && !initial ? (
        <div>
          <p className="text-gray-900 dark:text-white font-semibold">{product?.name}</p>
          {product?.brand && <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{product.brand}</p>}
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Per 100 g: {kcal100} kcal · {protein100} g protein · {carbs100} g kolhydrater · {fat100} g fett
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Namn</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Jasminris"
              className={`${inputClass} w-full`}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-gray-700 dark:text-gray-300 text-xs font-medium">Kcal per 100 g</label>
              <input type="number" min={0} value={kcal100 || ""} placeholder="0" onChange={(e) => setKcal100(Number(e.target.value))} className={`${inputClass} w-full`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-700 dark:text-gray-300 text-xs font-medium">Protein per 100 g</label>
              <input type="number" min={0} value={protein100 || ""} placeholder="0" onChange={(e) => setProtein100(Number(e.target.value))} className={`${inputClass} w-full`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-700 dark:text-gray-300 text-xs font-medium">Kolhydrater per 100 g</label>
              <input type="number" min={0} value={carbs100 || ""} placeholder="0" onChange={(e) => setCarbs100(Number(e.target.value))} className={`${inputClass} w-full`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-700 dark:text-gray-300 text-xs font-medium">Fett per 100 g</label>
              <input type="number" min={0} value={fat100 || ""} placeholder="0" onChange={(e) => setFat100(Number(e.target.value))} className={`${inputClass} w-full`} />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Mängd (g)</label>
        <input
          ref={gramsRef}
          type="number"
          min={1}
          value={grams || ""}
          placeholder="100"
          onChange={(e) => setGrams(Number(e.target.value))}
          className={`${inputClass} w-24`}
        />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-semibold text-gray-900 dark:text-white">{macros.kcal} kcal</span>
        {" · "}{macros.protein} g protein · {macros.carbs} g kolhydrater · {macros.fat} g fett
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={!valid}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          {submitLabel ?? "Lägg till i måltiden"}
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 text-sm"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
