/**
 * Client-side API for owner-only team management.
 * Replaces TanStack `createServerFn` + `useServerFn`: each function POSTs to /api/team/* with the
 * caller's Supabase access token. The route handlers re-verify the token and the `admins:manage`
 * permission (SQL `can()`), so nothing here is trusted.
 */
import { supabase } from "@/integrations/supabase/client";

export type TeamRole = "owner" | "admin" | "editor" | "inventory_manager";

async function call<T>(path: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(json.error || "حدث خطأ");
  return json;
}

export type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  display_name: string | null;
  email: string;
  [k: string]: unknown;
};

export const listTeam = () => call<{ members: TeamMember[] }>("/api/team/list", {}).then((r) => r.members);
export const addMember = (d: { email: string; password: string; role: TeamRole; name?: string }) => call<{ ok: true }>("/api/team/add", d);
export const updateMember = (d: { userId: string; role?: TeamRole; isActive?: boolean }) => call<{ ok: true }>("/api/team/update", d);
