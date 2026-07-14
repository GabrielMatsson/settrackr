"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Drawer } from "vaul"

// Responsive modal shell: on phones it renders as a swipeable vaul bottom
// sheet (the installed-PWA idiom); on larger screens it keeps the app's
// centered dialog. Callers mount it conditionally and pass `onClose` — the
// sheet plays its exit animation before onClose fires, so the parent can
// unmount immediately on close without cutting the animation.
//
// Children own their padding and scrolling (use `flex-1 overflow-y-auto` for
// a scrollable region); the shell provides background, rounding, shadow and
// the max-height cap.

type Props = {
  onClose: () => void
  // Accessible dialog name (visually hidden — render your own visible header)
  title: string
  // Width class for the centered desktop dialog, e.g. "max-w-md" / "max-w-lg"
  desktopClassName?: string
  // For small anchored menus/popovers: when set, the DESKTOP rendering is an
  // in-place dropdown with these classes (no full-screen backdrop) instead of a
  // centered dialog — the caller keeps its own `relative` parent and
  // outside-click handling. Mobile is always a sheet regardless.
  desktopAnchorClassName?: string
  children: ReactNode
}

export default function BottomSheet({ onClose, title, desktopClassName = "max-w-md", desktopAnchorClassName, children }: Props) {
  // Decided once per mount — sheets are short-lived, no need to track resize.
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
  )
  // Starts closed and flips open on the next frame so vaul animates the sheet
  // in even though callers conditionally mount this component. The rAF (rather
  // than a bare setState in the effect) both defers past the initial paint so
  // the transition actually runs, and keeps the state change out of the effect
  // body for the react-hooks lint.
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Desktop dialog: close on Escape (vaul handles this itself on mobile).
  useEffect(() => {
    if (isMobile) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isMobile, onClose])

  if (isMobile) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={(o) => {
          if (!o) setOpen(false)
        }}
        onAnimationEnd={(o) => {
          if (!o) onClose()
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-xl outline-none dark:bg-gray-900"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div
              className="mx-auto mb-1 mt-3 h-1.5 w-10 shrink-0 rounded-full bg-gray-300 dark:bg-gray-700"
              aria-hidden
            />
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            <Drawer.Description className="sr-only">{title}</Drawer.Description>
            {children}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  // Desktop, anchored variant: render the dropdown in place. No backdrop — the
  // caller's own relative container + outside-click logic positions and closes it.
  if (desktopAnchorClassName) {
    return <div className={desktopAnchorClassName}>{children}</div>
  }

  // Desktop, default variant: centered dialog.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[85vh] w-full flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-900 ${desktopClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
