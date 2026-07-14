"use client"

import { useEffect, useMemo, useState } from "react"
import Fuse from "fuse.js"
import { ChevronLeft, Info, Plus, Search, X } from "lucide-react"
import BottomSheet from "@/app/components/BottomSheet"
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

const MECHANIC_LABELS: Record<string, string> = {
  compound: "Basövning",
  isolation: "Isolation",
}

function muscleList(muscles: Muscle[]): string {
  return muscles.map((m) => MUSCLE_LABELS[m]).join(", ")
}

// Full-screen "how to perform" view inside the same sheet — image, tags,
// muscles, and the step-by-step instructions (English, from the dataset).
function ExerciseDetail({
  ex,
  onBack,
  onClose,
  onAdd,
}: {
  ex: LibraryExercise
  onBack: () => void
  onClose: () => void
  onAdd: () => void
}) {
  const image = exerciseImageUrl(ex)
  const tags = [
    LEVEL_LABELS[ex.level],
    equipmentLabel(ex.equipment),
    ex.mechanic ? MECHANIC_LABELS[ex.mechanic] : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <div className="flex items-center gap-2 p-5 pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tillbaka"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-gray-900 dark:text-white font-semibold flex-1 min-w-0 truncate">{ex.name}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={ex.name}
            loading="lazy"
            className="w-full h-52 object-cover rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        )}

        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {t}
            </span>
          ))}
        </div>

        {(ex.primary.length > 0 || ex.secondary.length > 0) && (
          <div className="flex flex-col gap-1 text-sm">
            {ex.primary.length > 0 && (
              <p className="text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 dark:text-gray-500">Primära muskler: </span>
                {muscleList(ex.primary)}
              </p>
            )}
            {ex.secondary.length > 0 && (
              <p className="text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 dark:text-gray-500">Sekundära: </span>
                {muscleList(ex.secondary)}
              </p>
            )}
          </div>
        )}

        {ex.instructions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Så här gör du</p>
            <ol className="flex flex-col gap-2 list-decimal pl-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed marker:text-indigo-400 marker:font-medium">
              {ex.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Lägg till i planen
        </button>
      </div>
    </>
  )
}

export default function ExercisePicker({ onSelect, onClose }: Props) {
  const [db, setDb] = useState<LibraryExercise[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState("")
  const [muscleFilter, setMuscleFilter] = useState<Muscle | null>(null)
  const [detail, setDetail] = useState<LibraryExercise | null>(null)

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
    <BottomSheet onClose={onClose} title="Övningsbibliotek" desktopClassName="max-w-lg">
      {detail ? (
        <ExerciseDetail
          ex={detail}
          onBack={() => setDetail(null)}
          onClose={onClose}
          onAdd={() => onSelect(detail)}
        />
      ) : (
        <>
          <div className="p-5 pb-3 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-gray-900 dark:text-white font-semibold">Övningsbibliotek</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  870+ övningar — tryck på namnet för att lägga till, eller på <Info size={11} className="inline -mt-0.5" /> för instruktioner
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
              <div
                key={ex.name}
                className="flex items-stretch border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onSelect(ex)}
                  className="flex-1 min-w-0 flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                      {ex.primary.length > 0 && <> · {muscleList(ex.primary)}</>}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setDetail(ex)}
                  aria-label={`Visa instruktioner för ${ex.name}`}
                  className="px-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l border-gray-100 dark:border-gray-800"
                >
                  <Info size={18} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  )
}
