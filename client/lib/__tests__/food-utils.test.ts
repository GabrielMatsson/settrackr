import {
  calcMacros,
  sumMacros,
  sumMealsMacros,
  mealItemsToInputs,
  mapOFFProduct,
  shiftDate,
  startOfWeek,
  weekDates,
  dailyTotals,
  weekSummary,
  mealAccent,
  type Meal,
} from "../food-utils"

describe("calcMacros", () => {
  it("scales per-100g values by grams", () => {
    const macros = calcMacros({ grams: 150, kcal_100g: 350, protein_100g: 8, carbs_100g: 77, fat_100g: 1 })
    expect(macros).toEqual({ kcal: 525, protein: 12, carbs: 115.5, fat: 1.5 })
  })

  it("returns zeros for 0 grams", () => {
    const macros = calcMacros({ grams: 0, kcal_100g: 350, protein_100g: 8, carbs_100g: 77, fat_100g: 1 })
    expect(macros).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })

  it("rounds kcal to integer and macros to one decimal", () => {
    const macros = calcMacros({ grams: 33, kcal_100g: 123, protein_100g: 4.56, carbs_100g: 7.89, fat_100g: 0.12 })
    expect(macros.kcal).toBe(41)
    expect(macros.protein).toBe(1.5)
    expect(macros.carbs).toBe(2.6)
    expect(macros.fat).toBe(0)
  })
})

