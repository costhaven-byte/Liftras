"use client";

import { Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/store";

export function SignIn() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-6">
      <div className="w-full text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-ink shadow-[var(--shadow-md)]">
          <Dumbbell size={32} strokeWidth={2.4} />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Lift</h1>
        <p className="mx-auto mt-2 max-w-[16rem] text-sm text-muted text-pretty">
          Track your workouts, sets, RPE &amp; RIR, and your calorie &amp; macro
          targets — all in one place.
        </p>

        <button
          onClick={signInWithGoogle}
          className="mx-auto mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-md border border-border bg-surface font-semibold text-ink shadow-[var(--shadow-sm)] transition-all hover:border-border-strong active:scale-[0.98]"
        >
          <GoogleMark />
          Continue with Google
        </button>
        <p className="mt-4 text-xs text-muted">
          Your data syncs privately to your account.
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C39.9 40 44 33 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
