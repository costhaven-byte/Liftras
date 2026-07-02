"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Plus, X } from "lucide-react";

/**
 * Floating rest countdown. Re-arms whenever `runId` changes (i.e. a new set
 * was logged). Vibrates + chimes on reaching zero. Dismissible.
 */
export function RestTimer({
  runId,
  seconds,
}: {
  runId: number;
  seconds: number;
}) {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (runId === 0) return;
    setRemaining(seconds);
    setRunning(true);
    firedRef.current = false;
  }, [runId, seconds]);

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

  if (runId === 0 || (remaining === 0 && !running)) return null;

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const pct = seconds > 0 ? remaining / seconds : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto flex max-w-md justify-center px-5">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-surface/95 py-2 pl-2 pr-3 shadow-[var(--shadow-lg)] backdrop-blur-md">
        <div className="relative grid h-11 w-11 place-items-center">
          <svg className="absolute -rotate-90" width={44} height={44}>
            <circle cx={22} cy={22} r={19} fill="none" stroke="var(--surface-2)" strokeWidth={4} />
            <circle
              cx={22}
              cy={22}
              r={19}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 19}
              strokeDashoffset={2 * Math.PI * 19 * (1 - pct)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span className="tnum text-xs font-bold">
            {mm}:{ss.toString().padStart(2, "0")}
          </span>
        </div>
        <button
          onClick={() => setRemaining((r) => r + 30)}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
          aria-label="Add 30 seconds"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => setRunning((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
          aria-label={running ? "Pause" : "Resume"}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setRemaining(0);
          }}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
