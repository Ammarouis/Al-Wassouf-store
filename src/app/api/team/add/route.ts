import { ROLES, ValidationError, withOwner, type Role } from "@/lib/team.server";
import { getSupabaseAdmin } from "@/integrations/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const d = (await request.json().catch(() => ({}))) as { email?: string; password?: string; role?: Role; name?: string };
  return withOwner(request, async () => {
    if (!d.email || !/^\S+@\S+\.\S+$/.test(d.email)) throw new ValidationError("بريد غير صالح");
    if (!d.password || d.password.length < 12) throw new ValidationError("كلمة المرور يجب أن تكون 12 حرفًا على الأقل");
    if (!d.role || !ROLES.includes(d.role)) throw new ValidationError("دور غير صالح");
    const email = d.email.trim().toLowerCase();
    const admin = getSupabaseAdmin();
    const { data: created, error } = await admin.auth.admin.createUser({ email, password: d.password, email_confirm: true });
    if (error || !created.user) throw new Error(error?.message ?? "تعذر إنشاء الحساب");
    const { error: e2 } = await admin.from("user_roles").upsert({ user_id: created.user.id, role: d.role, display_name: d.name?.slice(0, 80) || email }, { onConflict: "user_id" });
    if (e2) throw new Error(e2.message);
    return { ok: true as const };
  });
}
