-- Lift — database schema. Run this once in the Supabase SQL Editor.
-- Every table is owned per-user and locked down with Row Level Security so
-- each person only ever sees their own rows.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  user_id       uuid primary key references auth.users on delete cascade,
  name          text not null default '',
  sex           text not null default 'male',
  age           int  not null default 25,
  height_cm     numeric not null default 178,
  weight_kg     numeric not null default 80,
  activity      text not null default 'moderate',
  goal          text not null default 'maintain',
  units         text not null default 'metric',
  rest_timer_sec int  not null default 120,
  onboarded     boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- --------------------------------------------------------------- weigh_ins
create table if not exists public.weigh_ins (
  id         uuid primary key,
  user_id    uuid not null references auth.users on delete cascade,
  date       date not null,
  weight_kg  numeric not null
);

-- ---------------------------------------------------------------- workouts
create table if not exists public.workouts (
  id         uuid primary key,
  user_id    uuid not null references auth.users on delete cascade,
  date       date not null,
  started_at timestamptz not null,
  note       text
);

-- -------------------------------------------------------------------- sets
create table if not exists public.sets (
  id          uuid primary key,
  user_id     uuid not null references auth.users on delete cascade,
  workout_id  uuid not null references public.workouts on delete cascade,
  exercise_id text not null,
  weight_kg   numeric not null,
  reps        int not null,
  mode        text not null,
  value       numeric not null,
  created_at  timestamptz not null default now()
);
create index if not exists sets_workout_idx on public.sets (workout_id);

-- ------------------------------------------------------------------- meals
create table if not exists public.meals (
  id       uuid primary key,
  user_id  uuid not null references auth.users on delete cascade,
  name     text not null,
  kcal     numeric not null,
  protein  numeric not null,
  carbs    numeric not null,
  fat      numeric not null
);

-- ------------------------------------------------------------- food_entries
create table if not exists public.food_entries (
  id           uuid primary key,
  user_id      uuid not null references auth.users on delete cascade,
  date         date not null,
  name         text not null,
  kcal         numeric not null,
  protein      numeric not null,
  carbs        numeric not null,
  fat          numeric not null,
  from_meal_id uuid
);
create index if not exists food_date_idx on public.food_entries (user_id, date);

-- ------------------------------------------------------------ Row Level Security
alter table public.profiles     enable row level security;
alter table public.weigh_ins    enable row level security;
alter table public.workouts     enable row level security;
alter table public.sets         enable row level security;
alter table public.meals        enable row level security;
alter table public.food_entries enable row level security;

-- Each policy: a user may only touch rows where user_id = their auth uid.
do $$
declare t text;
begin
  foreach t in array array['weigh_ins','workouts','sets','meals','food_entries']
  loop
    execute format($f$
      drop policy if exists own_rows on public.%1$I;
      create policy own_rows on public.%1$I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
