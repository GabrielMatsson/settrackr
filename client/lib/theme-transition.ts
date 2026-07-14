// Native View Transitions API: reveal the new theme with a circular wipe from
// the point the user tapped — the delightful iOS-style theme flip. Degrades to
// an instant switch where the API is missing (older Safari) or the user prefers
// reduced motion.

export function applyThemeWithReveal(x: number, y: number, apply: () => void) {
  // Feature-detect without leaning on a specific lib.dom version.
  const startViewTransition = (
    document as unknown as {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> }
    }
  ).startViewTransition?.bind(document)

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (!startViewTransition || reduce) {
    apply()
    return
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = startViewTransition(apply)
  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 400,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  })
}
