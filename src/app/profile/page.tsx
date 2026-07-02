"use client";

import { useState } from "react";
import { LogOut, RotateCcw } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import {
  Button,
  Card,
  Field,
  NumberInput,
  Input,
  SectionTitle,
  Segmented,
} from "@/components/ui";
import { useActions, useAppState, useAuth } from "@/lib/store";
import {
  ACTIVITY,
  GOALS,
  cmToIn,
  displayWeight,
  inToCm,
  lbToKg,
  weightUnitLabel,
  type ActivityLevel,
  type Goal,
  type Sex,
  type Units,
} from "@/lib/nutrition";
import { targetsFor } from "@/lib/derive";
import { InstallButton } from "@/components/PWA";

function ProfileContent() {
  const state = useAppState();
  const { updateProfile, resetAll } = useActions();
  const { email, signOut } = useAuth();
  const p = state.profile;
  const metric = p.units === "metric";

  const targets = targetsFor(p);

  const [confirmReset, setConfirmReset] = useState(false);

  const heightShown = metric
    ? Math.round(p.heightCm)
    : Math.round(cmToIn(p.heightCm));
  const weightShown = +displayWeight(p.weightKg, p.units).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted">
          Your numbers drive every target. Edit and they recalculate instantly.
        </p>
      </div>

      {/* Live targets */}
      <Card className="border-primary/30 bg-primary-soft !p-5">
        <SectionTitle>Daily targets</SectionTitle>
        <div className="flex items-end gap-1.5">
          <span className="tnum text-3xl font-bold">
            {targets.macros.kcal.toLocaleString()}
          </span>
          <span className="mb-1 text-sm text-muted">kcal / day</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ["Protein", targets.macros.protein, "var(--protein)"],
            ["Carbs", targets.macros.carbs, "var(--carbs)"],
            ["Fat", targets.macros.fat, "var(--fat)"],
          ].map(([l, g, c]) => (
            <div key={l as string}>
              <span
                className="tnum block text-lg font-bold"
                style={{ color: c as string }}
              >
                {g}g
              </span>
              <span className="text-xs text-muted">{l}</span>
            </div>
          ))}
        </div>
        <p className="tnum mt-3 text-xs text-muted">
          BMR {targets.bmr} · maintenance {targets.tdee} kcal
        </p>
      </Card>

      {/* Editable stats */}
      <div className="space-y-4">
        <SectionTitle>Your stats</SectionTitle>

        <Field label="Name">
          <Input
            value={p.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
          />
        </Field>

        <Field label="Units">
          <Segmented
            value={p.units}
            onChange={(u) => updateProfile({ units: u as Units })}
            options={[
              { value: "metric", label: "kg / cm" },
              { value: "imperial", label: "lb / in" },
            ]}
          />
        </Field>

        <Field label="Biological sex">
          <Segmented
            value={p.sex}
            onChange={(s) => updateProfile({ sex: s as Sex })}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Age">
            <NumberInput
              defaultValue={p.age}
              onBlur={(e) =>
                updateProfile({ age: +e.target.value || p.age })
              }
            />
          </Field>
          <Field label={`Height (${metric ? "cm" : "in"})`}>
            <NumberInput
              defaultValue={heightShown}
              onBlur={(e) => {
                const v = +e.target.value;
                if (v > 0)
                  updateProfile({ heightCm: metric ? v : inToCm(v) });
              }}
            />
          </Field>
          <Field label={`Weight (${weightUnitLabel(p.units)})`}>
            <NumberInput
              defaultValue={weightShown}
              onBlur={(e) => {
                const v = +e.target.value;
                if (v > 0)
                  updateProfile({ weightKg: metric ? v : lbToKg(v) });
              }}
            />
          </Field>
        </div>

        <Field label="Activity level">
          <select
            value={p.activity}
            onChange={(e) =>
              updateProfile({ activity: e.target.value as ActivityLevel })
            }
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm"
          >
            {(Object.keys(ACTIVITY) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>
                {ACTIVITY[k].label} — {ACTIVITY[k].hint}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Goal" hint={GOALS[p.goal].hint}>
          <Segmented
            value={p.goal}
            onChange={(g) => updateProfile({ goal: g as Goal })}
            options={[
              { value: "cut", label: "Cut" },
              { value: "maintain", label: "Maintain" },
              { value: "bulk", label: "Bulk" },
            ]}
          />
        </Field>

        <Field
          label={`Rest timer default — ${p.restTimerSec}s`}
          hint="Auto-starts after you log a set."
        >
          <input
            type="range"
            min={30}
            max={300}
            step={15}
            value={p.restTimerSec}
            onChange={(e) =>
              updateProfile({ restTimerSec: +e.target.value })
            }
            className="w-full accent-[var(--primary)]"
          />
        </Field>
      </div>

      <InstallButton />

      {/* Account */}
      <Card className="flex items-center justify-between !py-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Account</p>
          <p className="truncate text-xs text-muted">
            {email ?? "Synced to your account"}
          </p>
        </div>
        <Button variant="ghost" onClick={signOut} className="!px-3">
          <LogOut size={16} /> Sign out
        </Button>
      </Card>

      {/* Reset */}
      <div>
        {confirmReset ? (
          <Card className="!p-4">
            <p className="text-sm font-medium">
              Erase all data on this device? This can&apos;t be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="danger"
                className="!bg-danger !text-white flex-1"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
              >
                Erase everything
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-2 text-sm text-muted hover:text-danger"
          >
            <RotateCcw size={15} /> Reset all data
          </button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppGate>
      <ProfileContent />
    </AppGate>
  );
}
