// Best-effort tap haptic. Two mechanisms, both progressive enhancements:
//   - navigator.vibrate — works on Android; iOS Safari never implemented it.
//   - the hidden `<input type="checkbox" switch>` toggle — the only way to get
//     haptics in iOS Safari/PWA (worked iOS 17.4–26.4; Apple patched it in
//     26.5, so it's a no-op on the newest iOS).
// Where neither works, this does nothing — callers never need to feature-check.

let hapticLabel: HTMLLabelElement | null = null

function ensureSwitch(): HTMLLabelElement | null {
  if (typeof document === "undefined") return null
  if (hapticLabel) return hapticLabel

  const hidden = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;"
  const input = document.createElement("input")
  input.type = "checkbox"
  input.setAttribute("switch", "") // iOS-only attribute that drives the haptic
  input.id = "__haptic_switch"
  input.style.cssText = hidden
  input.setAttribute("aria-hidden", "true")
  input.tabIndex = -1

  const label = document.createElement("label")
  label.htmlFor = "__haptic_switch"
  label.style.cssText = hidden
  label.setAttribute("aria-hidden", "true")

  document.body.appendChild(input)
  document.body.appendChild(label)
  hapticLabel = label
  return label
}

export function haptic() {
  try {
    navigator?.vibrate?.(8)
  } catch {
    /* not supported */
  }
  try {
    // Toggling the switch via its label fires the iOS system haptic.
    ensureSwitch()?.click()
  } catch {
    /* not supported */
  }
}
