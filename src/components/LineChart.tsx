"use client";

interface Point {
  x: number; // 0..n index or timestamp
  y: number;
}

/** Minimal responsive line chart — no dependencies. */
export function LineChart({
  points,
  color = "var(--primary)",
  height = 120,
  fill = true,
}: {
  points: Point[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  const W = 320;
  const H = height;
  const pad = 8;

  if (points.length === 0) {
    return (
      <div
        className="grid place-items-center text-sm text-muted"
        style={{ height }}
      >
        Not enough data yet
      </div>
    );
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const sx = (x: number) => pad + ((x - minX) / spanX) * (W - pad * 2);
  const sy = (y: number) =>
    H - pad - ((y - minY) / spanY) * (H - pad * 2);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
    .join(" ");
  const area = `${line} L ${sx(maxX)} ${H} L ${sx(minX)} ${H} Z`;
  const gid = `g-${color.replace(/[^a-z]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && points.length > 1 && <path d={area} fill={`url(#${gid})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={points.length > 20 ? 0 : 3}
          fill="var(--surface)"
          stroke={color}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
