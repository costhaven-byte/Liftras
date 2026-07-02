"use client";

/**
 * Data layer — backed by Supabase (auth + Postgres), exposed through the same
 * reactive-store API the UI already used when this was local-first. Writes are
 * optimistic: we generate ids client-side, update in-memory state immediately,
 * then persist to Supabase and resync on error. The component contract
 * (`useAppState`, `useActions`, `useAuth`) is unchanged.
 */

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { supabase } from "./supabase";
import type {
  AppState,
  CustomExercise,
  FoodEntry,
  Meal,
  Profile,
  SetEntry,
  Template,
  WeighIn,
  Workout,
} from "./types";

const DEFAULT_PROFILE: Profile = {
  name: "",
  sex: "male",
  age: 25,
  heightCm: 178,
  weightKg: 80,
  activity: "moderate",
  goal: "maintain",
  units: "metric",
  restTimerSec: 120,
  onboarded: false,
};

const DEFAULT_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  weighIns: [],
  workouts: [],
  meals: [],
  food: [],
  templates: [],
  customExercises: [],
};

export type AuthStatus = "loading" | "signedOut" | "ready";
export interface AuthState {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
}
const DEFAULT_AUTH: AuthState = {
  status: "loading",
  userId: null,
  email: null,
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/* ----------------------------- db ⇄ app maps ---------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
const rowToProfile = (r: any): Profile => ({
  name: r.name ?? "",
  sex: r.sex,
  age: Number(r.age),
  heightCm: Number(r.height_cm),
  weightKg: Number(r.weight_kg),
  activity: r.activity,
  goal: r.goal,
  units: r.units,
  restTimerSec: Number(r.rest_timer_sec),
  onboarded: !!r.onboarded,
});

function profilePatchToRow(p: Partial<Profile>) {
  const r: Record<string, unknown> = {};
  if (p.name !== undefined) r.name = p.name;
  if (p.sex !== undefined) r.sex = p.sex;
  if (p.age !== undefined) r.age = p.age;
  if (p.heightCm !== undefined) r.height_cm = p.heightCm;
  if (p.weightKg !== undefined) r.weight_kg = p.weightKg;
  if (p.activity !== undefined) r.activity = p.activity;
  if (p.goal !== undefined) r.goal = p.goal;
  if (p.units !== undefined) r.units = p.units;
  if (p.restTimerSec !== undefined) r.rest_timer_sec = p.restTimerSec;
  if (p.onboarded !== undefined) r.onboarded = p.onboarded;
  r.updated_at = new Date().toISOString();
  return r;
}

const rowToSet = (r: any): SetEntry => ({
  id: r.id,
  exerciseId: r.exercise_id,
  weightKg: Number(r.weight_kg),
  reps: Number(r.reps),
  mode: r.mode,
  value: Number(r.value),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------- store core ----------------------------- */

type Listener = () => void;

function createStore() {
  let state = DEFAULT_STATE;
  let auth = DEFAULT_AUTH;
  let userId: string | null = null;
  const listeners = new Set<Listener>();

  const emit = () => listeners.forEach((l) => l());
  const setState = (next: AppState) => {
    state = next;
    emit();
  };
  const setAuth = (next: AuthState) => {
    auth = next;
    emit();
  };

  async function loadAll(uidArg: string) {
    if (!supabase) return;
    setAuth({ ...auth, status: "loading" });

    // Ensure a profile row exists.
    let { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uidArg)
      .maybeSingle();
    if (!prof) {
      const insert = { user_id: uidArg, ...profilePatchToRow(DEFAULT_PROFILE) };
      const res = await supabase
        .from("profiles")
        .insert(insert)
        .select("*")
        .single();
      prof = res.data;
    }

    const [weighIns, workouts, sets, meals, food, templates, customEx] =
      await Promise.all([
        supabase.from("weigh_ins").select("*").order("date"),
        supabase
          .from("workouts")
          .select("*")
          .order("started_at", { ascending: false }),
        supabase.from("sets").select("*").order("created_at"),
        supabase.from("meals").select("*"),
        supabase.from("food_entries").select("*"),
        supabase.from("templates").select("*").order("created_at"),
        supabase.from("custom_exercises").select("*").order("created_at"),
      ]);

    const setsByWorkout = new Map<string, SetEntry[]>();
    (sets.data ?? []).forEach((r) => {
      const arr = setsByWorkout.get(r.workout_id) ?? [];
      arr.push(rowToSet(r));
      setsByWorkout.set(r.workout_id, arr);
    });

    state = {
      profile: prof ? rowToProfile(prof) : DEFAULT_PROFILE,
      weighIns: (weighIns.data ?? []).map((r) => ({
        id: r.id,
        date: r.date,
        weightKg: Number(r.weight_kg),
      })),
      workouts: (workouts.data ?? []).map((r) => ({
        id: r.id,
        date: r.date,
        startedAt: r.started_at,
        note: r.note ?? undefined,
        sets: setsByWorkout.get(r.id) ?? [],
      })),
      meals: (meals.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        kcal: Number(r.kcal),
        protein: Number(r.protein),
        carbs: Number(r.carbs),
        fat: Number(r.fat),
      })),
      food: (food.data ?? []).map((r) => ({
        id: r.id,
        date: r.date,
        name: r.name,
        kcal: Number(r.kcal),
        protein: Number(r.protein),
        carbs: Number(r.carbs),
        fat: Number(r.fat),
        fromMealId: r.from_meal_id ?? undefined,
      })),
      templates: (templates.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        exerciseIds: Array.isArray(r.exercise_ids) ? r.exercise_ids : [],
      })),
      customExercises: (customEx.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        group: r.muscle_group,
      })),
    };
    setAuth({ status: "ready", userId: uidArg, email: auth.email });
  }

  // Wire auth once (browser only — avoids SSR touching localStorage).
  if (supabase && typeof window !== "undefined") {
    supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id ?? null;
      if (nextId && nextId !== userId) {
        userId = nextId;
        setAuth({ status: "loading", userId: nextId, email: session!.user.email ?? null });
        void loadAll(nextId);
      } else if (!nextId) {
        userId = null;
        state = DEFAULT_STATE;
        setAuth({ status: "signedOut", userId: null, email: null });
      }
    });
  } else {
    auth = { status: "signedOut", userId: null, email: null };
  }

  /** Optimistic write helper: mutate local state now, persist, resync on error. */
  const write = (
    mutation: () => PromiseLike<{ error?: unknown } | void>,
  ) => {
    void (async () => {
      try {
        const res = await mutation();
        if (res && "error" in res && res.error) throw res.error;
      } catch (e) {
        console.error("[store] write failed, resyncing", e);
        if (userId) void loadAll(userId);
      }
    })();
  };

  const owned = <T extends Record<string, unknown>>(row: T) => ({
    ...row,
    user_id: userId,
  });

  return {
    getSnapshot: () => state,
    getAuth: () => auth,
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },

    // ------- auth -------
    signInWithGoogle() {
      if (!supabase) return;
      void supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    },
    signOut() {
      if (!supabase) return;
      void supabase.auth.signOut();
    },

    // ------- profile -------
    updateProfile(patch: Partial<Profile>) {
      setState({ ...state, profile: { ...state.profile, ...patch } });
      const sb = supabase;
      if (!sb || !userId) return;
      const u = userId;
      write(() =>
        sb.from("profiles").update(profilePatchToRow(patch)).eq("user_id", u),
      );
    },

    // ------- weigh-ins -------
    addWeighIn(date: string, weightKg: number) {
      const wi: WeighIn = { id: uid(), date, weightKg };
      setState({
        ...state,
        weighIns: [...state.weighIns.filter((w) => w.date !== date), wi].sort(
          (a, b) => a.date.localeCompare(b.date),
        ),
        profile: { ...state.profile, weightKg },
      });
      const sb = supabase;
      if (!sb || !userId) return;
      const u = userId;
      write(async () => {
        await sb.from("weigh_ins").delete().eq("date", date);
        await sb
          .from("weigh_ins")
          .insert(owned({ id: wi.id, date, weight_kg: weightKg }));
        return sb
          .from("profiles")
          .update({ weight_kg: weightKg })
          .eq("user_id", u);
      });
    },
    removeWeighIn(id: string) {
      setState({ ...state, weighIns: state.weighIns.filter((w) => w.id !== id) });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("weigh_ins").delete().eq("id", id));
    },

    // ------- workouts / sets -------
    startWorkout(date: string, isoNow: string): string {
      const w: Workout = { id: uid(), date, startedAt: isoNow, sets: [] };
      setState({ ...state, workouts: [w, ...state.workouts] });
      const sb = supabase;
      if (sb && userId)
        write(() =>
          sb.from("workouts").insert(owned({ id: w.id, date, started_at: isoNow })),
        );
      return w.id;
    },
    addSet(workoutId: string, s: Omit<SetEntry, "id">) {
      const entry: SetEntry = { ...s, id: uid() };
      setState({
        ...state,
        workouts: state.workouts.map((w) =>
          w.id === workoutId ? { ...w, sets: [...w.sets, entry] } : w,
        ),
      });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() =>
        sb.from("sets").insert(
          owned({
            id: entry.id,
            workout_id: workoutId,
            exercise_id: entry.exerciseId,
            weight_kg: entry.weightKg,
            reps: entry.reps,
            mode: entry.mode,
            value: entry.value,
          }),
        ),
      );
    },
    removeSet(workoutId: string, setId: string) {
      setState({
        ...state,
        workouts: state.workouts.map((w) =>
          w.id === workoutId
            ? { ...w, sets: w.sets.filter((x) => x.id !== setId) }
            : w,
        ),
      });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("sets").delete().eq("id", setId));
    },
    setWorkoutNote(workoutId: string, note: string) {
      setState({
        ...state,
        workouts: state.workouts.map((w) =>
          w.id === workoutId ? { ...w, note } : w,
        ),
      });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("workouts").update({ note }).eq("id", workoutId));
    },
    deleteWorkout(workoutId: string) {
      setState({
        ...state,
        workouts: state.workouts.filter((w) => w.id !== workoutId),
      });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("workouts").delete().eq("id", workoutId));
    },

    // ------- templates -------
    saveTemplate(name: string, exerciseIds: string[]): string {
      const t: Template = { id: uid(), name, exerciseIds };
      setState({ ...state, templates: [...state.templates, t] });
      const sb = supabase;
      if (sb && userId)
        write(() =>
          sb
            .from("templates")
            .insert(owned({ id: t.id, name, exercise_ids: exerciseIds })),
        );
      return t.id;
    },
    deleteTemplate(id: string) {
      setState({
        ...state,
        templates: state.templates.filter((t) => t.id !== id),
      });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("templates").delete().eq("id", id));
    },

    // ------- custom exercises -------
    addCustomExercise(name: string, group: string): string {
      const c: CustomExercise = { id: uid(), name, group };
      setState({ ...state, customExercises: [...state.customExercises, c] });
      const sb = supabase;
      if (sb && userId)
        write(() =>
          sb
            .from("custom_exercises")
            .insert(owned({ id: c.id, name, muscle_group: group })),
        );
      return c.id;
    },
    deleteCustomExercise(id: string) {
      setState({
        ...state,
        customExercises: state.customExercises.filter((c) => c.id !== id),
      });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("custom_exercises").delete().eq("id", id));
    },

    // ------- meals -------
    saveMeal(meal: Omit<Meal, "id">): string {
      const m: Meal = { ...meal, id: uid() };
      setState({ ...state, meals: [...state.meals, m] });
      const sb = supabase;
      if (sb && userId)
        write(() =>
          sb.from("meals").insert(
            owned({
              id: m.id,
              name: m.name,
              kcal: m.kcal,
              protein: m.protein,
              carbs: m.carbs,
              fat: m.fat,
            }),
          ),
        );
      return m.id;
    },
    deleteMeal(id: string) {
      setState({ ...state, meals: state.meals.filter((m) => m.id !== id) });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("meals").delete().eq("id", id));
    },

    // ------- food entries -------
    addFood(entry: Omit<FoodEntry, "id">) {
      const f: FoodEntry = { ...entry, id: uid() };
      setState({ ...state, food: [...state.food, f] });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() =>
        sb.from("food_entries").insert(
          owned({
            id: f.id,
            date: f.date,
            name: f.name,
            kcal: f.kcal,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            from_meal_id: f.fromMealId ?? null,
          }),
        ),
      );
    },
    removeFood(id: string) {
      setState({ ...state, food: state.food.filter((f) => f.id !== id) });
      const sb = supabase;
      if (!sb || !userId) return;
      write(() => sb.from("food_entries").delete().eq("id", id));
    },

    resetAll() {
      setState({ ...DEFAULT_STATE, profile: { ...DEFAULT_PROFILE } });
      const sb = supabase;
      if (!sb || !userId) return;
      const u = userId;
      write(async () => {
        await Promise.all([
          sb.from("weigh_ins").delete().eq("user_id", u),
          sb.from("workouts").delete().eq("user_id", u),
          sb.from("meals").delete().eq("user_id", u),
          sb.from("food_entries").delete().eq("user_id", u),
          sb.from("templates").delete().eq("user_id", u),
          sb.from("custom_exercises").delete().eq("user_id", u),
        ]);
        return sb
          .from("profiles")
          .update(profilePatchToRow(DEFAULT_PROFILE))
          .eq("user_id", u);
      });
    },
  };
}

