"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { brandsQuery } from "@/lib/store";
import { Empty, PageTitle } from "@/components/site";


export function BrandsView() {
  const { data = [], isLoading } = useQuery(brandsQuery);
  return (
    <div className="shell">
      <PageTitle kicker="الماركات" title="اختر ماركتك المفضلة" text="كل الماركات المتوفرة في متاجرنا في مكان واحد." />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : data.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {data.map((b, i) => (
            <Link key={b.name} href={`/search?brand=${encodeURIComponent(b.name)}`} className="rise lift group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-soft" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="grid size-12 place-items-center rounded-xl bg-brand font-display text-xl font-bold text-primary-foreground">{b.name.charAt(0).toUpperCase()}</span>
              <div className="mt-6 flex items-end justify-between">
                <div><h3 className="text-lg font-bold">{b.name}</h3><p className="text-xs text-muted-foreground">{b.count} جهاز</p></div>
                <ArrowLeft className="size-5 text-muted-foreground smooth group-hover:-translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      ) : <Empty title="لا توجد ماركات بعد" />}
    </div>
  );
}
