"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Field, NumberInput, Input, Segmented } from "./ui";
import { useActions } from "@/lib/store";
import {
  ACTIVITY,
  GOALS,
  computeTargets,
  inToCm,
  lbToKg,
  type ActivityLevel,
  type Goal,
  type Sex,
  type Units,
} from "@/lib/nutrition";

export function Onboarding() {
  const { updateProfile } = useActions();

  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [units, setUnits] = useState<Units>("metric");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("178");
  const [weight, setWeight] = useState("80");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");

  const metric = units === "metric";
  const weightKg = metric ? +weight : lbToKg(+weight);
  const heightCm = metric ? +height : inToCm(+height);

  const preview = useMemo(() => {
    if (!weightKg || !heightCm || !age) return null;
    return computeTargets({
      sex,
      age: +age,
      heightCm,
      weightKg,
      activity,
      goal,
    });
  }, [sex, age, heightCm, weightKg, activity, goal]);

  const valid = name.trim() && +age > 0 && weightKg > 0 && heightCm > 0;

  function finish() {
    updateProfile({
      name: name.trim(),
      sex,
      units,
      age: +age,
      heightCm,
      weightKg,
      activity,
      goal,
      onboarded: true,
    });
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 pb-10 pt-10">
      <p className="text-sm font-semibold text-primary">Welcome to Lift</p>
      <h1 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight text-balance">
        Let&apos;s set up your numbers
      </h1>
      <p className="mt-2 text-sm text-muted">
        We calculate your calories &amp; macros from these. No accounts to fill
        in, no guesswork — just the math.
      </p>

      <div className="mt-7 space-y-5">
        <Field label="What should we call you?">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
          />
        </Field>

        <Field label="Biological sex" hint="Used by the BMR formula only.">
          <Segmented
            value={sex}
            onChange={setSex}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </Field>

        <Field label="Units">
          <Segmented
            value={units}
            onChange={setUnits}
            options={[
              { value: "metric", label: "kg / cm" },
              { value: "imperial", label: "lb / in" },
            ]}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Age">
            <NumberInput value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label={metric ? "Height (cm)" : "Height (in)"}>
            <NumberInput
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </Field>
          <Field label={metric ? "Weight (kg)" : "Weight (lb)"}>
            <NumberInput
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Activity level">
          <div className="space-y-2">
            {(Object.keys(ACTIVITY) as ActivityLevel[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setActivity(k)}
                className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-colors ${
                  activity === k
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {ACTIVITY[k].label}
                  </span>
                  <span className="block text-xs text-muted">
                    {ACTIVITY[k].hint}
                  </span>
                </span>
                <span className="tnum text-xs font-medium text-muted">
                  ×{ACTIVITY[k].factor}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Your goal">
          <Segmented
            value={goal}
            onChange={setGoal}
            options={[
              { value: "cut", label: "Cut" },
              { value: "maintain", label: "Maintain" },
              { value: "bulk", label: "Bulk" },
            ]}
          />
          <p className="mt-1.5 text-xs text-muted">{GOALS[goal].hint}</p>
        </Field>
      </div>

      {preview && (
        <div className="mt-7 rounded-lg border border-primary/30 bg-primary-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Your daily target
          </p>
          <div className="mt-2 flex items-end gap-1.5">
            <span className="tnum text-3xl font-bold text-ink">
              {preview.macros.kcal.toLocaleString()}
            </span>
            <span className="mb-1 text-sm text-muted">kcal</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Protein", preview.macros.protein, "var(--protein)"],
              ["Carbs", preview.macros.carbs, "var(--carbs)"],
              ["Fat", preview.macros.fat, "var(--fat)"],
            ].map(([label, g, c]) => (
              <div key={label as string}>
                <span
                  className="tnum block text-lg font-bold"
                  style={{ color: c as string }}
                >
                  {g}g
                </span>
                <span className="text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            BMR {preview.bmr} · maintenance {preview.tdee} kcal
          </p>
        </div>
      )}

      <Button
        size="lg"
        className="mt-6"
        disabled={!valid}
        onClick={finish}
      >
        Start tracking <ArrowRight size={18} />
      </Button>
    </div>
  );
}
