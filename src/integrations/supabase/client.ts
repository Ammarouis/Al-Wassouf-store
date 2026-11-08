import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser Supabase client (anon/publishable key). The user's JWT is attached automatically
 * after sign-in, so every query runs under the user's identity and Postgres RLS applies.
 *
 * NOTE: Next.js inlines NEXT_PUBLIC_* only when referenced as literal `process.env.NEXT_PUBLIC_X`.
 */
export function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/** New-style opaque API keys are not JWTs: they must go in `apikey`, never as a Bearer token. */
export function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) headers.delete("Authorization");
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].filter(Boolean).join(", ");
    throw new Error(`Missing Supabase environment variable(s): ${missing}. Copy .env.example to .env.local and fill them in.`);
  }
  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
    },
  });
}

let _supabase: SupabaseClient<Database> | undefined;

/** Lazy singleton: `import { supabase } from "@/integrations/supabase/client"` */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
