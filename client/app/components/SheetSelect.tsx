"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import BottomSheet from "./BottomSheet"

export type SelectOption<T extends string | number> = { value: T; label: string }

type Props<T extends string | number> = {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  // Accessible name for the control + its option list.
  ariaLabel: string
  // Classes for the trigger button — pass the styling the old <select> had so
  // it drops in cleanly (boxed input, or the bare inline text style).
  triggerClassName: string
  // Show the chevron affordance on the trigger (default true). Turn off for the
  // inline text-style editors that already have their own affordance (a pencil).
  chevron?: boolean
  // Shown on the trigger when no option matches `value` (e.g. an empty "pick a
  // friend" state).
  placeholder?: string
  // Extra classes for the `relative inline-flex` wrapper (e.g. width).
  wrapperClassName?: string
}

export default function SheetSelect<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  triggerClassName,
  chevron = true,
  placeholder,
  wrapperClassName = "",
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const selectedRef = useRef<HTMLButtonElement>(null)

  const selected = options.find((o) => o.value === value)
  const label = selected?.label ?? placeholder ?? ""

  // Scroll the current selection into view whenever the list opens (mobile
  // sheet or desktop dropdown), so long lists like reps 1–30 don't open scrolled
  // to the top.
  useEffect(() => {
    if (open) selectedRef.current?.scrollIntoView({ block: "nearest" })
  }, [open])

  const list = (
    <div className="max-h-[60vh] overflow-y-auto py-1 sm:max-h-72">
      <ul role="listbox" aria-label={ariaLabel}>
        {options.map((o) => {
          const isSel = o.value === value
          return (
            <li key={String(o.value)}>
              <button
                type="button"
                role="option"
                aria-selected={isSel}
                ref={isSel ? selectedRef : undefined}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isSel
                    ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span>{o.label}</span>
                {isSel && <Check size={15} className="shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <span className={`relative inline-flex ${wrapperClassName}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={triggerClassName}
      >
        <span className={selected ? "" : "text-gray-400 dark:text-gray-500"}>{label}</span>
        {chevron && <ChevronDown size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />}
      </button>

      {open && (
        <BottomSheet
          onClose={() => setOpen(false)}
          title={ariaLabel}
          desktopAnchorClassName="absolute left-0 top-full z-30 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {list}
        </BottomSheet>
      )}
    </span>
  )
}