describe("sumMacros", () => {
  it("sums macros across entries", () => {
    const entries = [
      { grams: 100, kcal_100g: 350, protein_100g: 8, carbs_100g: 77, fat_100g: 1 },
      { grams: 200, kcal_100g: 110, protein_100g: 23, carbs_100g: 0, fat_100g: 2 },
    ]
    const total = sumMacros(entries)
    expect(total.kcal).toBe(570)
    expect(total.protein).toBe(54)
    expect(total.carbs).toBe(77)
    expect(total.fat).toBe(5)
  })

  it("returns zeros for empty list", () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

const rice = { id: 1, name: "Ris", grams: 100, kcal_100g: 350, protein_100g: 8, carbs_100g: 77, fat_100g: 1 }
const chicken = { id: 2, name: "Kyckling", grams: 200, kcal_100g: 110, protein_100g: 23, carbs_100g: 0, fat_100g: 2 }

describe("sumMealsMacros", () => {
  it("flattens items across meals", () => {
    const meals: Meal[] = [
      { id: 1, date: "2026-07-04", title: "Lunch", items: [rice, chicken] },
      { id: 2, date: "2026-07-04", title: "Mellanmål", items: [{ ...rice, id: 3, grams: 50 }] },
    ]
    const total = sumMealsMacros(meals)
    expect(total.kcal).toBe(570 + 175)
    expect(total.protein).toBe(54 + 4)
  })

  it("returns zeros for no meals", () => {
    expect(sumMealsMacros([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe("mealItemsToInputs", () => {
  it("strips the id from each item", () => {
    const meal: Meal = { id: 7, date: "2026-07-04", title: "Lunch", items: [rice, chicken] }
    const inputs = mealItemsToInputs(meal)
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).not.toHaveProperty("id")
    expect(inputs[0]).toMatchObject({ name: "Ris", grams: 100, kcal_100g: 350 })
  })
})

describe("startOfWeek", () => {
  it("returns Monday for a mid-week date", () => {
    expect(startOfWeek("2026-07-01")).toBe("2026-06-29") // Wednesday -> Monday
  })

  it("returns previous Monday for a Sunday", () => {
    expect(startOfWeek("2026-07-05")).toBe("2026-06-29")
  })

  it("returns the same date for a Monday", () => {
    expect(startOfWeek("2026-06-29")).toBe("2026-06-29")
  })

  it("handles year boundaries", () => {
    expect(startOfWeek("2026-01-01")).toBe("2025-12-29") // Thursday -> previous Monday
  })
})

describe("weekDates", () => {
  it("returns 7 consecutive dates", () => {
    const dates = weekDates("2026-06-29")
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe("2026-06-29")
    expect(dates[6]).toBe("2026-07-05")
  })
})

describe("dailyTotals", () => {
  it("groups meals per day and zero-fills unlogged days", () => {
    const meals: Meal[] = [
      { id: 1, date: "2026-06-29", title: "Lunch", items: [rice] },
      { id: 2, date: "2026-06-29", title: "Middag", items: [chicken] },
      { id: 3, date: "2026-07-01", title: "Frukost", items: [rice] },
    ]
    const days = dailyTotals(meals, weekDates("2026-06-29"))
    expect(days).toHaveLength(7)
    expect(days[0]).toMatchObject({ date: "2026-06-29", logged: true, kcal: 570 })
    expect(days[1]).toMatchObject({ date: "2026-06-30", logged: false, kcal: 0 })
    expect(days[2]).toMatchObject({ date: "2026-07-01", logged: true, kcal: 350 })
  })
})

describe("weekSummary", () => {
  const day = (date: string, kcal: number, protein: number, logged = true) => ({
    date, logged, kcal, protein, carbs: 0, fat: 0,
  })

  it("averages over logged days only", () => {
    const days = [day("d1", 2000, 150), day("d2", 2400, 100), day("d3", 0, 0, false)]
    const s = weekSummary(days, 2200, 150)
    expect(s.avgKcal).toBe(2200)
    expect(s.avgProtein).toBe(125)
    expect(s.loggedDays).toBe(2)
  })

  it("counts days on target (kcal <= target AND protein >= target)", () => {
    const days = [
      day("d1", 2000, 150), // on target
      day("d2", 2400, 160), // kcal over
      day("d3", 2100, 100), // protein under
    ]
    expect(weekSummary(days, 2200, 150).daysOnTarget).toBe(1)
  })

  it("returns zeros for an empty week without NaN", () => {
    const s = weekSummary([day("d1", 0, 0, false)], 2200, 150)
    expect(s).toEqual({ avgKcal: 0, avgProtein: 0, daysOnTarget: 0, loggedDays: 0 })
  })
})

describe("mealAccent", () => {
  it("maps known meal titles case-insensitively", () => {
    expect(mealAccent("Frukost", 0)).toBe("amber")
    expect(mealAccent("frukost med ägg", 3)).toBe("amber")
    expect(mealAccent("Lunch", 1)).toBe("emerald")
    expect(mealAccent("Middag", 2)).toBe("teal")
    expect(mealAccent("Mellanmål", 0)).toBe("orange")
  })

  it("cycles deterministically for unknown titles", () => {
    expect(mealAccent("Protein shake", 0)).toBe("emerald")
    expect(mealAccent("Protein shake", 1)).toBe("teal")
    expect(mealAccent("Protein shake", 4)).toBe("emerald")
  })
})

describe("mapOFFProduct", () => {
  it("maps a found product, preferring Swedish name", () => {
    const product = mapOFFProduct({
      status: 1,
      product: {
        product_name: "Milk",
        product_name_sv: "Mellanmjölk",
        brands: "Arla, Arla Ko",
        nutriments: { "energy-kcal_100g": 46, proteins_100g: 3.5, carbohydrates_100g: 4.8, fat_100g: 1.5 },
      },
    })
    expect(product).toEqual({ name: "Mellanmjölk", brand: "Arla", kcal_100g: 46, protein_100g: 3.5, carbs_100g: 4.8, fat_100g: 1.5 })
  })

  it("returns null when not found", () => {
    expect(mapOFFProduct({ status: 0 })).toBeNull()
  })

  it("leaves missing nutriments undefined", () => {
    const product = mapOFFProduct({
      status: 1,
      product: { product_name: "Okänd", nutriments: { "energy-kcal_100g": 100 } },
    })
    expect(product?.kcal_100g).toBe(100)
    expect(product?.protein_100g).toBeUndefined()
  })
})

describe("shiftDate", () => {
  it("shifts backward and forward across month boundaries", () => {
    expect(shiftDate("2026-07-01", -1)).toBe("2026-06-30")
    expect(shiftDate("2026-06-30", 1)).toBe("2026-07-01")
  })
})
