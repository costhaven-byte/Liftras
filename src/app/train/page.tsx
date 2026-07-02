"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  Check,
  ChevronRight,
  Dumbbell,
  LayoutTemplate,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { ExercisePicker } from "@/components/ExercisePicker";
import { RestTimer } from "@/components/RestTimer";
import {
  Button,
  Card,
  IconButton,
  Input,
  NumberInput,
  SectionTitle,
  Segmented,
  Sheet,
} from "@/components/ui";
import { useActions, useAppState, todayKey } from "@/lib/store";
import {
  exerciseGroup,
  exerciseName,
  lastSetsForExercise,
} from "@/lib/derive";
import { EFFORT_ZONES, type IntensityMode } from "@/lib/training";
import { plural } from "@/lib/format";
import type { AppState } from "@/lib/types";

function SetLogger({
  workoutId,
  exerciseId,
  state,
  onLogged,
}: {
  workoutId: string;
  exerciseId: string;
  state: AppState;
  onLogged: () => void;
}) {
  const { addSet, removeSet } = useActions();
  const workout = state.workouts.find((w) => w.id === workoutId);
  const sets = workout?.sets.filter((s) => s.exerciseId === exerciseId) ?? [];
  const last = lastSetsForExercise(state, exerciseId, workoutId);

  const seed = sets[sets.length - 1] ?? last?.sets[last.sets.length - 1];
  const [weight, setWeight] = useState(seed ? String(seed.weightKg) : "");
  const [reps, setReps] = useState(seed ? String(seed.reps) : "");
  const [mode, setMode] = useState<IntensityMode>(seed?.mode ?? "rir");
  const [value, setValue] = useState(seed ? String(seed.value) : "2");

  const valid = +weight >= 0 && +reps > 0 && weight !== "" && reps !== "";

  function log() {
    addSet(workoutId, {
      exerciseId,
      weightKg: +weight,
      reps: +reps,
      mode,
      value: +value || 0,
    });
    onLogged();
  }

  return (
    <Card className="!p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">{exerciseName(state, exerciseId)}</p>
        <span className="text-xs text-muted">
          {exerciseGroup(state, exerciseId)}
        </span>
      </div>

      {last && (
        <p className="mb-2 text-xs text-muted">
          Last time: {last.sets.map((s) => `${s.weightKg}×${s.reps}`).join(", ")}
        </p>
      )}

      {sets.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {sets.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2 text-sm"
            >
              <span className="tnum">
                <span className="mr-2 text-muted">{i + 1}</span>
                <span className="font-semibold">{s.weightKg}</span>
                <span className="text-muted"> × </span>
                <span className="font-semibold">{s.reps}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium uppercase">
                  {s.mode} {s.value}
                </span>
                <IconButton
                  label={`Delete set ${i + 1}`}
                  tone="danger"
                  className="!h-8 !w-8"
                  onClick={() => removeSet(workoutId, s.id)}
                >
                  <X size={15} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">
            Weight ({state.profile.units === "metric" ? "kg" : "kg*"})
          </span>
          <NumberInput
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Reps</span>
          <NumberInput
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="0"
          />
        </label>
        <Button
          onClick={log}
          disabled={!valid}
          className="!h-11 !w-11 !px-0"
          aria-label="Log set"
        >
          <Check size={20} />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
        <Segmented
          value={mode}
          onChange={(m) => setMode(m as IntensityMode)}
          options={[
            { value: "rpe", label: "RPE" },
            { value: "rir", label: "RIR" },
          ]}
        />
        <NumberInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="!h-9 !w-16 text-center"
        />
      </div>
      <p className="mt-1.5 text-[0.7rem] text-muted">
        Suggested: {mode.toUpperCase()} for {reps && +reps <= 5 ? "heavy" : "these"}{" "}
        reps · {EFFORT_ZONES.hypertrophy.label.toLowerCase()}{" "}
        {mode === "rpe" ? EFFORT_ZONES.hypertrophy.rpe : EFFORT_ZONES.hypertrophy.rir}
      </p>
    </Card>
  );
}

function SaveTemplateSheet({
  open,
  onClose,
  exerciseIds,
}: {
  open: boolean;
  onClose: () => void;
  exerciseIds: string[];
}) {
  const { saveTemplate } = useActions();
  const [name, setName] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="Save as template">
      <p className="mb-4 text-sm text-muted">
        Save these {exerciseIds.length} exercises as a routine you can start with
        one tap.
      </p>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Push Day A"
        autoFocus
      />
      <Button
        size="lg"
        className="mt-4"
        disabled={!name.trim()}
        onClick={() => {
          saveTemplate(name.trim(), exerciseIds);
          setName("");
          onClose();
        }}
      >
        Save template
      </Button>
    </Sheet>
  );
}

function TrainContent() {
  const state = useAppState();
  const { startWorkout, deleteWorkout, deleteTemplate } = useActions();
  const today = todayKey();

  const todayWorkout = state.workouts.find((w) => w.date === today);
  const recent = state.workouts
    .filter((w) => w.date !== today && w.sets.length > 0)
    .slice(0, 3);
  const lastWorkout = state.workouts.find((w) => w.sets.length > 0);

  const [localAdded, setLocalAdded] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [restRun, setRestRun] = useState(0);

  const exerciseIds = useMemo(() => {
    const fromSets = todayWorkout
      ? [...new Set(todayWorkout.sets.map((s) => s.exerciseId))]
      : [];
    const merged = [...fromSets];
    for (const id of localAdded) if (!merged.includes(id)) merged.push(id);
    return merged;
  }, [todayWorkout, localAdded]);

  function begin(exerciseSeed: string[] = []) {
    startWorkout(today, new Date().toISOString());
    setLocalAdded(exerciseSeed);
  }

  // ---- Start screen ----
  if (!todayWorkout) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Train</h1>

        <Card className="!p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <Dumbbell size={26} />
          </span>
          <p className="mt-3 font-semibold">Ready to lift?</p>
          <p className="mt-1 text-sm text-muted">
            Start fresh or repeat your last session.
          </p>
          <div className="mt-5 space-y-2">
            <Button size="lg" onClick={() => begin()}>
              <Plus size={18} /> Start empty workout
            </Button>
            {lastWorkout && (
              <Button
                size="lg"
                variant="soft"
                onClick={() =>
                  begin([...new Set(lastWorkout.sets.map((s) => s.exerciseId))])
                }
              >
                <Repeat size={18} /> Repeat last workout
              </Button>
            )}
          </div>
        </Card>

        {state.templates.length > 0 && (
          <div>
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <LayoutTemplate size={14} /> Templates
              </span>
            </SectionTitle>
            <ul className="space-y-2">
              {state.templates.map((t) => (
                <li key={t.id}>
                  <Card className="flex items-center justify-between !py-3">
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => begin(t.exerciseIds)}
                    >
                      <p className="truncate font-semibold">{t.name}</p>
                      <p className="truncate text-xs text-muted">
                        {t.exerciseIds
                          .map((id) => exerciseName(state, id))
                          .join(" · ")}
                      </p>
                    </button>
                    <div className="ml-2 flex items-center gap-1">
                      <Button
                        variant="soft"
                        className="!h-9 !px-3"
                        onClick={() => begin(t.exerciseIds)}
                      >
                        Start
                      </Button>
                      <IconButton
                        label={`Delete ${t.name} template`}
                        tone="danger"
                        onClick={() => deleteTemplate(t.id)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recent.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted">
                Recent workouts
              </h2>
              <Link
                href="/history"
                className="flex items-center text-xs font-medium text-primary"
              >
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <ul className="space-y-2">
              {recent.map((w) => (
                <li key={w.id}>
                  <Link href="/history" className="focus-ring block">
                    <Card className="!py-3 transition-colors hover:border-border-strong">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {new Date(w.startedAt).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <span className="text-xs text-muted">
                          {plural(w.sets.length, "set")}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted">
                        {[...new Set(w.sets.map((s) => s.exerciseId))]
                          .map((id) => exerciseName(state, id))
                          .join(" · ")}
                      </p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ---- Active workout ----
  const totalSets = todayWorkout.sets.length;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout</h1>
          <p className="tnum text-sm text-muted">
            {plural(totalSets, "set")} · {plural(exerciseIds.length, "exercise")}
          </p>
        </div>
        <button
          onClick={() => {
            if (todayWorkout.sets.length === 0) {
              deleteWorkout(todayWorkout.id);
              setLocalAdded([]);
            }
          }}
          className="text-sm text-muted disabled:opacity-40"
          disabled={todayWorkout.sets.length > 0}
        >
          {todayWorkout.sets.length === 0 ? "Cancel" : ""}
        </button>
      </div>

      {exerciseIds.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          Add your first exercise to begin logging sets.
        </p>
      )}

      <div className="space-y-3">
        {exerciseIds.map((id) => (
          <SetLogger
            key={id}
            workoutId={todayWorkout.id}
            exerciseId={id}
            state={state}
            onLogged={() => setRestRun((n) => n + 1)}
          />
        ))}
      </div>

      <Button size="lg" variant="soft" onClick={() => setPickerOpen(true)}>
        <Plus size={18} /> Add exercise
      </Button>

      {exerciseIds.length > 0 && (
        <Button
          size="lg"
          variant="ghost"
          onClick={() => setSaveTplOpen(true)}
        >
          <BookmarkPlus size={18} /> Save as template
        </Button>
      )}

      {totalSets > 0 && (
        <Button
          size="lg"
          variant="ghost"
          onClick={() => setLocalAdded([])}
          className="!text-success"
        >
          <Check size={18} /> Finish workout
        </Button>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id) =>
          setLocalAdded((prev) => (prev.includes(id) ? prev : [...prev, id]))
        }
      />
      <SaveTemplateSheet
        open={saveTplOpen}
        onClose={() => setSaveTplOpen(false)}
        exerciseIds={exerciseIds}
      />
      <RestTimer runId={restRun} seconds={state.profile.restTimerSec} />
    </div>
  );
}

export default function Page() {
  return (
    <AppGate>
      <TrainContent />
    </AppGate>
  );
}
