import { getTotalLyft, estimate1RM, getOverallDifficulty, hasChickenLegs, isGymGhost } from "../workout-utils"

const ex = (overrides: Partial<{ name: string; sets: number; reps: number; weight: number; difficulty: string }> = {}) => ({
  name: "Squat", sets: 3, reps: 10, weight: 100, difficulty: "medium", ...overrides,
})

test("getTotalLyft: returns dash when all weights are zero", () => {
  expect(getTotalLyft([ex({ weight: 0 })])).toBe("–")
})
test("getTotalLyft: calculates sets * reps * weight sum", () => {
  const result = getTotalLyft([ex({ sets: 3, reps: 10, weight: 100 })])
  expect(result).toBe("3 000 kg")
})
test("getTotalLyft: sums multiple exercises", () => {
  const exercises = [ex({ sets: 1, reps: 1, weight: 50 }), ex({ sets: 1, reps: 1, weight: 50 })]
  expect(getTotalLyft(exercises)).toBe("100 kg")
})

test("estimate1RM: returns dash for zero weight", () => {
  expect(estimate1RM(0, 10)).toBe("–")
})
test("estimate1RM: returns dash for zero reps", () => {
  expect(estimate1RM(100, 0)).toBe("–")
})
test("estimate1RM: rounds to nearest 0.5 kg", () => {
  expect(estimate1RM(100, 10)).toBe("133.5 kg")
})

test("getOverallDifficulty: any hard exercise returns Tufft", () => {
  expect(getOverallDifficulty([ex({ difficulty: "hard" })]).label).toBe("Tufft")
})
test("getOverallDifficulty: all easy returns Lätt", () => {
  expect(getOverallDifficulty([ex({ difficulty: "easy" }), ex({ difficulty: "easy" })]).label).toBe("Lätt")
})
test("getOverallDifficulty: mixed returns Medium", () => {
  expect(getOverallDifficulty([ex({ difficulty: "easy" }), ex({ difficulty: "medium" })]).label).toBe("Medium")
})
