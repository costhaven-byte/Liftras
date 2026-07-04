-- Lift — programs, band + timed logging migration.
-- Run this once in the Supabase SQL Editor, after 002_extras.sql.

-- ------------------------------------------------ sets: band + timed metrics
alter table public.sets add column if not exists duration_sec int;   -- timed holds (stretches)
alter table public.sets add column if not exists band text;          -- resistance-band level

-- ---------------------------------------- custom_exercises: how it's logged
alter table public.custom_exercises
  add column if not exists metric text not null default 'weight';    -- weight | bodyweight | band | time

-- ------------------------------------------------------------- programs
create table if not exists public.programs (
  id         uuid primary key,
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  days       jsonb not null default '[]'::jsonb,  -- [{ id, label, exerciseIds[] }]
  created_at timestamptz not null default now()
);

-- ---------------------------------------- schedule (one row per program+date)
create table if not exists public.schedule (
  id         uuid primary key,
  user_id    uuid not null references auth.users on delete cascade,
  program_id uuid not null references public.programs on delete cascade,
  date       date not null,
  day_id     text,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists schedule_program_date_idx
  on public.schedule (program_id, date);

alter table public.programs enable row level security;
alter table public.schedule enable row level security;

do $$
declare t text;
begin
  foreach t in array array['programs','schedule']
  loop
    execute format($f$
      drop policy if exists own_rows on public.%1$I;
      create policy own_rows on public.%1$I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;
