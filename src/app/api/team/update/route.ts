import { ROLES, ValidationError, withOwner, type Role } from "@/lib/team.server";
import { getSupabaseAdmin } from "@/integrations/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const d = (await request.json().catch(() => ({}))) as { userId?: string; role?: Role; isActive?: boolean };
  return withOwner(request, async ({ userId }) => {
    if (!d.userId) throw new ValidationError("معرّف المستخدم مطلوب");
    if (d.role && !ROLES.includes(d.role)) throw new ValidationError("دور غير صالح");
    if (d.userId === userId) throw new ValidationError("لا يمكنك تعديل حسابك من هنا");
    const patch: { role?: Role; is_active?: boolean } = {};
    if (d.role) patch.role = d.role;
    if (d.isActive !== undefined) patch.is_active = d.isActive;
    const { error } = await getSupabaseAdmin().from("user_roles").update(patch).eq("user_id", d.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
}
