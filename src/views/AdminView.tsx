"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { AdminRole } from "@/lib/shared";

function useSession() {
  const [state, setState] = useState<{ loading: boolean; userId?: string | undefined; email?: string | undefined }>({ loading: true });
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setState({ loading: false, userId: data.user?.id, email: data.user?.email }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setState({ loading: false, userId: session?.user.id, email: session?.user.email }));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}

export function AdminView() {
  const s = useSession();
  const { data: role, isLoading } = useQuery({
    queryKey: ["my-role", s.userId],
    enabled: !!s.userId,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role,is_active,display_name").eq("user_id", s.userId!).maybeSingle();
      return data;
    },
  });
  if (s.loading || (s.userId && isLoading)) return <Center><Loader2 className="size-6 animate-spin text-primary" /></Center>;
  if (!s.userId) return <Login />;
  if (!role || !role.is_active) return (
    <Center>
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-bold">لا تملك صلاحية الوصول</h1>
        <p className="mt-2 text-sm text-muted-foreground">حسابك ({s.email}) غير مفعّل في فريق الإدارة. اطلب من المالك إضافتك.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-6 rounded-full border border-input px-5 py-2 text-sm">تسجيل الخروج</button>
      </div>
    </Center>
  );
  return <AdminDashboard role={role.role as AdminRole} userId={s.userId} email={s.email ?? ""} />;
}

function Center({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-muted px-4">{children}</div>;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
        if (error) throw error;
        toast.success("تحقق من بريدك لتأكيد الحساب");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("أرسلنا رابط إعادة التعيين إلى بريدك");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally { setBusy(false); }
  };
  return (
    <div className="bg-hero flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="rise w-full max-w-sm rounded-3xl bg-card p-7 shadow-lift">
        <div className="flex items-center gap-3"><Logo size={44} /><div><h1 className="font-display text-lg font-bold">لوحة الإدارة</h1><p className="text-xs text-muted-foreground">الوسوف للاتصالات</p></div></div>
        <h2 className="mt-6 text-base font-semibold">{mode === "in" ? "تسجيل الدخول" : mode === "up" ? "إنشاء حساب" : "استعادة كلمة المرور"}</h2>
        <label className="mt-4 block text-sm">البريد الإلكتروني<input type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring/30" /></label>
        {mode !== "reset" && <label className="mt-3 block text-sm">كلمة المرور<input type="password" required minLength={mode === "up" ? 12 : 1} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring/30" /></label>}
        <button disabled={busy} className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground smooth disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : mode === "in" ? "دخول" : mode === "up" ? "إنشاء الحساب" : "إرسال الرابط"}</button>
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          {mode === "in" ? <button type="button" onClick={() => setMode("reset")}>نسيت كلمة المرور؟</button> : <button type="button" onClick={() => setMode("in")}>العودة لتسجيل الدخول</button>}
          {mode === "in" && <button type="button" onClick={() => setMode("up")}>أول مرة؟ أنشئ حساب المالك</button>}
        </div>
        <Link href="/" className="mt-6 block text-center text-xs text-muted-foreground">العودة للمتجر</Link>
      </form>
    </div>
  );
}
