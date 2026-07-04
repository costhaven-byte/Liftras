"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { ExercisePicker } from "@/components/ExercisePicker";
import { Button, Card, IconButton, Input, Sheet } from "@/components/ui";
import { useActions, useAppState, todayKey } from "@/lib/store";
import { exerciseName } from "@/lib/derive";
import { plural } from "@/lib/format";
import type { Program, ProgramDay } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** YYYY-MM-DD for a local calendar date. */
function dateKey(y: number, m: number, d: number): string {
  return todayKey(new Date(y, m, d));
}

/* --------------------------------------------------------------- builder --- */

function ProgramBuilder({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: Program | null;
}) {
  const { saveProgram, updateProgram } = useActions();
  const state = useAppState();
  const [name, setName] = useState(initial?.name ?? "");
  const [days, setDays] = useState<ProgramDay[]>(initial?.days ?? []);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  // Reset local draft whenever we open a different program.
  const key = initial?.id ?? "new";
  const [draftKey, setDraftKey] = useState(key);
  if (draftKey !== key) {
    setDraftKey(key);
    setName(initial?.name ?? "");
    setDays(initial?.days ?? []);
  }

  function addDay() {
    setDays((d) => [
      ...d,
      { id: uid(), label: `Day ${d.length + 1}`, exerciseIds: [] },
    ]);
  }
  function setDayLabel(id: string, label: string) {
    setDays((d) => d.map((x) => (x.id === id ? { ...x, label } : x)));
  }
  function removeDay(id: string) {
    setDays((d) => d.filter((x) => x.id !== id));
  }
  function addExercise(dayId: string, exId: string) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId && !x.exerciseIds.includes(exId)
          ? { ...x, exerciseIds: [...x.exerciseIds, exId] }
          : x,
      ),
    );
  }
  function removeExercise(dayId: string, exId: string) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? { ...x, exerciseIds: x.exerciseIds.filter((i) => i !== exId) }
          : x,
      ),
    );
  }

  function save() {
    const n = name.trim();
    if (!n) return;
    if (initial) updateProgram(initial.id, { name: n, days });
    else saveProgram(n, days);
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? "Edit program" : "New program"}
    >
      <div className="space-y-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Program name — e.g. Push/Pull/Legs"
          autoFocus
        />

        <div className="space-y-3">
          {days.map((day) => (
            <Card key={day.id} className="!p-3">
              <div className="mb-2 flex items-center gap-2">
                <Input
                  value={day.label}
                  onChange={(e) => setDayLabel(day.id, e.target.value)}
                  placeholder="Day name"
                  className="!h-9"
                />
                <IconButton
                  label="Remove day"
                  tone="danger"
                  className="!h-9 !w-9"
                  onClick={() => removeDay(day.id)}
                >
                  <Trash2 size={15} />
                </IconButton>
              </div>

              {day.exerciseIds.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {day.exerciseIds.map((exId) => (
                    <li
                      key={exId}
                      className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-1.5 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {exerciseName(state, exId)}
                      </span>
                      <button
                        onClick={() => removeExercise(day.id, exId)}
                        aria-label="Remove exercise"
                        className="text-muted hover:text-danger"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => setPickerFor(day.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary"
              >
                <Plus size={14} /> Add exercise
              </button>
            </Card>
          ))}
        </div>

        <Button variant="soft" onClick={addDay}>
          <Plus size={16} /> Add day
        </Button>

        <Button size="lg" disabled={!name.trim()} onClick={save}>
          {initial ? "Save changes" : "Create program"}
        </Button>
      </div>

      <ExercisePicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onPick={(id) => {
          if (pickerFor) addExercise(pickerFor, id);
        }}
      />
    </Sheet>
  );
}

/* -------------------------------------------------------------- day sheet -- */

function DayDetail({
  program,
  date,
  onClose,
}: {
  program: Program;
  date: string | null;
  onClose: () => void;
}) {
  const state = useAppState();
  const router = useRouter();
  const { setScheduledDay, markDayDone } = useActions();
  const entry = state.schedule.find(
    (s) => s.programId === program.id && s.date === date,
  );
  const assignedDay = program.days.find((d) => d.id === entry?.dayId) ?? null;

  function startDay() {
    if (!assignedDay || !date) return;
    try {
      sessionStorage.setItem(
        "lift:programSeed",
        JSON.stringify(assignedDay.exerciseIds),
      );
    } catch {
      /* storage unavailable */
    }
    router.push("/train");
  }

  const pretty = date
    ? new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Sheet open={date !== null} onClose={onClose} title={pretty}>
      <p className="mb-2 text-sm font-medium text-ink-soft">Scheduled day</p>
      <div className="flex flex-wrap gap-1.5">
        {program.days.map((d) => (
          <button
            key={d.id}
            onClick={() => date && setScheduledDay(program.id, date, d.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              d.id === entry?.dayId
                ? "bg-primary text-primary-ink"
                : "bg-surface-2 text-muted"
            }`}
          >
            {d.label}
          </button>
        ))}
        {entry?.dayId && (
          <button
            onClick={() => date && setScheduledDay(program.id, date, null)}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted hover:text-danger"
          >
            Clear
          </button>
        )}
      </div>
      {program.days.length === 0 && (
        <p className="text-sm text-muted">
          Add days to this program first, then schedule them here.
        </p>
      )}

      {assignedDay && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-surface-2 px-3 py-2.5">
            <p className="text-sm font-semibold">{assignedDay.label}</p>
            <p className="mt-0.5 text-xs text-muted">
              {assignedDay.exerciseIds.length
                ? assignedDay.exerciseIds
                    .map((id) => exerciseName(state, id))
                    .join(" · ")
                : "No exercises yet"}
            </p>
          </div>

          <Button
            variant={entry?.done ? "soft" : "ghost"}
            onClick={() =>
              date && markDayDone(program.id, date, !entry?.done)
            }
            className={entry?.done ? "!text-success" : ""}
          >
            <Check size={16} /> {entry?.done ? "Completed" : "Mark done"}
          </Button>

          {assignedDay.exerciseIds.length > 0 && (
            <Button size="lg" onClick={startDay}>
              <Play size={16} /> Start this day
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* --------------------------------------------------------------- calendar -- */

function PlanContent() {
  const state = useAppState();
  const { deleteProgram } = useActions();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [detailDate, setDetailDate] = useState<string | null>(null);

  const program =
    state.programs.find((p) => p.id === selectedId) ??
    state.programs[state.programs.length - 1] ??
    null;

  // Month being viewed.
  const base = new Date();
  const view = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = todayKey();

  const scheduleByDate = useMemo(() => {
    const m = new Map<string, (typeof state.schedule)[number]>();
    if (program)
      state.schedule
        .filter((s) => s.programId === program.id)
        .forEach((s) => m.set(s.date, s));
    return m;
  }, [state.schedule, program]);

  const dayLabel = (dayId: string | null) =>
    program?.days.find((d) => d.id === dayId)?.label ?? "";

  if (state.programs.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
        <Card className="!p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <CalendarPlus size={26} />
          </span>
          <p className="mt-3 font-semibold">Build a program</p>
          <p className="mt-1 text-sm text-muted">
            Create your training days, then schedule them across the month and
            tick each one off as you go.
          </p>
          <Button
            size="lg"
            className="mt-5"
            onClick={() => {
              setEditing(null);
              setBuilderOpen(true);
            }}
          >
            <Plus size={18} /> New program
          </Button>
        </Card>
        <ProgramBuilder
          open={builderOpen}
          onClose={() => setBuilderOpen(false)}
          initial={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
        <Button
          variant="soft"
          className="!h-9 !px-3"
          onClick={() => {
            setEditing(null);
            setBuilderOpen(true);
          }}
        >
          <Plus size={16} /> Program
        </Button>
      </div>

      {/* Program selector */}
      {state.programs.length > 1 && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {state.programs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                p.id === program?.id
                  ? "bg-primary text-primary-ink"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {program && (
        <>
          <Card className="flex items-center justify-between !py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{program.name}</p>
              <p className="text-xs text-muted">
                {plural(program.days.length, "day")} ·{" "}
                {program.days.map((d) => d.label).join(" · ") || "no days yet"}
              </p>
            </div>
            <div className="ml-2 flex items-center gap-1">
              <Button
                variant="ghost"
                className="!h-9 !px-3"
                onClick={() => {
                  setEditing(program);
                  setBuilderOpen(true);
                }}
              >
                Edit
              </Button>
              <IconButton
                label="Delete program"
                tone="danger"
                onClick={() => {
                  deleteProgram(program.id);
                  setSelectedId(null);
                }}
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          </Card>

          {/* Month header */}
          <div className="flex items-center justify-between">
            <IconButton
              label="Previous month"
              onClick={() => setMonthOffset((o) => o - 1)}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <p className="font-semibold">
              {view.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>
            <IconButton
              label="Next month"
              onClick={() => setMonthOffset((o) => o + 1)}
            >
              <ChevronRight size={18} />
            </IconButton>
          </div>

          {/* Calendar grid */}
          <div>
            <div className="mb-1 grid grid-cols-7 text-center text-[0.65rem] font-semibold uppercase text-muted">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = dateKey(year, month, day);
                const entry = scheduleByDate.get(key);
                const isToday = key === todayStr;
                const scheduled = !!entry?.dayId;
                return (
                  <button
                    key={key}
                    onClick={() => setDetailDate(key)}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-xs transition-colors ${
                      isToday
                        ? "border-primary"
                        : "border-transparent hover:border-border"
                    } ${
                      scheduled
                        ? entry?.done
                          ? "bg-success/15"
                          : "bg-primary-soft"
                        : "bg-surface-2"
                    }`}
                  >
                    <span
                      className={`tnum font-semibold ${
                        isToday ? "text-primary" : ""
                      }`}
                    >
                      {day}
                    </span>
                    {scheduled && (
                      <span className="flex items-center gap-0.5 text-[0.55rem] font-semibold leading-none text-primary">
                        {entry?.done && <Check size={9} />}
                        <span className="max-w-[3.5ch] truncate">
                          {dayLabel(entry!.dayId)}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-muted">
            Tap a date to schedule a day, mark it done, or start the workout.
          </p>
        </>
      )}

      <ProgramBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        initial={editing}
      />
      {program && (
        <DayDetail
          program={program}
          date={detailDate}
          onClose={() => setDetailDate(null)}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppGate>
      <PlanContent />
    </AppGate>
  );
}
