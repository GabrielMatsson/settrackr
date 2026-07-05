"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { ScanBarcode, Plus, X, Pencil } from "lucide-react"
import { calcMacros, sumMacros, lookupBarcode, mealItemsToInputs, type Meal, type FoodItemInput, type OFFProduct } from "@/lib/food-utils"
import FoodEntryForm from "./FoodEntryForm"

const BarcodeScanner = dynamic(() => import("./BarcodeScanner"), { ssr: false })

const QUICK_TITLES = ["Frukost", "Lunch", "Middag", "Mellanmål"]

type FormState = {
  mode: "confirm" | "manual"
  product: OFFProduct | null
  barcode: string | null
  notice: string | null
  editIndex?: number
  initialItem?: FoodItemInput
}

type Props = {
  initial?: Meal
  onSave: (data: { title: string; items: FoodItemInput[] }) => Promise<void>
  onCancel: () => void
}

export default function MealBuilder({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [items, setItems] = useState<FoodItemInput[]>(initial ? mealItemsToInputs(initial) : [])
  const [itemForm, setItemForm] = useState<FormState | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [saving, setSaving] = useState(false)

  const totals = sumMacros(items)
  const valid = title.trim().length > 0 && items.length > 0

  async function handleDetected(ean: string) {
    setShowScanner(false)
    setLookingUp(true)
    try {
      const product = await lookupBarcode(ean)
      const complete =
        product?.name &&
        product.kcal_100g !== undefined &&
        product.protein_100g !== undefined &&
        product.carbs_100g !== undefined &&
        product.fat_100g !== undefined
      if (complete) {
        setItemForm({ mode: "confirm", product, barcode: ean, notice: null })
      } else {
        setItemForm({
          mode: "manual",
          product,
          barcode: ean,
          notice: product
            ? "Produkten saknar näringsvärden i Open Food Facts — fyll i själv."
            : "Produkten hittades inte i Open Food Facts — fyll i själv.",
        })
      }
    } catch {
      setItemForm({ mode: "manual", product: null, barcode: ean, notice: "Kunde inte slå upp produkten — fyll i själv." })
    } finally {
      setLookingUp(false)
    }
  }

  function handleSubmitItem(item: FoodItemInput) {
    const editIndex = itemForm?.editIndex
    if (editIndex !== undefined) {
      setItems((prev) => prev.map((it, i) => (i === editIndex ? item : it)))
    } else {
      setItems((prev) => [...prev, item])
    }
    setItemForm(null)
  }

  function editItem(index: number) {
    const item = items[index]
    setItemForm({ mode: "manual", product: null, barcode: item.barcode ?? null, notice: null, editIndex: index, initialItem: item })
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!valid || saving) return
    setSaving(true)
    try {
      await onSave({ title: title.trim(), items })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5 flex flex-col gap-4">
      <p className="text-gray-900 dark:text-white font-semibold">
        {initial ? "Redigera måltid" : "Ny måltid"}
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Måltid</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="T.ex. Lunch"
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 w-full"
        />
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_TITLES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTitle(t)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                title === t
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Livsmedel</p>
          <div className="divide-y divide-emerald-50 dark:divide-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl overflow-hidden">
            {items.map((item, i) => {
              const m = calcMacros(item)
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-900">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {item.grams} g · {m.kcal} kcal · {m.protein} g protein
                    </p>
                  </div>
                  <button
                    onClick={() => editItem(i)}
                    className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                    aria-label="Redigera livsmedel"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    aria-label="Ta bort livsmedel"
                  >
                    <X size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {lookingUp && <p className="text-gray-400 dark:text-gray-500 text-sm">Slår upp produkt…</p>}

      {itemForm ? (
        <FoodEntryForm
          mode={itemForm.mode}
          product={itemForm.product}
          barcode={itemForm.barcode}
          notice={itemForm.notice}
          initial={itemForm.initialItem}
          submitLabel={itemForm.editIndex !== undefined ? "Spara ändring" : "Lägg till i måltiden"}
          onAdd={handleSubmitItem}
          onCancel={() => setItemForm(null)}
        />
      ) : (
        !lookingUp && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowScanner(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <ScanBarcode size={15} />
              Skanna streckkod
            </button>
            <button
              onClick={() => setItemForm({ mode: "manual", product: null, barcode: null, notice: null })}
              className="border border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={15} />
              Lägg till manuellt
            </button>
          </div>
        )
      )}

      <div className="border-t border-emerald-50 dark:border-emerald-900/30 pt-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">{totals.kcal} kcal</span>
          {" · "}{totals.protein} g protein · {totals.carbs} g kolhydrater · {totals.fat} g fett
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? "Sparar…" : "Spara måltid"}
          </button>
          <button
            onClick={onCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 text-sm"
          >
            Avbryt
          </button>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onDetected={handleDetected} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
