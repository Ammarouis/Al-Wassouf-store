"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Smartphone } from "lucide-react";
import { productQuery, settingsQuery, track } from "@/lib/store";
import { Empty } from "@/components/site";

export function ProductView({ code }: { code: string }) {
  const { data: p, isLoading } = useQuery(productQuery(code));
  const { data: s } = useQuery(settingsQuery);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (p) { document.title = `${p.name} — الوسوف`; track("product_view", { product_code: p.product_code }); } }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <div className="shell grid gap-8 py-10 md:grid-cols-2"><div className="aspect-square animate-pulse rounded-3xl bg-muted" /><div className="h-80 animate-pulse rounded-3xl bg-muted" /></div>;
  if (!p) return <div className="shell py-16"><Empty title="الجهاز غير موجود" text="ربما أُزيل هذا الجهاز أو لم يُنشر بعد." /></div>;

  const settings = s?.settings;
  const specs = Object.entries((p.specifications ?? {}) as Record<string, string>);
  const wa = p.availability.find((a) => a.whatsappUrl)?.whatsappUrl;

  return (
    <div className="shell pb-10">
      <Link href="/search" className="inline-flex items-center gap-1.5 py-6 text-sm text-muted-foreground smooth hover:text-foreground"><ArrowRight className="size-4" /> العودة للأجهزة</Link>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="rise">
          <div className="aspect-square overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            {p.imageUrls[idx] ? <img key={idx} src={p.imageUrls[idx]} alt={p.name} className="page-enter h-full w-full object-contain p-6" /> : <div className="grid h-full place-items-center"><Smartphone className="size-20 text-muted-foreground/40" /></div>}
          </div>
          {p.imageUrls.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {p.imageUrls.map((u, i) => (
                <button key={u} onClick={() => setIdx(i)} className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-card smooth ${i === idx ? "border-primary" : "border-transparent opacity-70"}`}><img src={u} alt="" className="h-full w-full object-contain p-1" /></button>
              ))}
            </div>
          )}
        </div>
        <div className="rise" style={{ animationDelay: "80ms" }}>
          <p className="text-sm font-semibold text-primary">{p.brand}</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight md:text-4xl">{p.name}</h1>
          {p.model && <p className="mt-2 text-muted-foreground">{p.model}</p>}
          <div className="mt-6 font-display text-3xl font-bold">
            {(settings?.show_prices ?? true) && p.price != null ? <>{Number(p.price).toLocaleString("ar")} <span className="text-base font-normal text-muted-foreground">{p.currency || settings?.currency}</span></> : <span className="text-lg text-muted-foreground">للاستفسار عن السعر</span>}
          </div>
          {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click", { product_code: p.product_code })} className="mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl bg-success text-base font-semibold text-success-foreground shadow-soft smooth hover:opacity-90 md:inline-flex md:px-8"><MessageCircle className="size-5" /> استفسر عبر واتساب</a>}

          <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-bold">التوفر في الفروع</h2>
            <ul className="mt-3 divide-y divide-border">
              {p.availability.length ? p.availability.map((a) => (
                <li key={a.branchCode} className="flex items-center justify-between py-3 text-sm">
                  <span>{a.branchName}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${a.status === "in_stock" ? "bg-success/15 text-success" : a.status === "out_of_stock" ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning"}`}>
                    {a.label}{settings?.show_quantities && a.quantity != null ? ` · ${a.quantity}` : ""}
                  </span>
                </li>
              )) : <li className="py-3 text-sm text-muted-foreground">يرجى التواصل مع الفرع للتأكد.</li>}
            </ul>
          </section>

          {p.description && <p className="mt-8 whitespace-pre-line leading-8 text-muted-foreground">{p.description}</p>}
          {specs.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-bold">المواصفات</h2>
              <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {specs.map(([k, v]) => <div key={k} className="rounded-xl bg-muted px-4 py-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm font-medium">{v}</dd></div>)}
              </dl>
            </section>
          )}
          <p className="mt-6 text-xs text-muted-foreground" dir="ltr">{p.product_code}</p>
        </div>
      </div>
    </div>
  );
}
