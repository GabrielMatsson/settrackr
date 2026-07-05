"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { LogOut, Dumbbell, Calendar, Users, Info, Zap, Sun, Moon } from "lucide-react"
import { getFriends, getFriendRequests, getPlanInvitations, acceptFriendRequest, deleteFriendship, acceptPlanInvitation, declinePlanInvitation, sendFriendRequest, getLogs, getMe, updateMe, getMyLevel } from "@/lib/api"
import { handleSignOut } from "../actions"
import FriendProfile from "./FriendProfile"

type Friend = {
  id: number
  name: string | null
  email: string
}

type Friendship = {
  id: number
  status: string
  friend: Friend
}

type PlanInvitation = {
  id: number
  plan_id: number
  plan_name: string
  from_user: { id: number; name: string | null; email: string }
}

type Props = {
  name: string
  email: string
  image: string | null
}


export default function ProfileClient({ name, email, image }: Props) {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [requests, setRequests] = useState<Friendship[]>([])
  const [invitations, setInvitations] = useState<PlanInvitation[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [addingFriend, setAddingFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logs, setLogs] = useState<{ date: string }[]>([])
  const [profile, setProfile] = useState<{ name: string | null; email: string; weekly_goal: number } | null>(null)
  const [settingsName, setSettingsName] = useState("")
  const [settingsGoal, setSettingsGoal] = useState(3)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsOverloadHints, setSettingsOverloadHints] = useState(false)
  const [settingsChickenLegs, setSettingsChickenLegs] = useState(false)
  const [settingsGymGhost, setSettingsGymGhost] = useState(false)
  const [settingsKcalTarget, setSettingsKcalTarget] = useState(2200)
  const [settingsProteinTarget, setSettingsProteinTarget] = useState(150)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [levelInfo, setLevelInfo] = useState<{ xp: number; level: number; title: string; next_threshold: number | null; next_title: string | null; progress_pct: number; current_threshold: number } | null>(null)
  const [showLevelInfo, setShowLevelInfo] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    getFriends().then(setFriends).catch(() => setError("Kunde inte hämta vänner"))
    getLogs().then(setLogs).catch(() => {})
    getMyLevel().then((l) => setLevelInfo(l as typeof levelInfo)).catch(() => {})
    getMe().then((p) => {
      setProfile(p)
      setSettingsName(p.name ?? "")
      setSettingsGoal(p.weekly_goal)
      setSettingsOverloadHints(p.show_overload_hints ?? false)
      setSettingsChickenLegs(p.show_chicken_legs ?? false)
      setSettingsGymGhost(p.show_gym_ghost ?? false)
      setSettingsKcalTarget(p.kcal_target ?? 2200)
      setSettingsProteinTarget(p.protein_target ?? 150)
    }).catch(() => {})

    getFriendRequests().then(setRequests).catch(() => {})
    getPlanInvitations().then(setInvitations).catch(() => {})

    const poll = setInterval(() => {
      getFriendRequests().then(setRequests).catch(() => {})
      getPlanInvitations().then(setInvitations).catch(() => {})
    }, 30_000)

    return () => clearInterval(poll)
  }, [])

  async function handleSaveSettings() {
    setSettingsSaving(true)
    try {
      const updated = await updateMe({ name: settingsName || null, weekly_goal: settingsGoal, show_overload_hints: settingsOverloadHints, show_chicken_legs: settingsChickenLegs, show_gym_ghost: settingsGymGhost, kcal_target: settingsKcalTarget, protein_target: settingsProteinTarget })
      setProfile(updated)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch {
      setError("Kunde inte spara inställningar")
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleSendRequest() {
    if (!friendEmail.trim()) return
    try {
      await sendFriendRequest(friendEmail.trim())
      setSuccess("Vänförfrågan skickad!")
      setFriendEmail("")
      setAddingFriend(false)
      setError(null)
    } catch {
      setError("Kunde inte skicka vänförfrågan. Kontrollera att e-postadressen är rätt.")
    }
  }

  async function handleAccept(friendshipId: number) {
    try {
      const accepted = await acceptFriendRequest(friendshipId)
      const remainingRequests = requests.filter((r) => r.id !== friendshipId)
      setRequests(remainingRequests)
      const updatedFriends = friends.concat([accepted])
      setFriends(updatedFriends)
    } catch {
      setError("Kunde inte acceptera vänförfrågan")
    }
  }

  async function handleDecline(friendshipId: number) {
    try {
      await deleteFriendship(friendshipId)
      const remaining = requests.filter((r) => r.id !== friendshipId)
      setRequests(remaining)
    } catch {
      setError("Kunde inte neka vänförfrågan")
    }
  }

  async function handleRemoveFriend(friendshipId: number) {
    try {
      await deleteFriendship(friendshipId)
      const remaining = friends.filter((f) => f.id !== friendshipId)
      setFriends(remaining)
    } catch {
      setError("Kunde inte ta bort vän")
    }
  }

  async function handleAcceptInvitation(id: number) {
    try {
      await acceptPlanInvitation(id)
      const remaining = invitations.filter((i) => i.id !== id)
      setInvitations(remaining)
    } catch {
      setError("Kunde inte acceptera planinbjudan")
    }
  }

  async function handleDeclineInvitation(id: number) {
    try {
      await declinePlanInvitation(id)
      const remaining = invitations.filter((i) => i.id !== id)
      setInvitations(remaining)
    } catch {
      setError("Kunde inte neka planinbjudan")
    }
  }

  if (selectedFriend) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <FriendProfile friend={selectedFriend} onBack={() => setSelectedFriend(null)} />
      </div>
    )
  }

  const totalWorkouts = logs.length
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7))
  const startStr = startOfWeek.toISOString().slice(0, 10)
  const thisWeekLogs = logs.filter((l) => l.date >= startStr)
  const thisWeekDates = new Set(thisWeekLogs.map((l) => l.date))
  const thisWeekCount = thisWeekDates.size
  const weeklyGoal = profile?.weekly_goal ?? 3

  const weekMotivation =
    thisWeekCount >= weeklyGoal
      ? "Veckans mål uppnått!"
      : thisWeekCount > 0
        ? "Du är på god väg!"
        : "Kör hårt!"

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">

      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 bg-white dark:bg-gray-950">
        {image ? (
          <img src={image} alt={name} className="w-20 h-20 rounded-full shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white font-bold text-2xl">{name}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{email}</p>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-sm px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <LogOut size={15} />
            Logga ut
          </button>
        </form>
      </div>

      {levelInfo && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-white dark:bg-gray-950 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-indigo-500 shrink-0" />
              <span className="text-gray-900 dark:text-white font-bold">Nivå {levelInfo.level} · {levelInfo.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500 text-sm">{levelInfo.xp.toLocaleString("sv-SE")} XP</span>
              <button
                onClick={() => setShowLevelInfo((v) => !v)}
                className={`p-1 rounded-lg transition-colors ${showLevelInfo ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                aria-label="Visa XP-information"
              >
                <Info size={15} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progress_pct}%` }}
              />
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              {levelInfo.next_title
                ? `${(levelInfo.next_threshold! - levelInfo.xp).toLocaleString("sv-SE")} XP kvar till ${levelInfo.next_title}`
                : "Max nivå uppnådd!"}
            </p>
          </div>

          {showLevelInfo && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-gray-900 dark:text-white text-xs font-semibold uppercase tracking-wide">XP-regler</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-1.5 text-gray-500 dark:text-gray-400 font-medium">Händelse</th>
                      <th className="text-right py-1.5 text-gray-500 dark:text-gray-400 font-medium">XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    <tr>
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">Loggat pass (bas)</td>
                      <td className="py-1.5 text-right text-indigo-600 dark:text-indigo-400 font-medium">+50</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">Något set med svårighetsgrad &quot;Tufft&quot;</td>
                      <td className="py-1.5 text-right text-indigo-600 dark:text-indigo-400 font-medium">+25</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">Nytt personbästa i vikt på någon övning</td>
                      <td className="py-1.5 text-right text-indigo-600 dark:text-indigo-400 font-medium">+50</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-gray-400 dark:text-gray-500 text-xs leading-relaxed">Det är en fast bonus, max en gång per loggat pass, oavsett hur många övningar som kvalificerar.</p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-gray-900 dark:text-white text-xs font-semibold uppercase tracking-wide">Nivågränser</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-1.5 text-gray-500 dark:text-gray-400 font-medium">Nivå</th>
                      <th className="text-left py-1.5 text-gray-500 dark:text-gray-400 font-medium">Titel</th>
                      <th className="text-right py-1.5 text-gray-500 dark:text-gray-400 font-medium">XP krävs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {[
                      [1, "Nybörjare", 0],
                      [2, "Motionär", 250],
                      [3, "Atlet", "1 000"],
                      [4, "Veteran", "2 500"],
                      [5, "Elit", "5 000"],
                      [6, "Mästare", "12 500"],
                    ].map(([lvl, title, xpNeeded]) => (
                      <tr key={lvl} className={levelInfo.level === lvl ? "text-indigo-600 dark:text-indigo-400 font-semibold" : ""}>
                        <td className="py-1.5">{lvl}</td>
                        <td className="py-1.5">{title}</td>
                        <td className="py-1.5 text-right">{xpNeeded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-white dark:bg-gray-950 flex items-start gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-xl p-2.5 shrink-0">
            <Dumbbell size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">{totalWorkouts}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">träningspass totalt</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {totalWorkouts > 0 ? "Bra jobbat! Fortsätt så" : "Kom igång!"}
            </p>
          </div>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-white dark:bg-gray-950 flex items-start gap-4">
          <div className="bg-green-100 dark:bg-green-900/40 rounded-xl p-2.5 shrink-0">
            <Calendar size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
              {thisWeekCount}
              <span className="text-gray-400 dark:text-gray-500 text-xl font-normal"> / {weeklyGoal}</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">denna vecka</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{weekMotivation}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-950 flex flex-col gap-5">
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">Inställningar</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Hantera dina uppgifter och inställningar</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Visningsnamn</label>
            <input
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full"
            />
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Detta namn visas för andra användare.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Veckomål (pass per vecka)</label>
            <input
              type="number"
              min={1}
              max={14}
              value={settingsGoal}
              onChange={(e) => setSettingsGoal(Number(e.target.value))}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-24"
            />
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Sätt ett mål för hur många pass du vill genomföra varje vecka.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Kalorimål (kcal per dag)</label>
            <input
              type="number"
              min={500}
              max={10000}
              value={settingsKcalTarget}
              onChange={(e) => setSettingsKcalTarget(Number(e.target.value))}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-24"
            />
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Ditt dagliga kalorimål i kostspårningen.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Proteinmål (g per dag)</label>
            <input
              type="number"
              min={10}
              max={500}
              value={settingsProteinTarget}
              onChange={(e) => setSettingsProteinTarget(Number(e.target.value))}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-24"
            />
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Ditt dagliga proteinmål i kostspårningen.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Tema</label>
            {mounted && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === "light"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Sun size={16} />
                  Ljust
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Moon size={16} />
                  Mörkt
                </button>
              </div>
            )}
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Sparas lokalt på den här enheten.</p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="overload-hints"
                checked={settingsOverloadHints}
                onChange={(e) => setSettingsOverloadHints(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 shrink-0"
              />
              <label htmlFor="overload-hints" className="text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                Visa senaste och maxvikt vid loggning
              </label>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-xs ml-7">Visar dina senaste och tyngsta lyft när du loggar ett pass.</p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col gap-1">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Personlighet</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chicken-legs"
                  checked={settingsChickenLegs}
                  onChange={(e) => setSettingsChickenLegs(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 shrink-0"
                />
                <label htmlFor="chicken-legs" className="text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                  Kycklingben
                </label>
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-xs ml-7">Hoppat över bendag 3 gånger i rad?</p>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="gym-ghost"
                  checked={settingsGymGhost}
                  onChange={(e) => setSettingsGymGhost(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 shrink-0"
                />
                <label htmlFor="gym-ghost" className="text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                  Gymspöket
                </label>
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-xs ml-7">7 dagar utan träning?</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {settingsSaving ? "Sparar..." : "Spara ändringar"}
            </button>
            {settingsSaved && <span className="text-green-500 text-sm">Sparat!</span>}
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-950 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-900 dark:text-white font-semibold">Mina vänner</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Följ och motivera dina vänner</p>
            </div>
            <button
              onClick={() => { setAddingFriend(!addingFriend); setSuccess(null) }}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center text-lg leading-none shrink-0"
            >
              +
            </button>
          </div>

          {friends.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setSelectedFriend(f.friend)}
                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                      {(f.friend.name ?? f.friend.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm font-medium">{f.friend.name ?? f.friend.email}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">{f.friend.email}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRemoveFriend(f.id)}
                    className="border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-2.5 py-1 rounded-lg transition-colors shrink-0"
                  >
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          )}

          {requests.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Vänförfrågningar ({requests.length})</p>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-3">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 text-xs font-medium shrink-0">
                        {(r.friend.name ?? r.friend.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-xs font-medium">{r.friend.name ?? r.friend.email}</p>
                        <p className="text-gray-400 text-xs">{r.friend.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAccept(r.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1 rounded-lg transition-colors">Acceptera</button>
                      <button onClick={() => handleDecline(r.id)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs px-2 transition-colors">Neka</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invitations.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Planinbjudningar ({invitations.length})</p>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-3">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-gray-900 dark:text-white text-xs font-medium">{inv.plan_name}</p>
                      <p className="text-gray-400 text-xs">från {inv.from_user.name ?? inv.from_user.email}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAcceptInvitation(inv.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1 rounded-lg transition-colors">Acceptera</button>
                      <button onClick={() => handleDeclineInvitation(inv.id)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs px-2 transition-colors">Neka</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {addingFriend ? (
            <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <input
                placeholder="Vännens e-postadress"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button onClick={handleSendRequest} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  Skicka förfrågan
                </button>
                <button onClick={() => setAddingFriend(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors px-2">
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setAddingFriend(true); setSuccess(null) }}
              className="w-full bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 flex flex-col items-center gap-1.5 transition-colors"
            >
              <Users size={22} className="text-indigo-500" />
              <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Lägg till vän</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">Sök efter vänner och följ deras framsteg.</p>
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-500 dark:text-green-400 text-sm">{success}</p>}
    </div>
  )
}
