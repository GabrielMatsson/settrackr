---
name: settrackr-design
description: SetTrackr's design system - UI tokens and animation conventions. Use whenever adding or editing UI in this project (new components, pages, cards, buttons, inputs, badges) or adding any animation/transition/micro-interaction, so everything stays consistent with the established minimal style and Motion conventions.
---

# SetTrackr Design System

Minimal, readable, Swedish-language UI. Animations are purposeful and subtle — they confirm actions and guide attention, never decorate. When in doubt: less.

## UI tokens (Tailwind)

| Element | Classes |
|---|---|
| Page background | `bg-gray-50 dark:bg-gray-950` — set in `DashboardShell.tsx`, never per page |
| Card | `bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card` + `p-5`/`p-6` |
| Card section header (tinted) | `bg-gray-50 dark:bg-gray-900` |
| Expanded workout table band | `border-t border-indigo-100 dark:border-gray-800 bg-indigo-50/50 dark:bg-gray-900/50`, rows `divide-indigo-100/60 dark:divide-gray-800` — indigo tint, not grey |
| Page h1 | `text-2xl font-bold text-gray-900 dark:text-white` (home greeting: `text-3xl`) |
| Input/select | `bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500` |
| Primary button | `bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg` |
| Secondary button | `border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20` |
| Error / success text | `text-red-500 dark:text-red-400` / `text-green-500 dark:text-green-400` |
| Difficulty badge | shared `client/app/components/DifficultyBadge.tsx` — never inline (light: `*-100` bg + `*-800` text + inset ring, medium is **amber** not yellow) |
| Progress ring | shared `client/app/components/ProgressRing.tsx` (`color` prop) |
| Page width | `max-w-4xl mx-auto w-full` (tracking 5xl, admin 2xl) |

**Food section (`/dashboard/foodtracking`) overrides**: emerald identity — cards `bg-white dark:bg-gray-900 border-emerald-100 dark:border-emerald-900/50 shadow-card`, primary `bg-emerald-600 hover:bg-emerald-500`, focus `focus:border-emerald-500`, rings `#10b981`/`#84cc16`, meal accents via `mealAccent()` in `lib/food-utils.ts`. The green gradient background is applied conditionally in `DashboardShell.tsx` — don't add backgrounds per-page.

**Color & depth**: `gray-*` is remapped to Tailwind's slate values in `globals.css` `@theme` — always write `gray-*` utilities, never `slate-*`. Light mode depth comes from three levels: tinted page (`bg-gray-50`) → white card + `shadow-card` (custom `--shadow-card` token in globals.css) → tinted band inside card (`bg-gray-50 dark:bg-gray-900`). Overlays/popovers/modals use `shadow-lg`/`shadow-xl` instead of `shadow-card`. Slate-400 hex for chart ticks is `#94a3b8`.

**Typography**: Geist Sans via `next/font` in `layout.tsx` (`--font-geist-sans`) — never reintroduce Arial/system font stacks.

Icons: lucide-react only, never emojis. All labels in Swedish. Weight in kg.

## Animation conventions (Motion — `motion/react`)

