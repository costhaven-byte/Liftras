"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  Home,
  LineChart,
  Moon,
  Sun,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/nutrition", label: "Nutrition", icon: UtensilsCrossed },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-5 py-3.5 backdrop-blur-md">
        <Link href="/" className="focus-ring flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-ink">
            <Dumbbell size={18} strokeWidth={2.4} />
          </span>
          <span className="text-lg font-semibold tracking-tight">Lift</span>
        </Link>
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="focus-ring grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink active:scale-90"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main className="flex-1 px-5 pb-28 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-bg/90 backdrop-blur-md">
        <ul className="grid grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="focus-ring flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors"
                  style={{ color: active ? "var(--primary)" : "var(--muted)" }}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active ? "var(--primary-soft)" : "none"}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
