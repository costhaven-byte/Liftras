"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { Button, Input, Sheet } from "./ui";
import { useActions, useAppState } from "@/lib/store";
import { resolvedExercises } from "@/lib/derive";
import { MUSCLE_GROUPS, type Metric, type MuscleGroup } from "@/lib/exercises";

const METRICS: { value: Metric; label: string; hint: string }[] = [
  { value: "weight", label: "Weighted", hint: "Logs the external weight you lift." },
  { value: "bodyweight", label: "Bodyweight", hint: "Logs added weight only — 0 means just bodyweight." },
  { value: "band", label: "Band", hint: "Logs a resistance level (Light → Heavy), no kg." },
  { value: "time", label: "Timed", hint: "Logs seconds held — for stretches and planks." },
];

export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const state = useAppState();
  const { addCustomExercise } = useActions();
  const all = resolvedExercises(state);

  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup>("Chest");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<MuscleGroup>("Chest");
  const [newMetric, setNewMetric] = useState<Metric>("weight");

  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    if (q) return all.filter((e) => e.name.toLowerCase().includes(q));
    return all.filter((e) => e.group === group);
  }, [all, q, group]);

  function reset() {
    setQuery("");
    setCreating(false);
    setNewName("");
    setNewMetric("weight");
  }

  function pick(id: string) {
    onPick(id);
    reset();
    onClose();
  }

  function create() {
    const name = newName.trim();
    if (!name) return;
    const id = addCustomExercise(name, newGroup, newMetric);
    pick(id);
  }

  if (creating) {
    return (
      <Sheet
        open={open}
        onClose={() => {
          setCreating(false);
          onClose();
        }}
        title="New custom exercise"
      >
        <div className="space-y-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Exercise name"
            autoFocus
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-soft">
              Muscle group
            </p>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {MUSCLE_GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setNewGroup(g)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    g === newGroup
                      ? "bg-primary text-primary-ink"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-soft">
              How is it logged?
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setNewMetric(m.value)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    m.value === newMetric
                      ? "bg-primary text-primary-ink"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {METRICS.find((m) => m.value === newMetric)?.hint}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setCreating(false)}
            >
              Back
            </Button>
            <Button className="flex-1" disabled={!newName.trim()} onClick={create}>
              Create &amp; add
            </Button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add exercise"
    >
      <div className="relative mb-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="!pl-9"
        />
      </div>

      {!q && (
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                g === group
                  ? "bg-primary text-primary-ink"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <ul className="max-h-[42dvh] space-y-1.5 overflow-y-auto">
        {list.map((e) => (
          <li key={e.id}>
            <button
              onClick={() => pick(e.id)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary"
            >
              <span className="font-medium">
                {e.name}
                {q && (
                  <span className="ml-2 text-xs text-muted">{e.group}</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {e.bodyweight && (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.65rem] font-semibold text-ink-soft">
                    Bodyweight
                  </span>
                )}
                {e.custom ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-ink">
                    <Sparkles size={11} /> Custom
                  </span>
                ) : (
                  e.compound && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                      Compound
                    </span>
                  )
                )}
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="px-1 py-6 text-center text-sm text-muted">
            No matches.
          </li>
        )}
      </ul>

      <Button
        variant="soft"
        size="lg"
        className="mt-3"
        onClick={() => {
          setNewName(query);
          setCreating(true);
        }}
      >
        <Plus size={18} /> Create custom exercise
      </Button>
    </Sheet>
  );
}
