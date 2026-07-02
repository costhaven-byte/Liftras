"use client";

import { useMemo, useState } from "react";
import { BookMarked, Calculator, Plus, Trash2, X } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { ProgressRing } from "@/components/ProgressRing";
import {
  Button,
  Card,
  Field,
  IconButton,
  Input,
  NumberInput,
  SectionTitle,
  Segmented,
  Sheet,
} from "@/components/ui";
import { useActions, useAppState, todayKey } from "@/lib/store";
import { foodForDay, sumMacros, targetsFor } from "@/lib/derive";
import {
  caloriesFromMacros,
  macrosFromPercentSplit,
} from "@/lib/nutrition";

function MacroStat({
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
  return (
    <div className="flex flex-col items-center gap-1.5">
      <ProgressRing value={value} max={target} size={62} stroke={7} color={color}>
        <span className="tnum text-sm font-bold leading-none">
          {Math.round(value)}
        </span>
      </ProgressRing>
      <div className="text-center leading-tight">
        <span className="block text-xs font-medium text-ink-soft">{label}</span>
        <span className="tnum block text-[0.7rem] text-muted">
          / {target}g
        </span>
      </div>
    </div>
  );
}

function AddFoodSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addFood, saveMeal } = useActions();
  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [save, setSave] = useState(false);

  const kcal = caloriesFromMacros(+protein || 0, +carbs || 0, +fat || 0);
  const valid = name.trim() && kcal > 0;

  function submit() {
    const entry = {
      date: todayKey(),
      name: name.trim(),
      kcal,
      protein: +protein || 0,
      carbs: +carbs || 0,
      fat: +fat || 0,
    };
    if (save)
      saveMeal({
        name: entry.name,
        kcal: entry.kcal,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      });
    addFood(entry);
    setName("");
    setProtein("");
    setCarbs("");
    setFat("");
    setSave(false);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add food">
      <div className="space-y-4">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken & rice"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Protein (g)">
            <NumberInput
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Carbs (g)">
            <NumberInput
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Fat (g)">
            <NumberInput
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-md bg-surface-2 px-4 py-3">
          <span className="text-sm text-ink-soft">Calculated calories</span>
          <span className="tnum text-lg font-bold text-primary">
            {kcal} kcal
          </span>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Save to my meals for quick re-use
        </label>

        <Button size="lg" disabled={!valid} onClick={submit}>
          Add to today
        </Button>
      </div>
    </Sheet>
  );
}

function MacroCalcSheet({
  open,
  onClose,
  targetKcal,
}: {
  open: boolean;
  onClose: () => void;
  targetKcal: number;
}) {
  const [p, setP] = useState(40);
  const [c, setC] = useState(30);
  const [f, setF] = useState(30);
  const total = p + c + f;
  const macros = macrosFromPercentSplit(targetKcal, p, c, f);

  const Row = ({
    label,
    val,
    set,
    color,
    grams,
  }: {
    label: string;
    val: number;
    set: (n: number) => void;
    color: string;
    grams: number;
  }) => (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium" style={{ color }}>
          {label}
        </span>
        <span className="tnum text-muted">
          {val}% · <span className="font-semibold text-ink">{grams}g</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={val}
        onChange={(e) => set(+e.target.value)}
        className="w-full accent-[var(--primary)]"
        style={{ accentColor: color }}
      />
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Macro split calculator">
      <p className="mb-4 text-sm text-muted">
        Split your {targetKcal.toLocaleString()} kcal target into grams. Handy
        for planning a different ratio than the default.
      </p>
      <div className="space-y-4">
        <Row label="Protein" val={p} set={setP} color="var(--protein)" grams={macros.protein} />
        <Row label="Carbs" val={c} set={setC} color="var(--carbs)" grams={macros.carbs} />
        <Row label="Fat" val={f} set={setF} color="var(--fat)" grams={macros.fat} />
      </div>
      <p
        className="mt-4 text-center text-sm font-medium"
        style={{ color: total === 100 ? "var(--success)" : "var(--danger)" }}
      >
        {total === 100 ? "Adds up to 100% ✓" : `Currently ${total}% — aim for 100%`}
      </p>
    </Sheet>
  );
}

function NutritionContent() {
  const state = useAppState();
  const { addFood, removeFood, deleteMeal } = useActions();
  const today = todayKey();
  const targets = targetsFor(state.profile).macros;
  const entries = foodForDay(state, today);
  const eaten = sumMacros(entries);

  const [addOpen, setAddOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const remaining = targets.kcal - eaten.kcal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
        <button
          onClick={() => setCalcOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-soft"
        >
          <Calculator size={14} /> Calculator
        </button>
      </div>

      {/* Day summary */}
      <Card className="!p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">
              {remaining >= 0 ? "Remaining today" : "Over target"}
            </p>
            <p className="tnum text-4xl font-bold tracking-tight">
              {Math.abs(Math.round(remaining)).toLocaleString()}
              <span className="ml-1.5 text-base font-medium text-muted">
                kcal
              </span>
            </p>
          </div>
          <p className="tnum shrink-0 text-right text-xs text-muted">
            {Math.round(eaten.kcal).toLocaleString()} /{" "}
            {targets.kcal.toLocaleString()}
            <span className="block">eaten</span>
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
          <MacroStat
            label="Protein"
            value={eaten.protein}
            target={targets.protein}
            color="var(--protein)"
          />
          <MacroStat
            label="Carbs"
            value={eaten.carbs}
            target={targets.carbs}
            color="var(--carbs)"
          />
          <MacroStat
            label="Fat"
            value={eaten.fat}
            target={targets.fat}
            color="var(--fat)"
          />
        </div>
      </Card>

      <Button size="lg" onClick={() => setAddOpen(true)}>
        <Plus size={18} /> Log food
      </Button>

      {/* Today's log */}
      <div>
        <SectionTitle>Today&apos;s log</SectionTitle>
        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Nothing logged yet. Tap “Log food” to start.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <Card className="flex items-center justify-between gap-3 !py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.name}</p>
                    <p className="tnum text-xs text-muted">
                      {e.protein}P · {e.carbs}C · {e.fat}F
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="tnum text-sm font-semibold">
                      {e.kcal}
                      <span className="ml-0.5 text-xs font-normal text-muted">
                        kcal
                      </span>
                    </span>
                    <IconButton
                      label={`Remove ${e.name}`}
                      tone="danger"
                      onClick={() => removeFood(e.id)}
                    >
                      <X size={18} />
                    </IconButton>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Saved meals */}
      {state.meals.length > 0 && (
        <div>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              <BookMarked size={14} /> My meals
            </span>
          </SectionTitle>
          <ul className="space-y-2">
            {state.meals.map((m) => (
              <li key={m.id}>
                <Card className="flex items-center justify-between !py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="tnum text-xs text-muted">
                      {m.kcal} kcal · {m.protein}P · {m.carbs}C · {m.fat}F
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="md"
                      variant="soft"
                      className="!h-9 !px-3"
                      onClick={() =>
                        addFood({
                          date: today,
                          name: m.name,
                          kcal: m.kcal,
                          protein: m.protein,
                          carbs: m.carbs,
                          fat: m.fat,
                          fromMealId: m.id,
                        })
                      }
                    >
                      <Plus size={16} /> Add
                    </Button>
                    <IconButton
                      label={`Delete ${m.name}`}
                      tone="danger"
                      onClick={() => deleteMeal(m.id)}
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

      <AddFoodSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <MacroCalcSheet
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        targetKcal={targets.kcal}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AppGate>
      <NutritionContent />
    </AppGate>
  );
}
