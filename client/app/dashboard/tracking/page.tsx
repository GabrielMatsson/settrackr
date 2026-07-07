"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { X, Dumbbell, Users, Calendar, Trophy, Sparkles } from "lucide-react"
import { motion, AnimatePresence, Reorder, useDragControls } from "motion/react"
import AnimatedNumber from "@/app/components/AnimatedNumber"
import SuccessCheck from "@/app/components/SuccessCheck"
import PressableButton from "@/app/components/PressableButton"
import { easeOut, popSpring, gentleSpring, fadeUp, fadeUpTransition } from "@/lib/motion"
import PlanForm from "./components/PlanForm"
import PlanCard from "./components/PlanCard"
import SharedPlanCard from "./components/SharedPlanCard"
import WorkoutLogger from "./components/WorkoutLogger"
import type { Exercise, WorkoutPlan, WorkoutLog } from "./components/types"
import { getPlans, createPlan, updatePlan, deletePlan as apiDeletePlan, createLog, getFriends, getSharedPlans, sharePlan, unsharePlan, leaveSharedPlan, getMe, reorderPlans, getMyLevel, clearCache } from "@/lib/api"

type LevelInfo = { xp: number; level: number; title: string; progress_pct: number; next_title: string | null; next_threshold: number | null }

type Friend = { id: number; name: string | null; email: string }
type FriendEntry = { id: number; status: string; friend: Friend }
type SharedPlan = { id: number; name: string; exercises: { id: number; name: string; sets: number; reps: number }[]; owner: Friend }

// One-shot star burst behind the level-up trophy — transform/opacity only
const BURST_STARS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
  return {
    x: Math.round(Math.cos(angle) * 78),
    y: Math.round(Math.sin(angle) * 78),
    size: i % 2 === 0 ? 18 : 13,
    delay: 0.18 + (i % 4) * 0.04,
  }
})

function CelebrationBurst() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {BURST_STARS.map(({ x, y, size, delay }, i) => (
        <motion.span
          key={i}
          className="absolute text-indigo-400 dark:text-indigo-300"
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x, y, scale: [0, 1, 0.85], opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, delay, ease: easeOut }}
        >
          <Sparkles size={size} />
        </motion.span>
      ))}
    </div>
  )
}

// Reorder.Item wrapper: drag starts only from the grip handle so taps/clicks
// on the row still expand the card, and rows lift slightly while dragged
function DraggableRow<T>({ value, onDragEnd, children }: {
  value: T
  onDragEnd?: () => void
  children: (startDrag: (e: React.PointerEvent) => void) => React.ReactNode
}) {
  const dragControls = useDragControls()
  return (
    <Reorder.Item
      as="div"
      value={value}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 10 }}
      className="relative bg-white dark:bg-gray-950"
    >
      {children((e) => dragControls.start(e))}
    </Reorder.Item>
  )
}

