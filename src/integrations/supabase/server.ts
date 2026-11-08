import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { createSupabaseFetch } from "./client";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return { url, key };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Port of the old `requireSupabaseAuth` TanStack function middleware.
 * Validates the `Authorization: Bearer <access_token>` header and returns a Supabase client that
 * acts AS THE CALLER (so RLS and the SQL `can()` function still apply) plus the verified user id.
 */
export async function requireSupabaseAuth(request: Request): Promise<{ supabase: SupabaseClient<Database>; userId: string }> {
  const { url, key } = env();
  const authHeader = request.headers.get("authorization");
  if (!authHeader) throw new AuthError("Unauthorized: No authorization header provided");
  if (!authHeader.startsWith("Bearer ")) throw new AuthError("Unauthorized: Only Bearer tokens are supported");
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) throw new AuthError("Unauthorized: No token provided");
  if (token.split(".").length !== 3) throw new AuthError("Unauthorized: Invalid token");

  const supabase = createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key), headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new AuthError("Unauthorized: Invalid token");
  if (!data.claims.sub) throw new AuthError("Unauthorized: No user ID found in token");
  return { supabase, userId: data.claims.sub };
}

let _admin: SupabaseClient<Database> | undefined;

/** Service-role client (bypasses RLS). Server-only; import ONLY from route handlers. */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  _admin = createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
