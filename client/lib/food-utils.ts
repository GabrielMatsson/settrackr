export type FoodItem = {
  id: number
  name: string
  brand?: string | null
  barcode?: string | null
  grams: number
  kcal_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
}

export type FoodItemInput = Omit<FoodItem, "id">

export type Meal = {
  id: number
  date: string
  title: string
  items: FoodItem[]
}

export type Macros = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type OFFProduct = {
  name?: string
  brand?: string
  kcal_100g?: number
  protein_100g?: number
  carbs_100g?: number
  fat_100g?: number
}

type MacroFields = Pick<FoodItem, "grams" | "kcal_100g" | "protein_100g" | "carbs_100g" | "fat_100g">

export function calcMacros(entry: MacroFields): Macros {
  const factor = entry.grams / 100
  return {
    kcal: Math.round(entry.kcal_100g * factor),
    protein: Math.round(entry.protein_100g * factor * 10) / 10,
    carbs: Math.round(entry.carbs_100g * factor * 10) / 10,
    fat: Math.round(entry.fat_100g * factor * 10) / 10,
  }
}

export function sumMacros(entries: MacroFields[]): Macros {
  return entries.reduce(
    (acc, e) => {
      const m = calcMacros(e)
      return {
        kcal: acc.kcal + m.kcal,
        protein: Math.round((acc.protein + m.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + m.carbs) * 10) / 10,
        fat: Math.round((acc.fat + m.fat) * 10) / 10,
      }
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function sumMealsMacros(meals: Meal[]): Macros {
  return sumMacros(meals.flatMap((m) => m.items))
}

export function mealItemsToInputs(meal: Meal): FoodItemInput[] {
  return meal.items.map((item) => ({
    name: item.name,
    brand: item.brand,
    barcode: item.barcode,
    grams: item.grams,
    kcal_100g: item.kcal_100g,
    protein_100g: item.protein_100g,
    carbs_100g: item.carbs_100g,
    fat_100g: item.fat_100g,
  }))
}

// One-tap cooking-fat quick-adds — you usually cook a meal in butter/oil that's
// easy to forget. Default 10 g; grams are editable after adding.
export const FAT_PRESETS: FoodItemInput[] = [
  { name: "Smör", brand: null, barcode: null, grams: 10, kcal_100g: 717, protein_100g: 0.9, carbs_100g: 0.1, fat_100g: 81 },
  { name: "Olivolja", brand: null, barcode: null, grams: 10, kcal_100g: 884, protein_100g: 0, carbs_100g: 0, fat_100g: 100 },
  { name: "Rapsolja", brand: null, barcode: null, grams: 10, kcal_100g: 884, protein_100g: 0, carbs_100g: 0, fat_100g: 100 },
]

export function todayStr(): string {
  return new Date().toLocaleDateString("sv-SE")
}

export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString("sv-SE")
}

export function formatDateLabel(dateStr: string): string {
  if (dateStr === todayStr()) return "Idag"
  if (dateStr === shiftDate(todayStr(), -1)) return "Igår"
  const label = new Date(dateStr + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - day)
  return d.toLocaleDateString("sv-SE")
}

export function weekDates(startStr: string): string[] {
  const dates = []
  for (let i = 0; i < 7; i++) dates.push(shiftDate(startStr, i))
  return dates
}

export type DayTotal = { date: string; logged: boolean } & Macros

export function dailyTotals(meals: Meal[], dates: string[]): DayTotal[] {
  return dates.map((date) => {
    const dayMeals = meals.filter((m) => m.date === date)
    return { date, logged: dayMeals.length > 0, ...sumMealsMacros(dayMeals) }
  })
}

export type WeekSummary = {
  avgKcal: number
  avgProtein: number
  daysOnTarget: number
  loggedDays: number
}

export function weekSummary(days: DayTotal[], kcalTarget: number, proteinTarget: number): WeekSummary {
  const logged = days.filter((d) => d.logged)
  if (logged.length === 0) return { avgKcal: 0, avgProtein: 0, daysOnTarget: 0, loggedDays: 0 }
  const avgKcal = Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length)
  const avgProtein = Math.round((logged.reduce((s, d) => s + d.protein, 0) / logged.length) * 10) / 10
  const daysOnTarget = logged.filter((d) => d.kcal <= kcalTarget && d.protein >= proteinTarget).length
  return { avgKcal, avgProtein, daysOnTarget, loggedDays: logged.length }
}

export type MealAccentKey = "amber" | "emerald" | "teal" | "orange"

const ACCENT_CYCLE: MealAccentKey[] = ["emerald", "teal", "amber", "orange"]

export function mealAccent(title: string, index: number): MealAccentKey {
  const t = title.toLowerCase()
  if (t.startsWith("frukost")) return "amber"
  if (t.startsWith("lunch")) return "emerald"
  if (t.startsWith("middag")) return "teal"
  if (t.startsWith("mellanmål")) return "orange"
  return ACCENT_CYCLE[index % ACCENT_CYCLE.length]
}

type OFFNutriments = {
  "energy-kcal_100g"?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
}

type OFFResponse = {
  status: number
  product?: {
    product_name?: string
    product_name_sv?: string
    brands?: string
    nutriments?: OFFNutriments
  }
}

export function mapOFFProduct(data: OFFResponse): OFFProduct | null {
  if (data.status === 0 || !data.product) return null
  const p = data.product
  const n = p.nutriments ?? {}
  return {
    name: p.product_name_sv || p.product_name || undefined,
    brand: p.brands ? p.brands.split(",")[0].trim() : undefined,
    kcal_100g: n["energy-kcal_100g"],
    protein_100g: n.proteins_100g,
    carbs_100g: n.carbohydrates_100g,
    fat_100g: n.fat_100g,
  }
}

export async function lookupBarcode(ean: string): Promise<OFFProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}?fields=product_name,product_name_sv,brands,nutriments`
  )
  if (!res.ok) return null
  const data: OFFResponse = await res.json()
  return mapOFFProduct(data)
}
