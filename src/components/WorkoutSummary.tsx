"use client";

import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Flame, Timer, Trophy } from "lucide-react";
import { useAppState } from "@/lib/store";
import {
  effectiveLoad,
  exerciseMetric,
  exerciseName,
  lastSetsForExercise,
  workoutStretchSeconds,
} from "@/lib/derive";
import { estimate1RM } from "@/lib/training";
import { weightUnitLabel } from "@/lib/nutrition";
import { mmss, plural, setLabel } from "@/lib/format";
import type { SetEntry, Workout } from "@/lib/types";

/**
 * A self-contained, screenshot-friendly recap of one workout. Rendered on the
 * finish screen and re-openable from history. Designed to look good as a
 * standalone image (solid surface, own branding, no surrounding chrome).
 */
export function WorkoutSummary({
  workout,
  live = false,
}: {
  workout: Workout;
  /** When true, show elapsed time (only meaningful right after finishing). */
  live?: boolean;
}) {
  const state = useAppState();
  const unit = weightUnitLabel(state.profile.units);

  const groups = useMemo(() => {
    const map = new Map<string, SetEntry[]>();
    workout.sets.forEach((s) => {
      const arr = map.get(s.exerciseId) ?? [];
      arr.push(s);
      map.set(s.exerciseId, arr);
    });
    return [...map.entries()];
  }, [workout.sets]);

  const volume = workout.sets.reduce(
    (a, s) => a + effectiveLoad(state, s.exerciseId, s.weightKg) * s.reps,
    0,
  );
  const stretchSec = workoutStretchSeconds(state, workout);

  // PRs: exercises whose best e1RM this session beats every prior session.
  const prs = useMemo(() => {
    const out: string[] = [];
    for (const [exId, sets] of groups) {
      const metric = exerciseMetric(state, exId);
      if (metric === "band" || metric === "time") continue;
      const best = Math.max(
        ...sets.map((s) => estimate1RM(effectiveLoad(state, exId, s.weightKg), s.reps)),
      );
      const prior = lastSetsForExercise(state, exId, workout.id);
      const priorBest = prior
        ? Math.max(
            ...prior.sets.map((s) =>
              estimate1RM(effectiveLoad(state, exId, s.weightKg), s.reps),
            ),
          )
        : 0;
      if (best > priorBest) out.push(exerciseName(state, exId));
    }
    return out;
  }, [groups, state, workout.id]);

  // Elapsed time is only meaningful right after finishing; read the clock in an
  // effect so render stays pure.
  const [elapsedMin, setElapsedMin] = useState<number | null>(null);
  useEffect(() => {
    if (!live) return;
    setElapsedMin(
      Math.max(
        1,
        Math.round((Date.now() - new Date(workout.startedAt).getTime()) / 60000),
      ),
    );
  }, [live, workout.startedAt]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Branded header */}
      <div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-ink">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary-ink/15">
            <Dumbbell size={18} strokeWidth={2.4} />
          </span>
          <span className="text-lg font-bold tracking-tight">Lift</span>
        </div>
        <span className="text-sm font-medium opacity-90">
          {new Date(workout.startedAt).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="p-5">
        {/* Top-line stats */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Sets" value={String(workout.sets.length)} />
          <Stat label="Exercises" value={String(groups.length)} />
          <Stat
            label={`Volume`}
            value={`${Math.round(volume).toLocaleString()}`}
            sub={unit}
          />
        </div>

        {(elapsedMin || stretchSec > 0) && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {elapsedMin && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 font-medium text-ink-soft">
                <Timer size={13} /> {elapsedMin} min
              </span>
            )}
            {stretchSec > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 font-medium text-ink-soft">
                <Flame size={13} /> {mmss(stretchSec)} mobility
              </span>
            )}
          </div>
        )}

        {prs.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2.5 text-sm">
            <Trophy size={16} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-primary">
              <span className="font-semibold">New best</span> ·{" "}
              {prs.join(", ")}
            </p>
          </div>
        )}

        {/* Per-exercise breakdown */}
        <ul className="space-y-2.5">
          {groups.map(([exId, sets]) => {
            const metric = exerciseMetric(state, exId);
            return (
              <li key={exId}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold">
                    {exerciseName(state, exId)}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {plural(sets.length, "set")}
                  </span>
                </div>
                <p className="tnum text-xs text-ink-soft">
                  {sets
                    .map((s) => {
                      const l = setLabel(s, metric);
                      return metric === "time" ? l : `${l}×${s.reps}`;
                    })
                    .join("  ·  ")}
                </p>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-center text-[0.7rem] text-muted">
          Logged with Lift
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-2 py-3">
      <p className="tnum text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted">
        {label}
        {sub ? ` (${sub})` : ""}
      </p>
    </div>
  );
}
