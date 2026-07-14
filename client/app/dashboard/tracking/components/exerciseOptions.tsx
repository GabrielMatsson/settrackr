import type { SelectOption } from "@/app/components/SheetSelect"

// Shared option data for the sets/reps SheetSelects across the tracking flow.
export const SET_OPTIONS: SelectOption<number>[] = Array.from(
  { length: 10 },
  (_, i) => ({ value: i + 1, label: `${i + 1} set` })
)

export const REP_OPTIONS: SelectOption<number>[] = Array.from(
  { length: 30 },
  (_, i) => ({ value: i + 1, label: `${i + 1} reps` })
)
