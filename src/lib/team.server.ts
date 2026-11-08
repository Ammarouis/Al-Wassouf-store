import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthError, requireSupabaseAuth } from "@/integrations/supabase/server";

export const ROLES = ["owner", "admin", "editor", "inventory_manager"] as const;
export type Role = (typeof ROLES)[number];

/** Only users holding `admins:manage` (the owner) may continue. Mirrors SQL can(uid, perm). */
export async function assertOwner(supabase: SupabaseClient<any>, userId: string) {
  const { data } = await supabase.rpc("can", { _uid: userId, _perm: "admins:manage" });
  if (!data) throw new AuthError("هذه العملية متاحة للمالك فقط", 403);
}

export async function withOwner<T>(request: Request, fn: (ctx: { userId: string; supabase: SupabaseClient<any> }) => Promise<T>) {
  try {
    const ctx = await requireSupabaseAuth(request);
    await assertOwner(ctx.supabase, ctx.userId);
    return NextResponse.json(await fn(ctx));
  } catch (e) {
    const status = e instanceof AuthError ? e.status : e instanceof ValidationError ? 400 : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "خطأ غير متوقع" }, { status });
  }
}

export class ValidationError extends Error {}