export default function TrackingPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [sharedPlans, setSharedPlans] = useState<SharedPlan[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [planName, setPlanName] = useState("")
  const [planIcon, setPlanIcon] = useState("Dumbbell")
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: 3, reps: 10 }])
  const [loggerVisible, setLoggerVisible] = useState(false)
  const [loggingPlan, setLoggingPlan] = useState<{ name: string; icon?: string; exercises: Exercise[] } | null>(null)
  const [logSaved, setLogSaved] = useState(false)
  const [xpResult, setXpResult] = useState<LevelInfo & { earned: number } | null>(null)
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showOverloadHints, setShowOverloadHints] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  // Mirrors plans so the drag-end handler persists the order Reorder produced
  const plansRef = useRef<WorkoutPlan[]>([])

  useEffect(() => {
    plansRef.current = plans
  }, [plans])

  useEffect(() => {
    getPlans().then((loadedPlans: WorkoutPlan[]) => {
      setPlans(loadedPlans)
      try {
        const raw = localStorage.getItem("settrackr_wip")
        if (raw) {
          const wip = JSON.parse(raw)
          const match = loadedPlans.find((p) => p.id === wip.planId)
          if (match) {
            setLoggingPlan(match)
            setLoggerVisible(true)
            setAutoStart(true)
          }
        }
      } catch {}
    }).catch(() => setError("Kunde inte ansluta till servern"))
    getSharedPlans().then(setSharedPlans).catch(() => {})
    getFriends().then((data: FriendEntry[]) => setFriends(data.map((f) => f.friend))).catch(() => {})
    getMe().then((p: { show_overload_hints: boolean }) => setShowOverloadHints(p.show_overload_hints ?? false)).catch(() => {})
  }, [])

  async function handleSharePlan(planId: number, friendId: number) {
    await sharePlan(planId, friendId)
    const updated = await getPlans()
    setPlans(updated)
  }

  async function handleUnsharePlan(planId: number, friendId: number) {
    await unsharePlan(planId, friendId)
    const updated = await getPlans()
    setPlans(updated)
  }

  async function handleLeaveSharedPlan(planId: number) {
    try {
      await leaveSharedPlan(planId)
      const remaining = sharedPlans.filter((p) => p.id !== planId)
      setSharedPlans(remaining)
    } catch {
      setError("Kunde inte ta bort delad plan")
    }
  }

  function addExercise() {
    const updated = exercises.concat([{ name: "", sets: 3, reps: 10 }])
    setExercises(updated)
  }

  function removeExercise(index: number) {
    const updated = [...exercises]
    updated.splice(index, 1)
    setExercises(updated)
  }

  function updateExerciseName(index: number, value: string) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], name: value }
    setExercises(updated)
  }

  function updateExerciseSets(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], sets: value }
    setExercises(updated)
  }

  function updateExerciseReps(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], reps: value }
    setExercises(updated)
  }
  function reorderExercise(from: number, to: number) {
    if (from === to) return
    const updated = [...exercises]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setExercises(updated)
  }

  function openCreateForm() {
    setEditingId(null)
    setPlanName("")
    setPlanIcon("Dumbbell")
    setExercises([{ name: "", sets: 3, reps: 10 }])
    setFormVisible(true)
  }

  function openEditForm(plan: WorkoutPlan) {
    setEditingId(plan.id)
    setPlanName(plan.name)
    setPlanIcon(plan.icon ?? "Dumbbell")
    setExercises([...plan.exercises])
    setFormVisible(true)
  }

  async function savePlan() {
    if (!planName.trim()) return
    try {
      if (editingId === null) {
        const saved = await createPlan({ name: planName, icon: planIcon, exercises })
        const updated = plans.concat([saved])
        setPlans(updated)
      } else {
        const saved = await updatePlan(editingId, { name: planName, icon: planIcon, exercises })
        const updated = plans.map((p) => (p.id === editingId ? saved : p))
        setPlans(updated)
      }
      closeForm()
    } catch {
      setError("Kunde inte spara planen")
    }
  }

  async function handleDeletePlan(id: number) {
    try {
      await apiDeletePlan(id)
      const remaining = plans.filter((p) => p.id !== id)
      setPlans(remaining)
    } catch {
      setError("Kunde inte ta bort planen")
    }
  }

  function closeForm() {
    setFormVisible(false)
    setEditingId(null)
    setPlanName("")
    setPlanIcon("Dumbbell")
    setExercises([{ name: "", sets: 3, reps: 10 }])
  }

  async function saveLog(log: WorkoutLog) {
    try {
      const prevLevel = await getMyLevel().catch(() => null) as LevelInfo | null
      await createLog({ plan_name: log.planName, icon: log.icon ?? "Dumbbell", date: log.date, exercises: log.exercises })
      setLoggerVisible(false)
      setLogSaved(true)
      clearCache("/users/me/level")
      const newLevel = await getMyLevel().catch(() => null) as LevelInfo | null
      if (prevLevel && newLevel) {
        setXpResult({ ...newLevel, earned: newLevel.xp - prevLevel.xp })
        if (newLevel.level > prevLevel.level) {
          setLevelUpData({ level: newLevel.level, title: newLevel.title })
        }
      }
    } catch {
      setError("Kunde inte spara träningspasset")
    }
  }

  function persistPlanOrder() {
    reorderPlans(plansRef.current.map((p) => p.id)).catch(() => setError("Kunde inte spara ordningen"))
  }

  function openLogger(plan?: { name: string; icon?: string; exercises: Exercise[] }) {
    setLoggingPlan(plan ?? null)
    setLoggerVisible(true)
    setLogSaved(false)
  }

  const allPlans: WorkoutPlan[] = [
    ...plans,
    ...sharedPlans.map((p) => ({
      id: p.id,
      name: `${p.name} (${p.owner.name ?? p.owner.email.split("@")[0]})`,
      exercises: p.exercises,
    })),
  ]
  const activePlans = loggingPlan ? [loggingPlan as unknown as WorkoutPlan] : allPlans

  const totalExercises = plans.reduce((acc, p) => acc + p.exercises.length, 0)

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Träningsplaner</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Skapa, hantera och följ dina träningsplaner.</p>
        </div>
        <div className="flex items-center gap-2 sm:w-auto w-full">
          <PressableButton
            onClick={() => openLogger()}
            className="flex-1 sm:flex-none border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Logga pass
          </PressableButton>
          <PressableButton
            onClick={openCreateForm}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Skapa ny plan
          </PressableButton>
        </div>
      </div>

      <AnimatePresence>
      {logSaved && (
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SuccessCheck size={18} className="text-green-500 shrink-0" />
              <span className="text-green-800 dark:text-green-300 text-sm font-medium">Träningspasset är sparat!</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/statistics/history" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                Visa i historik →
              </Link>
              <button onClick={() => { setLogSaved(false); setXpResult(null) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={15} />
              </button>
            </div>
          </div>

          {xpResult && (
            <div className="border-t border-green-200 dark:border-green-800 pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                +<AnimatedNumber value={xpResult.earned} /> XP
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  Nivå {xpResult.level} · {xpResult.title}
                </span>
              </div>
              <div className="w-full h-1.5 bg-green-100 dark:bg-green-900/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-1.5 w-full bg-indigo-500 rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: xpResult.progress_pct / 100 }}
                  transition={gentleSpring}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {xpResult.next_title
                  ? `${(xpResult.next_threshold! - xpResult.xp).toLocaleString("sv-SE")} XP kvar till ${xpResult.next_title}`
                  : "Max nivå uppnådd!"}
              </p>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {levelUpData && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: easeOut }}
          onClick={() => setLevelUpData(null)}
        >
          <motion.div
            className="relative bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-xs w-full text-center flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: easeOut } }}
            transition={popSpring}
            onClick={(e) => e.stopPropagation()}
          >
            <CelebrationBurst />
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...popSpring, delay: 0.15 }}
            >
              <Trophy size={48} className="text-indigo-500" />
            </motion.div>
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Nivå upp!</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{levelUpData.title}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Nivå {levelUpData.level}</p>
            </div>
            <PressableButton
              onClick={() => setLevelUpData(null)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Tack!
            </PressableButton>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
        <div className="flex flex-col gap-4">
          {formVisible && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-6 bg-white dark:bg-gray-950">
              <PlanForm
                isEditing={editingId !== null}
                planName={planName}
                planIcon={planIcon}
                exercises={exercises}
                onPlanNameChange={setPlanName}
                onPlanIconChange={setPlanIcon}
                onAddExercise={addExercise}
                onRemoveExercise={removeExercise}
                onUpdateName={updateExerciseName}
                onUpdateSets={updateExerciseSets}
                onUpdateReps={updateExerciseReps}
                onReorder={reorderExercise}
                onSave={savePlan}
                onCancel={closeForm}
              />
            </div>
          )}

          {loggerVisible && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-6 bg-white dark:bg-gray-950">
              <WorkoutLogger
                plans={activePlans}
                onSave={(log) => { saveLog(log); setLoggingPlan(null); setAutoStart(false) }}
                onCancel={() => { setLoggerVisible(false); setLoggingPlan(null); setAutoStart(false) }}
                showOverloadHints={showOverloadHints}
                autoStart={autoStart}
              />
            </div>
          )}
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={fadeUpTransition(0)}
            className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden bg-white dark:bg-gray-950">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <Dumbbell size={15} className="text-indigo-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Träningsplaner</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Dina färdiga träningspass</p>
              </div>
            </div>

            {plans.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm px-5 py-4">Inga planer ännu. Skapa din första!</p>
            ) : (
              <Reorder.Group
                as="div"
                axis="y"
                values={plans}
                onReorder={setPlans}
                className="divide-y divide-gray-100 dark:divide-gray-800"
              >
                {plans.map((plan) => (
                  <DraggableRow key={plan.id} value={plan} onDragEnd={persistPlanOrder}>
                    {(startDrag) => (
                      <PlanCard
                        plan={plan}
                        onEdit={openEditForm}
                        onDelete={handleDeletePlan}
                        onLog={(p) => openLogger({ name: p.name, icon: p.icon, exercises: p.exercises })}
                        friends={friends}
                        onShare={handleSharePlan}
                        onUnshare={handleUnsharePlan}
                        onGripPointerDown={startDrag}
                      />
                    )}
                  </DraggableRow>
                ))}
              </Reorder.Group>
            )}

            <button
              onClick={openCreateForm}
              className="w-full text-center text-indigo-600 dark:text-indigo-300 text-sm font-medium py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors rounded-b-2xl border-t border-indigo-100 dark:border-indigo-900/50"
            >
              + Skapa ny plan
            </button>
          </motion.div>

          {sharedPlans.length > 0 && (
            <motion.div
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              transition={fadeUpTransition(1)}
              className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden bg-white dark:bg-gray-950">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Users size={15} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Delade planer</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Träningsplaner som delats med dig</p>
                </div>
              </div>
              <Reorder.Group
                as="div"
                axis="y"
                values={sharedPlans}
                onReorder={setSharedPlans}
                className="divide-y divide-gray-100 dark:divide-gray-800"
              >
                {sharedPlans.map((plan) => (
                  <DraggableRow key={plan.id} value={plan}>
                    {(startDrag) => (
                      <SharedPlanCard
                        plan={plan}
                        onLog={(p) => openLogger({ name: p.name, exercises: p.exercises })}
                        onRemove={handleLeaveSharedPlan}
                        onGripPointerDown={startDrag}
                      />
                    )}
                  </DraggableRow>
                ))}
              </Reorder.Group>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={fadeUpTransition(2)}
          className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 flex flex-col gap-5 bg-white dark:bg-gray-950 sticky top-8">
          <h3 className="font-semibold text-gray-900 dark:text-white">Översikt</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none"><AnimatedNumber value={plans.length} /></p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Planer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <Dumbbell size={16} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none"><AnimatedNumber value={totalExercises} /></p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Övningar</p>
              </div>
            </div>
            {sharedPlans.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white leading-none"><AnimatedNumber value={sharedPlans.length} /></p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Delade planer</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
