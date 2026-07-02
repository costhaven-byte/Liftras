-- Lift — extras migration (workout templates + custom exercises).
-- Run this once in the Supabase SQL Editor, after schema.sql.

-- ------------------------------------------------------------- templates
create table if not exists public.templates (
  id           uuid primary key,
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  exercise_ids jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------ custom_exercises
create table if not exists public.custom_exercises (
  id            uuid primary key,
  user_id       uuid not null references auth.users on delete cascade,
  name          text not null,
  muscle_group  text not null,
  created_at    timestamptz not null default now()
);

alter table public.templates        enable row level security;
alter table public.custom_exercises enable row level security;

do $$
declare t text;
begin
  foreach t in array array['templates','custom_exercises']
  loop
    execute format($f$
      drop policy if exists own_rows on public.%1$I;
      create policy own_rows on public.%1$I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;
