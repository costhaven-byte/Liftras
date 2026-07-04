"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  Dumbbell,
  Share2,
  Trash2,
} from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { WorkoutSummary } from "@/components/WorkoutSummary";
import { Button, Card, Sheet } from "@/components/ui";
import { useActions, useAppState } from "@/lib/store";
import {
  effectiveLoad,
  exerciseMetric,
  exerciseName,
} from "@/lib/derive";
import { estimate1RM } from "@/lib/training";
import { weightUnitLabel } from "@/lib/nutrition";
import { plural, setDetail, setLabel } from "@/lib/format";
import type { Workout } from "@/lib/types";

function WorkoutCard({ w }: { w: Workout }) {
  const state = useAppState();
  const { deleteWorkout } = useActions();
  const [open, setOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const unit = weightUnitLabel(state.profile.units);

  const byExercise = useMemo(() => {
    const map = new Map<string, typeof w.sets>();
    w.sets.forEach((s) => {
      const arr = map.get(s.exerciseId) ?? [];
      arr.push(s);
      map.set(s.exerciseId, arr);
    });
    return [...map.entries()];
  }, [w.sets]);

  const volume = w.sets.reduce(
    (a, s) => a + effectiveLoad(state, s.exerciseId, s.weightKg) * s.reps,
    0,
  );

  return (
    <Card className="!p-0 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          <p className="font-semibold">
            {new Date(w.startedAt).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="tnum text-xs text-muted">
            {plural(w.sets.length, "set")} ·{" "}
            {plural(byExercise.length, "exercise")} ·{" "}
            {Math.round(volume).toLocaleString()} {unit}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 text-muted transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3">
          <div className="space-y-4">
            {byExercise.map(([exId, sets]) => {
              const metric = exerciseMetric(state, exId);
              const scored = metric === "weight" || metric === "bodyweight";
              const best = scored
                ? Math.max(
                    ...sets.map((s) =>
                      estimate1RM(effectiveLoad(state, exId, s.weightKg), s.reps),
                    ),
                  )
                : 0;
              return (
                <div key={exId}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <p className="text-sm font-semibold">
                      {exerciseName(state, exId)}
                    </p>
                    {scored && (
                      <span className="tnum text-xs text-muted">
                        e1RM {best} {unit}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {sets.map((s, i) => (
                      <li
                        key={s.id}
                        className="tnum flex items-center justify-between rounded-md bg-surface-2 px-3 py-1.5 text-sm"
                      >
                        <span>
                          <span className="mr-2 text-muted">{i + 1}</span>
                          <span className="font-semibold">
                            {setLabel(s, metric)}
                          </span>
                          {setDetail(s, metric) && (
                            <>
                              <span className="text-muted"> × </span>
                              <span className="font-semibold">{s.reps}</span>
                            </>
                          )}
                        </span>
                        {metric !== "time" && (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium uppercase text-ink-soft">
                            {s.mode} {s.value}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setSummaryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary"
            >
              <Share2 size={13} /> View summary
            </button>
            <button
              onClick={() => deleteWorkout(w.id)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-danger"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}

      <Sheet
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Workout summary"
      >
        <WorkoutSummary workout={w} />
        <p className="mt-3 text-center text-xs text-muted">
          Screenshot to share 📸
        </p>
        <Button className="mt-3" size="lg" onClick={() => setSummaryOpen(false)}>
          Done
        </Button>
      </Sheet>
    </Card>
  );
}

function HistoryContent() {
  const state = useAppState();
  const workouts = state.workouts
    .filter((w) => w.sets.length > 0)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/train"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
          aria-label="Back to Train"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
      </div>

      {workouts.length === 0 ? (
        <Card className="!p-8 text-center">
          <Dumbbell className="mx-auto text-muted" size={22} />
          <p className="mt-2 text-sm text-muted">
            No completed workouts yet. Your logged sessions show up here.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {workouts.map((w) => (
            <li key={w.id}>
              <WorkoutCard w={w} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppGate>
      <HistoryContent />
    </AppGate>
  );
}
