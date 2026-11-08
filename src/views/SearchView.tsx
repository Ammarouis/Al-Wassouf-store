"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { brandsQuery, branchesQuery, searchQuery, settingsQuery, track } from "@/lib/store";
import { Empty, PageTitle, ProductGrid, SkeletonGrid } from "@/components/site";

type S = { q?: string | undefined; brand?: string | undefined; branch?: string | undefined };

/** Same validation the TanStack route's `validateSearch` did: only non-empty strings survive. */
function useSearchState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/search";
  const get = (k: string) => params.get(k) || undefined;
  const search: S = { q: get("q"), brand: get("brand"), branch: get("branch") };
  const navigate = useCallback(
    (patch: Partial<S>, opts: { replace?: boolean } = {}) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [params, pathname, router],
  );
  return { search, navigate };
}

export function SearchView() {
  const { search, navigate } = useSearchState();
  const [q, setQ] = useState(search.q ?? "");
  const { data: s } = useQuery(settingsQuery);
  const { data: brands = [] } = useQuery(brandsQuery);
  const { data: branches = [] } = useQuery(branchesQuery);
  const { data, isLoading } = useQuery(searchQuery(search));

  useEffect(() => setQ(search.q ?? ""), [search.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      const next = q.trim() || undefined;
      if (next !== search.q) navigate({ q: next }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!search.q) return undefined; const t = setTimeout(() => track("search", { term: search.q }), 1200); return () => clearTimeout(t); }, [search.q]);

  const chip = (active: boolean) => `shrink-0 rounded-full px-4 py-2 text-sm font-medium smooth ${active ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:border-primary"}`;

  return (
    <div className="shell">
      <PageTitle kicker="الأجهزة" title="ابحث عن هاتفك" />
      <div className="sticky top-16 z-30 -mx-4 bg-background/90 px-4 pb-3 pt-1 backdrop-blur md:top-[72px] md:mx-0 md:px-0">
        <label className="flex h-14 items-center gap-3 rounded-2xl border border-input bg-card px-5 shadow-soft smooth focus-within:ring-2 focus-within:ring-ring/30">
          <Search className="size-5 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="سامسونج، iPhone 15، شاومي..." className="h-full flex-1 bg-transparent outline-none" aria-label="البحث" />
          {q && <button onClick={() => setQ("")} aria-label="مسح"><X className="size-4 text-muted-foreground" /></button>}
        </label>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <button className={chip(!search.brand)} onClick={() => navigate({ brand: undefined })}>كل الماركات</button>
          {brands.map((b) => <button key={b.name} className={chip(search.brand === b.name)} onClick={() => navigate({ brand: b.name })}>{b.name}</button>)}
        </div>
        {branches.length > 1 && (
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            <button className={chip(!search.branch)} onClick={() => navigate({ branch: undefined })}>كل الفروع</button>
            {branches.map((b) => <button key={b.id} className={chip(search.branch === b.code)} onClick={() => navigate({ branch: b.code })}>{b.name}</button>)}
          </div>
        )}
      </div>
      <div className="mt-6">
        {isLoading ? <SkeletonGrid /> : data?.length ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{data.length} نتيجة</p>
            <ProductGrid products={data} currency={s?.settings?.currency} showPrices={s?.settings?.show_prices ?? true} />
          </>
        ) : <Empty title="لا توجد نتائج" text="جرّب كلمة أخرى أو ماركة مختلفة." />}
      </div>
    </div>
  );
}
