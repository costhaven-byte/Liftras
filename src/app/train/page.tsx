"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  Check,
  ChevronRight,
  Dumbbell,
  LayoutTemplate,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { ExercisePicker } from "@/components/ExercisePicker";
import { RestTimer } from "@/components/RestTimer";
import { WorkoutSummary } from "@/components/WorkoutSummary";
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
  exerciseDefaultSec,
  exerciseGroup,
  exerciseMetric,
  exerciseName,
  lastSetsForExercise,
} from "@/lib/derive";
import { BAND_LEVELS, EFFORT_ZONES, type IntensityMode } from "@/lib/training";
import { mmss, plural, setDetail, setLabel } from "@/lib/format";
import type { AppState } from "@/lib/types";

/**
 * Inline countdown for timed movements. Vibrates when it reaches zero.
 * Re-key from the parent (`key={targetSec}`) to re-arm when the target changes.
 */
function HoldTimer({ targetSec }: { targetSec: number }) {
  const [remaining, setRemaining] = useState(targetSec);
  const [running, setRunning] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          if (!firedRef.current) {
            firedRef.current = true;
            try {
              navigator.vibrate?.([120, 60, 120]);
            } catch {}
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="mb-2 flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2">
      <span className="tnum text-2xl font-bold tabular-nums">
        {mmss(remaining)}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <IconButton
          label={running ? "Pause hold" : "Start hold"}
          className="!h-9 !w-9"
          onClick={() => {
            if (!running && remaining === 0) setRemaining(targetSec);
            setRunning((v) => !v);
            firedRef.current = false;
          }}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
        </IconButton>
        <IconButton
          label="Reset hold"
          className="!h-9 !w-9"
          onClick={() => {
            setRunning(false);
            setRemaining(targetSec);
            firedRef.current = false;
          }}
        >
          <RotateCcw size={16} />
        </IconButton>
      </div>
    </div>
  );
}

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
  const metric = exerciseMetric(state, exerciseId);
  const bodyweight = metric === "bodyweight";
  const isBand = metric === "band";
  const isTimed = metric === "time";

  const seed = sets[sets.length - 1] ?? last?.sets[last.sets.length - 1];
  // For bodyweight, an added weight of 0 should show as empty (placeholder "BW").
  const seedWeight =
    seed && !(bodyweight && seed.weightKg === 0) ? String(seed.weightKg) : "";
  const [weight, setWeight] = useState(seedWeight);
  const [reps, setReps] = useState(seed && seed.reps > 0 ? String(seed.reps) : "");
  const [mode, setMode] = useState<IntensityMode>(seed?.mode ?? "rir");
  const [value, setValue] = useState(seed ? String(seed.value) : "2");
  const [level, setLevel] = useState<string>(seed?.band ?? "Medium");
  const [dur, setDur] = useState(
    String(seed?.durationSec ?? exerciseDefaultSec(state, exerciseId)),
  );

  const added = weight === "" ? 0 : +weight;
  const weightValid = bodyweight
    ? weight === "" || !Number.isNaN(+weight)
    : weight !== "" && +weight >= 0;

  const valid = isTimed
    ? dur !== "" && +dur > 0
    : isBand
      ? reps !== "" && +reps > 0
      : weightValid && reps !== "" && +reps > 0;

  function bump(delta: number) {
    setValue((v) => String(Math.max(0, Math.min(10, (+v || 0) + delta))));
  }

  function log() {
    if (isTimed) {
      addSet(workoutId, {
        exerciseId,
        weightKg: 0,
        reps: 0,
        mode,
        value: 0,
        durationSec: +dur,
      });
    } else if (isBand) {
      addSet(workoutId, {
        exerciseId,
        weightKg: 0,
        reps: +reps,
        mode,
        value: +value || 0,
        band: level,
      });
    } else {
      addSet(workoutId, {
        exerciseId,
        weightKg: bodyweight ? added : +weight,
        reps: +reps,
        mode,
        value: +value || 0,
      });
    }
    onLogged();
  }

  const tag = isBand ? "Band" : isTimed ? "Timed" : bodyweight ? "Bodyweight" : null;

  return (
    <Card className="!p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-semibold">
          {exerciseName(state, exerciseId)}
        </p>
        <span className="flex shrink-0 items-center gap-1.5">
          {tag && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.65rem] font-semibold text-ink-soft">
              {tag}
            </span>
          )}
          <span className="text-xs text-muted">
            {exerciseGroup(state, exerciseId)}
          </span>
        </span>
      </div>

      {last && (
        <p className="mb-2 text-xs text-muted">
          Last time:{" "}
          {last.sets
            .map((s) => {
              const l = setLabel(s, metric);
              const d = setDetail(s, metric);
              return d ? `${l}${d.replace("× ", "×")}` : l;
            })
            .join(", ")}
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
                <span className="font-semibold">{setLabel(s, metric)}</span>
                {setDetail(s, metric) && (
                  <>
                    <span className="text-muted"> × </span>
                    <span className="font-semibold">{s.reps}</span>
                  </>
                )}
              </span>
              <div className="flex items-center gap-2">
                {!isTimed && (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium uppercase">
                    {s.mode} {s.value}
                  </span>
                )}
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

      {/* ---- Timed movement ---- */}
      {isTimed ? (
        <>
          <HoldTimer key={+dur || 0} targetSec={Math.max(1, +dur || 0)} />
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Hold (seconds)</span>
              <NumberInput
                value={dur}
                onChange={(e) => setDur(e.target.value)}
                placeholder="30"
              />
            </label>
            <Button
              onClick={log}
              disabled={!valid}
              className="!h-11 !w-11 !px-0"
              aria-label="Log hold"
            >
              <Check size={20} />
            </Button>
          </div>
          <p className="mt-1.5 text-[0.7rem] text-muted">
            Start the timer to hold, then log the seconds you held.
          </p>
        </>
      ) : (
        <>
          {bodyweight && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {[0, 5, 10, 20].map((kg) => {
                const activeChip = added === kg && (kg !== 0 || weight === "");
                return (
                  <button
                    key={kg}
                    type="button"
                    onClick={() => setWeight(kg === 0 ? "" : String(kg))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      activeChip
                        ? "bg-primary text-primary-ink"
                        : "bg-surface-2 text-ink-soft hover:text-ink"
                    }`}
                  >
                    {kg === 0 ? "BW" : `+${kg}`}
                  </button>
                );
              })}
            </div>
          )}

          {isBand && (
            <div className="mb-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {BAND_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    lvl === level
                      ? "bg-primary text-primary-ink"
                      : "bg-surface-2 text-ink-soft hover:text-ink"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            {isBand ? (
              <div className="block">
                <span className="mb-1 block text-xs text-muted">Resistance</span>
                <div className="flex h-11 items-center rounded-md border border-border bg-surface px-3.5 text-sm font-semibold">
                  {level}
                </div>
              </div>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs text-muted">
                  {bodyweight ? "Added weight" : "Weight"} (kg)
                </span>
                <NumberInput
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={bodyweight ? "BW" : "0"}
                />
              </label>
            )}
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

          {bodyweight && (
            <p className="mt-1.5 text-[0.7rem] text-muted">
              Leave blank for pure bodyweight · use a negative number if assisted.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1">
              <Segmented
                value={mode}
                onChange={(m) => setMode(m as IntensityMode)}
                options={[
                  { value: "rpe", label: "RPE" },
                  { value: "rir", label: "RIR" },
                ]}
              />
            </div>
            <div className="flex items-center gap-1 rounded-md bg-surface-2 p-1">
              <IconButton
                label="Decrease effort"
                className="!h-7 !w-7"
                onClick={() => bump(-1)}
              >
                <Minus size={14} />
              </IconButton>
              <span className="tnum w-6 text-center text-sm font-semibold">
                {value || 0}
              </span>
              <IconButton
                label="Increase effort"
                className="!h-7 !w-7"
                onClick={() => bump(1)}
              >
                <Plus size={14} />
              </IconButton>
            </div>
          </div>
          <p className="mt-1.5 text-[0.7rem] text-muted">
            {mode.toUpperCase()} ·{" "}
            {mode === "rir" ? "reps left in the tank" : "effort out of 10"} · aim{" "}
            {EFFORT_ZONES.hypertrophy.label.toLowerCase()}{" "}
            {mode === "rpe"
              ? EFFORT_ZONES.hypertrophy.rpe
              : EFFORT_ZONES.hypertrophy.rir}
          </p>
        </>
      )}
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

const ACTIVE_KEY = "lift:activeWorkout";

function readActive(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function writeActive(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* storage unavailable — non-fatal */
  }
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
  const [activeId, setActiveId] = useState<string | null>(readActive);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [restRun, setRestRun] = useState(0);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const seedRan = useRef(false);

  const exerciseIds = useMemo(() => {
    const fromSets = todayWorkout
      ? [...new Set(todayWorkout.sets.map((s) => s.exerciseId))]
      : [];
    const merged = [...fromSets];
    for (const id of localAdded) if (!merged.includes(id)) merged.push(id);
    return merged;
  }, [todayWorkout, localAdded]);

  // A session is "active" only if we explicitly started it and haven't
  // finished it — not merely because a workout row is dated today.
  const activeWorkout =
    todayWorkout && todayWorkout.id === activeId ? todayWorkout : null;

  function begin(exerciseSeed: string[] = []) {
    const id = startWorkout(today, new Date().toISOString());
    setActiveId(id);
    writeActive(id);
    setLocalAdded(exerciseSeed);
  }

  function finish() {
    // Snapshot the finished session for a screenshot-friendly summary.
    if (activeWorkout && activeWorkout.sets.length > 0)
      setSummaryId(activeWorkout.id);
    writeActive(null);
    setActiveId(null);
    setLocalAdded([]);
  }

  // "Start this day" from the Plan tab drops a seed in sessionStorage.
  useEffect(() => {
    if (seedRan.current) return;
    seedRan.current = true;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem("lift:programSeed");
      if (raw) sessionStorage.removeItem("lift:programSeed");
    } catch {
      /* storage unavailable */
    }
    if (!raw) return;
    try {
      const ids: string[] = JSON.parse(raw);
      if (!ids.length) return;
      if (activeWorkout)
        setLocalAdded((prev) => [...new Set([...prev, ...ids])]);
      else begin(ids);
    } catch {
      /* malformed seed — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryWorkout = summaryId
    ? state.workouts.find((w) => w.id === summaryId) ?? null
    : null;

  const summarySheet = (
    <Sheet
      open={!!summaryWorkout}
      onClose={() => setSummaryId(null)}
      title="Session complete 💪"
    >
      {summaryWorkout && (
        <>
          <WorkoutSummary workout={summaryWorkout} live />
          <p className="mt-3 text-center text-xs text-muted">
            Screenshot to share 📸
          </p>
          <Button className="mt-3" size="lg" onClick={() => setSummaryId(null)}>
            Done
          </Button>
        </>
      )}
    </Sheet>
  );

  // ---- Start screen ----
  if (!activeWorkout) {
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

        {summarySheet}
      </div>
    );
  }

  // ---- Active workout ----
  const totalSets = activeWorkout.sets.length;
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
            if (activeWorkout.sets.length === 0) {
              deleteWorkout(activeWorkout.id);
              finish();
            }
          }}
          className="text-sm text-muted disabled:opacity-40"
          disabled={activeWorkout.sets.length > 0}
        >
          {activeWorkout.sets.length === 0 ? "Cancel" : ""}
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
            workoutId={activeWorkout.id}
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
          onClick={finish}
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
      {summarySheet}
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
