"use client";

import Link from "next/link";
import { ChevronRight, Dumbbell, Plus, Scale } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { ProgressRing } from "@/components/ProgressRing";
import { Button, Card } from "@/components/ui";
import { useAppState, todayKey } from "@/lib/store";
import { exerciseName, foodForDay, sumMacros, targetsFor } from "@/lib/derive";
import { plural } from "@/lib/format";

function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="tnum text-muted">
          {Math.round(value)} / {target}g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: "width 0.6s var(--ease-out-expo)",
          }}
        />
      </div>
    </div>
  );
}

function HomeContent() {
  const state = useAppState();
  const today = todayKey();
  const targets = targetsFor(state.profile);
  const eaten = sumMacros(foodForDay(state, today));
  const remaining = Math.max(0, targets.macros.kcal - eaten.kcal);

  const todaysWorkout = state.workouts.find((w) => w.date === today);
  const lastWeighIn = state.weighIns[state.weighIns.length - 1];
  const daysSinceWeighIn = lastWeighIn
    ? Math.floor((Date.now() - new Date(lastWeighIn.date).getTime()) / 86400000)
    : Infinity;

  const first = state.profile.name.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{greet},</p>
        <h1 className="text-2xl font-bold tracking-tight">{first}</h1>
      </div>

      {/* Nutrition summary */}
      <Card className="!p-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={eaten.kcal}
            max={targets.macros.kcal}
            size={104}
            stroke={11}
            color="var(--kcal)"
          >
            <div>
              <span className="tnum block text-2xl font-bold leading-none">
                {remaining.toLocaleString()}
              </span>
              <span className="text-[0.7rem] text-muted">kcal left</span>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-2.5">
            <MacroBar
              label="Protein"
              value={eaten.protein}
              target={targets.macros.protein}
              color="var(--protein)"
            />
            <MacroBar
              label="Carbs"
              value={eaten.carbs}
              target={targets.macros.carbs}
              color="var(--carbs)"
            />
            <MacroBar
              label="Fat"
              value={eaten.fat}
              target={targets.macros.fat}
              color="var(--fat)"
            />
          </div>
        </div>
        <Link href="/nutrition" className="mt-4 block">
          <Button variant="soft" size="lg">
            <Plus size={18} /> Log food
          </Button>
        </Link>
      </Card>

      {/* Training */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">
            Today&apos;s training
          </h2>
          <span className="text-xs text-muted">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {todaysWorkout && todaysWorkout.sets.length > 0 ? (
          <Link href="/train" className="focus-ring block">
            <Card className="transition-colors hover:border-border-strong">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Workout in progress</p>
                  <p className="text-sm text-muted">
                    {plural(todaysWorkout.sets.length, "set")} ·{" "}
                    {plural(
                      new Set(todaysWorkout.sets.map((s) => s.exerciseId)).size,
                      "exercise",
                    )}
                  </p>
                </div>
                <Dumbbell className="text-primary" size={24} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...new Set(todaysWorkout.sets.map((s) => s.exerciseId))]
                  .slice(0, 4)
                  .map((id) => (
                    <span
                      key={id}
                      className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-soft"
                    >
                      {exerciseName(state, id)}
                    </span>
                  ))}
              </div>
            </Card>
          </Link>
        ) : (
          <Link href="/train" className="focus-ring block">
            <Card className="flex items-center justify-between transition-colors hover:border-border-strong">
              <div>
                <p className="font-semibold">Start a workout</p>
                <p className="text-sm text-muted">
                  Log sets, reps, RPE &amp; RIR
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-ink">
                <Plus size={22} />
              </span>
            </Card>
          </Link>
        )}
      </div>

      {/* Weigh-in nudge */}
      {daysSinceWeighIn >= 7 && (
        <Link href="/progress" className="focus-ring block">
          <Card className="flex items-center gap-3 border-accent/40 bg-accent/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
              <Scale size={20} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Time for a weigh-in</p>
              <p className="text-xs text-ink-soft">
                Keeps your targets accurate as you progress.
              </p>
            </div>
            <ChevronRight className="text-muted" size={18} />
          </Card>
        </Link>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppGate>
      <HomeContent />
    </AppGate>
  );
}
