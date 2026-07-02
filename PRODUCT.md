# Lift — PRODUCT

**What it is.** A private workout + nutrition tracker for a small friend group. Two halves share one profile: log lifts (sets, reps, weight, RPE/RIR) and track calories + macros against auto-calculated targets. No AI, no per-request cost — everything is deterministic math.

**Register.** Product (design serves the task). Mobile-first PWA, used one-handed at the gym.

**Who / where / mood.** A lifter standing at a rack, phone in one hand, mid-set, wanting to log fast and see last session's numbers. Also used at the kitchen table logging a meal. Fast, legible, unfussy — momentum over decoration.

**Primary surfaces.**
- **Home** — today's calorie ring + macro bars, today's training, weigh-in nudge.
- **Nutrition** — remaining kcal + macro rings, log food (manual, live macro→kcal), saved meals, macro-split calculator.
- **Train** — start/repeat/template a workout, exercise picker (search + custom), per-set logging with RPE/RIR + last-session hints, auto rest timer.
- **Progress** — bodyweight trend + weigh-ins, per-exercise estimated-1RM trend.
- **History** — browse past workouts in full detail.
- **Profile** — stats that drive targets, units, rest-timer default, install app, account.

**Non-negotiables.** Big tap targets, minimal typing, tabular numbers for weights/reps/calories, works in light and dark, targets always recompute from current stats (never stored stale).

**Stack.** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (auth + Postgres, Google OAuth) · deployed on Vercel.
