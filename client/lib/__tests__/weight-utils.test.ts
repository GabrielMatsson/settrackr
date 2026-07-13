import { goalDirection, makeBodyweightResolver, effectiveWeight, kcalRingColor } from "../weight-utils"

describe("goalDirection", () => {
  it("maps modes to directions", () => {
    expect(goalDirection("bulk")).toBe("surplus")
    expect(goalDirection("deff")).toBe("deficit")
    expect(goalDirection("maintain")).toBe("maintain")
  })

  it("is none when unset or unknown", () => {
    expect(goalDirection(null)).toBe("none")
    expect(goalDirection(undefined)).toBe("none")
    expect(goalDirection("cut")).toBe("none")
  })
})

describe("makeBodyweightResolver", () => {
  const entries = [
    { date: "2026-07-01", weight_kg: 80 },
    { date: "2026-06-01", weight_kg: 78 }, // unsorted on purpose
    { date: "2026-06-15", weight_kg: 79 },
  ]
  const resolve = makeBodyweightResolver(entries)

  it("returns the latest entry on/before the date", () => {
    expect(resolve("2026-06-15")).toBe(79)
    expect(resolve("2026-06-20")).toBe(79)
    expect(resolve("2026-07-10")).toBe(80)
  })

  it("falls back to the earliest entry for dates before all data", () => {
    expect(resolve("2026-05-01")).toBe(78)
  })

  it("returns null with no entries", () => {
    expect(makeBodyweightResolver([])("2026-07-01")).toBeNull()
  })
})

describe("effectiveWeight", () => {
  const resolve = makeBodyweightResolver([{ date: "2026-07-01", weight_kg: 80 }])

  it("adds body weight for bodyweight exercises", () => {
    expect(effectiveWeight({ weight: 10, is_bodyweight: true }, "2026-07-05", resolve)).toBe(90)
    expect(effectiveWeight({ weight: 0, is_bodyweight: true }, "2026-07-05", resolve)).toBe(80)
  })

  it("uses raw kg for normal exercises", () => {
    expect(effectiveWeight({ weight: 100 }, "2026-07-05", resolve)).toBe(100)
    expect(effectiveWeight({ weight: 100, is_bodyweight: false }, "2026-07-05", resolve)).toBe(100)
  })

  it("falls back to extra kg only when no weight is logged", () => {
    const empty = makeBodyweightResolver([])
    expect(effectiveWeight({ weight: 10, is_bodyweight: true }, "2026-07-05", empty)).toBe(10)
  })
})

describe("kcalRingColor", () => {
  it("deficit: green at/under target, amber slightly over, rose clearly over", () => {
    expect(kcalRingColor(80, "deficit")).toBe("#10b981")
    expect(kcalRingColor(100, "deficit")).toBe("#10b981")
    expect(kcalRingColor(108, "deficit")).toBe("#f59e0b")
    expect(kcalRingColor(120, "deficit")).toBe("#f43f5e")
  })

  it("surplus: green at/over target, amber approaching, rose far under", () => {
    expect(kcalRingColor(50, "surplus")).toBe("#f43f5e")
    expect(kcalRingColor(95, "surplus")).toBe("#f59e0b")
    expect(kcalRingColor(105, "surplus")).toBe("#10b981")
    expect(kcalRingColor(120, "surplus")).toBe("#f59e0b")
  })

  it("maintain: green near target, amber slightly off, rose far off", () => {
    expect(kcalRingColor(100, "maintain")).toBe("#10b981")
    expect(kcalRingColor(108, "maintain")).toBe("#f59e0b")
    expect(kcalRingColor(120, "maintain")).toBe("#f43f5e")
    expect(kcalRingColor(70, "maintain")).toBe("#f43f5e")
  })

  it("none: neutral indigo regardless of percent", () => {
    expect(kcalRingColor(50, "none")).toBe("#6366f1")
    expect(kcalRingColor(150, "none")).toBe("#6366f1")
  })
})
