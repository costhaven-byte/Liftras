"use client";

import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth, useSelector } from "@/lib/store";
import { AppShell } from "./AppShell";
import { Onboarding } from "./Onboarding";
import { SignIn } from "./SignIn";
import { SetupNeeded } from "./SetupNeeded";
import { useHydrated } from "./ui";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-label="Loading"
      />
    </div>
  );
}

export function AppGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const { status } = useAuth();
  const onboarded = useSelector((s) => s.profile.onboarded);

  if (!hydrated) return <Splash />;
  if (!isSupabaseConfigured) return <SetupNeeded />;
  if (status === "loading") return <Splash />;
  if (status === "signedOut") return <SignIn />;
  if (!onboarded) return <Onboarding />;
  return <AppShell>{children}</AppShell>;
}
