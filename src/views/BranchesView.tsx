"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { branchesQuery, track } from "@/lib/store";
import { buildWhatsAppUrl } from "@/lib/shared";
import { Empty, PageTitle } from "@/components/site";


export function BranchesView() {
  const { data = [], isLoading } = useQuery(branchesQuery);
  return (
    <div className="shell">
      <PageTitle kicker="الفروع" title="زورونا أو تواصلوا معنا" text="استفسر عن توفر الأجهزة والأسعار مباشرةً من الفرع الأقرب إليك." />
      {isLoading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-3xl bg-muted" />)}</div> : data.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((b, i) => {
            const wa = buildWhatsAppUrl(b.whatsapp ?? undefined);
            return (
              <article key={b.id} className="rise lift rounded-3xl border border-border bg-card p-6 shadow-soft" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><MapPin className="size-6" /></span>
                  <div><h2 className="text-xl font-bold">{b.name}</h2><p className="mt-1 text-sm text-muted-foreground">{b.address}</p></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click")} className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-medium text-success-foreground"><MessageCircle className="size-4" /> واتساب</a>}
                  {b.phone && <a href={`tel:${b.phone}`} dir="ltr" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Phone className="size-4" /> {b.phone}</a>}
                  {b.email && <a href={`mailto:${b.email}`} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Mail className="size-4" /> البريد</a>}
                  {b.maps_url && <a href={b.maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><MapPin className="size-4" /> الخريطة</a>}
                </div>
              </article>
            );
          })}
        </div>
      ) : <Empty title="لا توجد فروع بعد" />}
    </div>
  );
}
