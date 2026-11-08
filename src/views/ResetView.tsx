"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function ResetView() {
  const [pw, setPw] = useState("");
  const router = useRouter();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث كلمة المرور");
    router.push("/admin");
  };
  return (
    <div className="shell flex min-h-[60vh] items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 shadow-soft">
        <h1 className="text-lg font-bold">كلمة مرور جديدة</h1>
        <input type="password" minLength={12} required dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="12 حرفًا على الأقل" className="mt-4 h-11 w-full rounded-xl border border-input bg-background px-3" />
        <button className="mt-4 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground">حفظ</button>
      </form>
    </div>
  );
}
