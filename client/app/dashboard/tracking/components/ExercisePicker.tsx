"use client"

import { useEffect, useMemo, useState } from "react"
import Fuse from "fuse.js"
import { Search, X } from "lucide-react"
import { MUSCLE_LABELS, type Muscle } from "@/lib/muscle-map"
import {
  loadExerciseDb,
  exerciseImageUrl,
  equipmentLabel,
  LEVEL_LABELS,
  type LibraryExercise,
} from "@/lib/exercise-db"

type Props = {
  onSelect: (exercise: LibraryExercise) => void
  onClose: () => void
}

const MAX_RESULTS = 40

export default function ExercisePicker({ onSelect, onClose }: Props) {
  const [db, setDb] = useState<LibraryExercise[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState("")
  const [muscleFilter, setMuscleFilter] = useState<Muscle | null>(null)

  useEffect(() => {
    let cancelled = false
    loadExerciseDb()
      .then((data) => { if (!cancelled) setDb(data) })
      .catch(() => { if (!cancelled) setLoadError(true) })
    return () => { cancelled = true }
  }, [])

  const fuse = useMemo(
    () => (db ? new Fuse(db, { keys: ["name"], threshold: 0.35, ignoreLocation: true }) : null),
    [db]
  )

  const results = useMemo(() => {
    if (!db) return []
    let list = query.trim() && fuse ? fuse.search(query.trim()).map((r) => r.item) : db
    if (muscleFilter) list = list.filter((ex) => ex.primary.includes(muscleFilter))
    return list.slice(0, MAX_RESULTS)
  }, [db, fuse, query, muscleFilter])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-3 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-gray-900 dark:text-white font-semibold">Övningsbibliotek</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                870+ övningar med muskelgrupper — välj en för att lägga till den i planen
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök övning (engelska namn, t.ex. bench press)"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1">
            {(Object.keys(MUSCLE_LABELS) as Muscle[]).map((m) => {
              const on = muscleFilter === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMuscleFilter(on ? null : m)}
                  className={`text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                    on
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500"
                  }`}
                >
                  {MUSCLE_LABELS[m]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-800">
          {loadError && (
            <p className="text-red-500 dark:text-red-400 text-sm p-5">Kunde inte ladda övningsbiblioteket.</p>
          )}
          {!db && !loadError && (
            <p className="text-gray-400 dark:text-gray-500 text-sm p-5">Laddar övningar…</p>
          )}
          {db && results.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500 text-sm p-5">Inga övningar matchade sökningen.</p>
          )}
          {results.map((ex) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => onSelect(ex)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              {/* Dataset thumbnails come from GitHub raw content — plain <img>
                  keeps them out of Vercel's image optimization quota. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={exerciseImageUrl(ex) ?? ""}
                alt=""
                loading="lazy"
                className="w-14 h-10 object-cover rounded-md bg-gray-100 dark:bg-gray-800 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 dark:text-white truncate">{ex.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {LEVEL_LABELS[ex.level]} · {equipmentLabel(ex.equipment)}
                  {ex.primary.length > 0 && (
                    <> · {ex.primary.map((m) => MUSCLE_LABELS[m]).join(", ")}</>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
