# Lift — workout & nutrition tracker

A private, mobile-first PWA for tracking workouts (sets, reps, weight, RPE/RIR) and
nutrition (calorie + macro targets, food logging). Next.js + Supabase, no AI, no
per-request cost — all targets are deterministic math.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind v4
- **Supabase** — auth (Google OAuth) + Postgres, with per-user Row Level Security
- Installable **PWA** (offline app-shell via service worker)

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Requires a `.env.local` with your Supabase keys (see below).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run `supabase/schema.sql`, then `supabase/migrations/002_extras.sql`.
3. **Authentication → Providers → Google**: enable it, and follow the two-part
   Google Cloud OAuth setup (create an OAuth client, paste the Client ID/secret,
   and copy Supabase's callback URL into Google's authorized redirect URIs).
4. **Project Settings → API**: copy the Project URL and `anon` public key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## Deploy (Vercel)

1. Push this repo to GitHub, then **Import** it at [vercel.com/new](https://vercel.com/new)
   (framework auto-detects as Next.js).
2. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
3. Deploy. Then wire the production domain into auth:
   - **Supabase → Authentication → URL Configuration**: set **Site URL** to your
     Vercel domain and add it to **Redirect URLs**.
   - **Google Cloud → OAuth consent screen**: publish it (or add friends as Test
     users) so they can sign in. The Supabase callback URL in Google's redirect
     URIs does not change.

## Project structure

```
src/
  app/            routes: / (home), /nutrition, /train, /progress, /history, /profile
  components/     AppShell, AppGate, SignIn, Onboarding, ExercisePicker, RestTimer, ui, …
  lib/            nutrition (BMR/TDEE/macros), training (RPE/RIR), exercises, store (Supabase), …
supabase/         schema.sql + migrations
```

See `PRODUCT.md` and `DESIGN.md` for product intent and the design system.
