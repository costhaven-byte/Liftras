"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { LineChart } from "@/components/LineChart";
import { Button, Card, IconButton, NumberInput, SectionTitle } from "@/components/ui";
import { useActions, useAppState, todayKey } from "@/lib/store";
import { displayWeight, lbToKg, weightUnitLabel } from "@/lib/nutrition";
import { estimate1RM } from "@/lib/training";
import { effectiveLoad, exerciseName, resolvedExercises } from "@/lib/derive";

function WeightSection() {
  const state = useAppState();
  const { addWeighIn, removeWeighIn } = useActions();
  const units = state.profile.units;
  const [val, setVal] = useState("");

  const points = state.weighIns.map((w, i) => ({
    x: i,
    y: +displayWeight(w.weightKg, units).toFixed(1),
  }));
  const current = state.weighIns[state.weighIns.length - 1];

  function submit() {
    const n = +val;
    if (!n) return;
    addWeighIn(todayKey(), units === "metric" ? n : lbToKg(n));
    setVal("");
  }

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <div>
          <SectionTitle>Bodyweight</SectionTitle>
          {current ? (
            <p className="tnum text-2xl font-bold">
              {displayWeight(current.weightKg, units).toFixed(1)}
              <span className="ml-1 text-sm font-medium text-muted">
                {weightUnitLabel(units)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted">No weigh-ins yet</p>
          )}
        </div>
      </div>

      {points.length > 1 && (
        <div className="mt-3">
          <LineChart points={points} color="var(--primary)" />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <NumberInput
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={`Today's weight (${weightUnitLabel(units)})`}
        />
        <Button onClick={submit} disabled={!val} className="!px-4">
          <Plus size={18} />
        </Button>
      </div>

      {state.weighIns.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {[...state.weighIns]
            .reverse()
            .slice(0, 5)
            .map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted">
                  {new Date(w.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tnum font-medium">
                    {displayWeight(w.weightKg, units).toFixed(1)}{" "}
                    {weightUnitLabel(units)}
                  </span>
                  <IconButton
                    label="Remove weigh-in"
                    tone="danger"
                    className="!h-8 !w-8"
                    onClick={() => removeWeighIn(w.id)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </span>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}

function StrengthSection() {
  const state = useAppState();
  const units = state.profile.units;

  // exercises that have any logged sets
  const logged = useMemo(() => {
    const ids = new Set<string>();
    state.workouts.forEach((w) => w.sets.forEach((s) => ids.add(s.exerciseId)));
    return resolvedExercises(state).filter((e) => ids.has(e.id));
  }, [state]);

  const [exId, setExId] = useState<string>("");
  const activeId = exId || logged[0]?.id || "";

  const series = useMemo(() => {
    if (!activeId) return [];
    const perDay: { date: string; best: number }[] = [];
    [...state.workouts]
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      .forEach((w) => {
        const sets = w.sets.filter((s) => s.exerciseId === activeId);
        if (!sets.length) return;
        const best = Math.max(
          ...sets.map((s) =>
            estimate1RM(effectiveLoad(state, activeId, s.weightKg), s.reps),
          ),
        );
        perDay.push({ date: w.date, best });
      });
    return perDay;
  }, [state, activeId]);

  const points = series.map((s, i) => ({
    x: i,
    y: +displayWeight(s.best, units).toFixed(1),
  }));

  if (logged.length === 0) {
    return (
      <Card className="!p-6 text-center">
        <TrendingUp className="mx-auto text-muted" size={22} />
        <p className="mt-2 text-sm text-muted">
          Log some workouts and your strength trends show up here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="!p-5">
      <SectionTitle>Estimated 1RM trend</SectionTitle>
      <select
        value={activeId}
        onChange={(e) => setExId(e.target.value)}
        className="mb-3 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm"
      >
        {logged.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <LineChart points={points} color="var(--accent)" />
      {series.length > 0 && (
        <p className="tnum mt-2 text-sm text-muted">
          Latest:{" "}
          <span className="font-semibold text-ink">
            {displayWeight(series[series.length - 1].best, units).toFixed(1)}{" "}
            {weightUnitLabel(units)}
          </span>{" "}
          est. 1RM on {exerciseName(state, activeId)}
        </p>
      )}
    </Card>
  );
}

function ProgressContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
      <WeightSection />
      <StrengthSection />
    </div>
  );
}

export default function Page() {
  return (
    <AppGate>
      <ProgressContent />
    </AppGate>
  );
}
