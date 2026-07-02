"use client";

interface Props {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color: string; // css color / var
  track?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  max,
  size = 72,
  stroke = 8,
  color,
  track = "var(--surface-2)",
  children,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const offset = c * (1 - pct);
  const over = value > max;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--danger)" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.6s var(--ease-out-expo)",
          }}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 grid place-items-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}
