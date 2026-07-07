"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(hover: hover)"

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

// True on devices with a real pointer (desktop) — gates hover-only animations
// like magnetic pull and 3D tilt. False during SSR and on touch devices.
export function useHoverCapable() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
