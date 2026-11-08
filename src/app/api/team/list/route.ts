import { withOwner } from "@/lib/team.server";
import { getSupabaseAdmin } from "@/integrations/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withOwner(request, async () => {
    const admin = getSupabaseAdmin();
    const { data: roles } = await admin.from("user_roles").select("*").order("created_at");
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });
    return { members: (roles ?? []).map((r) => ({ ...r, email: users?.users.find((u) => u.id === r.user_id)?.email ?? "" })) };
  });
}
