"use client";

import { Cloud } from "lucide-react";

export function SetupNeeded() {
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-6">
      <div className="w-full">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <Cloud size={24} />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Connect Supabase
        </h1>
        <p className="mt-2 text-sm text-muted text-pretty">
          Add your Supabase keys to <code className="text-ink">.env.local</code>{" "}
          and restart the dev server to enable accounts and cloud sync.
        </p>
        <ol className="mt-5 space-y-2 text-sm text-ink-soft">
          <li>1. Create a project at supabase.com</li>
          <li>
            2. Run <code className="text-ink">supabase/schema.sql</code> in the
            SQL Editor
          </li>
          <li>3. Enable the Google auth provider</li>
          <li>
            4. Paste the Project URL &amp; anon key into{" "}
            <code className="text-ink">.env.local</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
