"use client"

import { useState } from "react"
import PlanForm from "./components/PlanForm"
import PlanCard from "./components/PlanCard"
import WorkoutLogger from "./components/WorkoutLogger"
import type { Exercise, WorkoutPlan, WorkoutLog } from "./components/types"

export default function TrackingPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [planName, setPlanName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: 3, reps: 10 }])

  const [loggerVisible, setLoggerVisible] = useState(false)

  // --- Plan management ---

  function addExercise() {
    setExercises([...exercises, { name: "", sets: 3, reps: 10 }])
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

  function openCreateForm() {
    setEditingId(null)
    setPlanName("")
    setExercises([{ name: "", sets: 3, reps: 10 }])
    setFormVisible(true)
  }

  function openEditForm(plan: WorkoutPlan) {
    setEditingId(plan.id)
    setPlanName(plan.name)
    setExercises([...plan.exercises])
    setFormVisible(true)
  }

  function savePlan() {
    if (!planName.trim()) return

    if (editingId === null) {
      setPlans([...plans, { id: Date.now(), name: planName, exercises }])
    } else {
      const updated = [...plans]
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].id === editingId) {
          updated[i] = { id: editingId, name: planName, exercises }
          break
        }
      }
      setPlans(updated)
    }

    closeForm()
  }

  function deletePlan(id: number) {
    const updated = []
    for (let i = 0; i < plans.length; i++) {
      if (plans[i].id !== id) {
        updated.push(plans[i])
      }
    }
    setPlans(updated)
  }

  function closeForm() {
    setFormVisible(false)
    setEditingId(null)
    setPlanName("")
    setExercises([{ name: "", sets: 3, reps: 10 }])
  }

  // --- Workout logging ---

  function saveLog(log: WorkoutLog) {
    // Save to localStorage so the statistics page can read it
    const existing: WorkoutLog[] = JSON.parse(localStorage.getItem("workoutLogs") || "[]")
    localStorage.setItem("workoutLogs", JSON.stringify([...existing, log]))
    setLoggerVisible(false)
  }

  // Build plan cards
  const planCards = []
  for (let i = 0; i < plans.length; i++) {
    planCards.push(
      <PlanCard
        key={plans[i].id}
        plan={plans[i]}
        onEdit={openEditForm}
        onDelete={deletePlan}
      />
    )
  }

  return (
    <div className="flex flex-col gap-10 max-w-2xl">

      {/* Workout Plans */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Träningsplaner</h1>
          {!formVisible && (
            <button
              onClick={openCreateForm}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Skapa ny plan
            </button>
          )}
        </div>

        {formVisible && (
          <PlanForm
            isEditing={editingId !== null}
            planName={planName}
            exercises={exercises}
            onPlanNameChange={setPlanName}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            onUpdateName={updateExerciseName}
            onUpdateSets={updateExerciseSets}
            onUpdateReps={updateExerciseReps}
            onSave={savePlan}
            onCancel={closeForm}
          />
        )}

        {plans.length === 0 && !formVisible && (
          <p className="text-gray-500">Inga träningsplaner ännu. Skapa din första!</p>
        )}

        <div className="flex flex-col gap-4">{planCards}</div>
      </section>

      <hr className="border-gray-800" />

      {/* Workout Logging */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Logga träning</h2>
          {!loggerVisible && (
            <button
              onClick={() => setLoggerVisible(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Logga pass
            </button>
          )}
        </div>

        {loggerVisible && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <WorkoutLogger
              plans={plans}
              onSave={saveLog}
              onCancel={() => setLoggerVisible(false)}
            />
          </div>
        )}

        {!loggerVisible && (
          <p className="text-gray-500">Logga ett pass för att se det i statistiken.</p>
        )}
      </section>

    </div>
  )
}