type Store = ReturnType<typeof createStore>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<Store | null>(null);
  if (!ref.current) ref.current = createStore();
  return (
    <StoreContext.Provider value={ref.current}>{children}</StoreContext.Provider>
  );
}

function useStoreApi(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within StoreProvider");
  return store;
}

export function useAppState(): AppState {
  const store = useStoreApi();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => DEFAULT_STATE,
  );
}

export function useAuth(): AuthState & {
  signInWithGoogle: () => void;
  signOut: () => void;
} {
  const store = useStoreApi();
  const auth = useSyncExternalStore(
    store.subscribe,
    store.getAuth,
    () => DEFAULT_AUTH,
  );
  return {
    ...auth,
    signInWithGoogle: store.signInWithGoogle,
    signOut: store.signOut,
  };
}

export function useSelector<T>(selector: (s: AppState) => T): T {
  const state = useAppState();
  return useMemo(() => selector(state), [state, selector]);
}

export function useActions() {
  const store = useStoreApi();
  return useMemo(() => {
    const { getSnapshot, getAuth, subscribe, signInWithGoogle, signOut, ...actions } =
      store;
    void getSnapshot;
    void getAuth;
    void subscribe;
    void signInWithGoogle;
    void signOut;
    return actions;
  }, [store]);
}

export function todayKey(d = new Date()): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export { DEFAULT_STATE };
