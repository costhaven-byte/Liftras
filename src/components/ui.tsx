"use client";

import { useEffect, useState } from "react";

/** True only after the client has mounted — gates localStorage-derived UI. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost" | "danger";
  size?: "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
  const sizes = { md: "h-11 px-4 text-sm", lg: "h-13 px-5 text-base w-full" };
  const variants = {
    primary:
      "bg-primary text-primary-ink shadow-[var(--shadow-sm)] hover:bg-primary-hover",
    soft: "bg-primary-soft text-primary hover:brightness-95",
    ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
    danger: "bg-transparent text-danger hover:bg-danger/10",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "default" | "danger";
};

/** Compact icon-only button with a proper 40px touch target + focus ring. */
export function IconButton({
  label,
  tone = "default",
  className = "",
  children,
  ...props
}: IconButtonProps) {
  const hover =
    tone === "danger"
      ? "hover:bg-danger/10 hover:text-danger"
      : "hover:bg-surface-2 hover:text-ink";
  return (
    <button
      aria-label={label}
      className={`focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors active:scale-90 ${hover} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-sm)] ${className}`}
      {...props}
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold text-muted">{children}</h2>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-md border border-border bg-surface px-3.5 h-11 text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 placeholder:text-muted";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputBase} ${props.className ?? ""}`} {...props} />;
}

export function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      inputMode="decimal"
      className={`${inputBase} tnum ${props.className ?? ""}`}
      {...props}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-md bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`focus-ring h-9 rounded-[0.4rem] text-sm font-medium transition-all ${
              active
                ? "bg-surface text-ink shadow-[var(--shadow-sm)]"
                : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Bottom sheet modal — mobile-friendly. Closes on Escape / backdrop tap. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ animation: "fade 0.2s var(--ease-out-quart)" }}
        onClick={onClose}
      />
      <div
        className="relative mx-auto max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 pb-8"
        style={{ animation: "sheet 0.32s var(--ease-out-expo)" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border-strong" />
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        {children}
      </div>
      <style>{`@keyframes fade{from{opacity:0}to{opacity:1}}@keyframes sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}@media (prefers-reduced-motion: reduce){[role=dialog] *{animation:none!important}}`}</style>
    </div>
  );
}