Global: `MotionConfig reducedMotion="user"` is set in `app/providers.tsx` — never add manual reduced-motion checks, and never remove that wrapper. (Sole exception: `AnimatedNumber` checks `useReducedMotion()` itself because imperative `animate()` isn't covered by MotionConfig.)

**All easings/springs/variants live in `client/lib/motion.ts`** — import from there (`easeOut`, `snappySpring`, `pressSpring`, `gentleSpring`, `popSpring`, `layoutSpring`, `accordionSpring`, `fadeUp`, `fadeUpTransition(i)`, `staggerDelay`). Never inline spring or easing literals in components.

| Pattern | Spec | Where it's used |
|---|---|---|
| Page enter (directional) | slide `x: ±24` + fade by navbar tab order (right tab enters from right); same-section navigation falls back to `y:8` fade; 0.25s `easeOut` | `app/dashboard/template.tsx` (covers all pages — don't duplicate per page) |
| List/section entrance stagger | `fadeUp` + `fadeUpTransition(i)` | DiaryClient meals, FoodStats tiles, tracking cards, statistics sections, profile sections |
| Count-up numbers | shared `client/app/components/AnimatedNumber.tsx` (0.9s `easeOut`, motion-value → DOM, optional `format`) | Home stats/XP, FoodStats tiles, diary totals, ProgressRing center, tracking sidebar, profile stats |
| Save confirmation | shared `client/app/components/SuccessCheck.tsx` — SVG `pathLength` draw-on (circle then check) | "Träningspasset är sparat!"-banner |
| Celebration (one-shot) | backdrop fade + card scale-in `0.85→1` with `popSpring` + trophy pop + `Sparkles` star burst (transform/opacity, ≤0.8s) | Level-up modal in `tracking/page.tsx` |
| Bar fill | `motion.div` `scaleX: 0→pct` with `origin-left` + `gentleSpring` — **never animate width** | XP bars (tracking banner, profile) |
| Expand/collapse | `AnimatePresence initial={false}` + `height: 0 ↔ "auto"` with `overflow-hidden`, `accordionSpring` | MealCard |
| Enter/exit blocks | `AnimatePresence` + fade/y, ~0.2–0.3s | MealBuilder, FoodEntryForm, save banner, level-up modal |
| Active-nav morph | `layoutId` pill (`nav-pill-desktop`/`nav-pill-mobile`), `snappySpring` | Navbar |
| Press feedback | `whileTap={{scale:0.98}}` (+ optional `whileHover={{scale:1.01}}`), `pressSpring` | Big CTAs only, not every button |
| Value animation | animate SVG `strokeDashoffset`, `gentleSpring` | ProgressRing, MyGoals rings |
| List reflow | `layout` prop on rows | MealBuilder item rows |
| Drag reorder | `Reorder.Group`/`Reorder.Item` with `dragListener={false}` + `useDragControls` started from the grip handle (`touch-none` on the grip), `whileDrag` scale 1.02 + shadow | Tracking plan lists (`DraggableRow` in `tracking/page.tsx`) |
| Toasts | `AnimatePresence initial={false}` + `layout` on items: spring in from right, fade/x out, siblings glide up | ToastContainer |
| Button press | shared `client/app/components/PressableButton.tsx` (`whileTap` 0.97 + `pressSpring`) on primary/secondary CTAs — tiny icon buttons stay plain | All main CTAs app-wide |
| Save morph | shared `client/app/components/SaveButton.tsx` — label ↔ "Sparar…" ↔ SuccessCheck crossfade, parent owns `status` | Profile settings save |
| Icon micro-motion (CSS) | button gets `group`; `Plus` icons `group-hover:rotate-90`, chevrons nudge `±translate-x-0.5`, scan icon `group-hover:scale-110`, all `transition-transform duration-200` | Ny måltid, day/week steppers, MealBuilder |
| Magnetic pull | weak cursor-follow (`useMotionValue`+`useSpring`, offset ×0.15 capped ±10 px), gated on `matchMedia("(hover: hover)")` — max ONE element per page | Home "Logga ett pass" CTA |
| State-driven scene | `KostMascot.tsx` / `GymMascot.tsx` — SVG character, mood from data thresholds, idle loops (breath/blink, `repeat: Infinity`, transform-only), tap reaction, pointer 3D tilt (`rotateX/Y` + `transformPerspective`, hover devices) | Kost diary (Avo, desktop right column); Home dashboard (Hasse, desktop right column, compact below CTA on mobile) |
| Cursor-follow eyes | `GymMascot.tsx` — pupils track global `mousemove`: ref-center offset → `useMotionValue`+`useSpring`, radial clamp ±2 SVG units, passive listener with cleanup, hover devices only (centered on touch), reset on document `mouseleave` | Home mascot (Hasse) |

Rules:
- **Transform/opacity only** (plus the height-auto accordion pattern and SVG stroke/pathLength). Never animate width/left/top/margin.
- Durations 0.2–0.3s for UI feedback (count-up 0.9s is the exception); springs for anything physical (expand, press, morph, drag).
- New entrance animations reuse `fadeUp`/`fadeUpTransition` — no new easings/durations without updating this file and `lib/motion.ts`.
- The hand-rolled SVG easter eggs (ChickenAnimation, GhostAnimation) stay as they are.
- 3D: avoid react-three-fiber (phone PWA battery/bundle cost). If a 3D-ish flourish is wanted, prefer CSS transforms or a single Rive asset gated to desktop.

For Motion API details beyond these patterns, the `motion-dev-animations` skill in this project has full reference and examples.
