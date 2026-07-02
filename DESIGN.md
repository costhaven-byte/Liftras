# Lift — DESIGN

Source of truth is `src/app/globals.css` (Tailwind v4 `@theme`). This documents intent.

**Color strategy: Committed.** A real deep violet carries weight — not a lavender-tinted near-white with a purple button (the AI-gym tell). True-white surfaces in light; violet-tinted near-black in dark. High-contrast ink (never gray-on-tint body text). One warm amber accent, reserved for achievements/nudges (weigh-in, custom-exercise badge). All colors OKLCH.

**Token roles** (`--` vars, mapped to Tailwind `bg-*`/`text-*`):
- Surfaces: `bg`, `surface`, `surface-2`; lines: `border`, `border-strong`.
- Ink: `ink`, `ink-soft`, `muted`.
- Brand: `primary`, `primary-hover`, `primary-soft`, `primary-ink`.
- Accent: `accent`, `accent-ink`. Status: `success`, `danger`.
- Macro roles (charts/rings): `kcal` (violet), `protein` (teal), `carbs` (amber), `fat` (rose).
- Radii `--radius`/`--radius-sm`; shadows `--shadow-sm/md/lg`; easings `--ease-out-quart/expo`.

**Dark mode.** Class-based (`.dark` on `<html>`), no-flash inline script in `layout.tsx`, user toggle in header. Every token has a dark value.

**Type.** Geist (one family, multiple weights). Bold tracking-tight headings; `.tnum` (tabular figures) on all weights/reps/calories/macros so numbers don't jitter.

**Components** (`src/components/`): `ui.tsx` (Button, Card, Field, Input, NumberInput, Segmented, Sheet, `IconButton`, `useHydrated`), `ProgressRing`, `LineChart`, `AppShell` (sticky header + 5-tab bottom nav), `RestTimer`, `ExercisePicker`, `PWA`.

**Accessibility / interaction patterns.**
- Keyboard focus: `.focus-ring` utility (globals.css) on every non-`<Button>` interactive element — nav tabs, clickable card `<Link>`s, `IconButton`, Segmented options. `<Button>` has its own `focus-visible` ring.
- Icon-only actions use `IconButton` (40px target, `!h-8 !w-8` for dense rows; `tone="danger"` for destructive) — never bare `<button>` around an icon.
- `Sheet` closes on Escape + backdrop tap, locks body scroll while open, `role="dialog"`.
- Muted text (`--muted`) is tuned to clear WCAG AA on small text; don't lighten it for "elegance". Never gray-on-color — tinted chips use a solid accent bg with `*-ink` foreground (see home weigh-in nudge).

**Layout rules learned here.**
- Never place a fixed row of rings/chips beside a wide text block — it overflows narrow phones. Put repeated stats in a `grid-cols-N` that reflows (see Nutrition summary + Profile daily-targets).
- Truncating text needs `min-w-0 flex-1` on the shrinking child and `shrink-0` on the sibling.
- Pluralize counts (`lib/format.ts` `plural()`), never "1 sets".
- Test copy at 360px, not just 375 — the viewport is part of the design.

**Motion.** Purposeful only: ring/bar fills ease-out-expo, rest-timer countdown, sheet slide-up, tap `active:scale`. `prefers-reduced-motion` honored globally in `globals.css`.
