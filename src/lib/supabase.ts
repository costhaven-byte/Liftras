import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once the two env vars are filled in `.env.local`. */
export const isSupabaseConfigured = Boolean(url && anon);

/**
 * Browser Supabase client. Uses PKCE + detectSessionInUrl so the Google
 * OAuth redirect (`?code=…`) is exchanged for a session automatically on
 * load — no server callback route needed for this client-only PWA.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;
