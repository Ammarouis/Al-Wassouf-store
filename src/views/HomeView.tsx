"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Search, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { brandsQuery, branchesQuery, latestQuery, offersQuery, settingsQuery } from "@/lib/store";
import { Empty, ProductGrid, SkeletonGrid } from "@/components/site";


export function HomeView() {
  const { data: s } = useQuery(settingsQuery);
  const { data: products, isLoading } = useQuery(latestQuery(8));
  const { data: brands = [] } = useQuery(brandsQuery);
  const { data: branches = [] } = useQuery(branchesQuery);
  const { data: offers = [] } = useQuery(offersQuery);
  const settings = s?.settings;

  return (
    <>
      <section className="shell pt-4 md:pt-8">
        <div className="bg-hero relative overflow-hidden rounded-3xl text-ink-foreground">
          <div className="bg-glow pointer-events-none absolute -end-24 -top-24 size-[420px] opacity-70" />
          <div className="relative grid items-center gap-8 p-6 sm:p-10 md:grid-cols-2 md:p-14">
            <div className="rise">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1.5 text-xs font-medium">
                <span className="size-2 animate-pulse rounded-full bg-accent" /> وجهتك للهواتف الذكية
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.2] sm:text-5xl lg:text-6xl">
                هاتفك القادم<br /><span className="text-accent">يبدأ من هنا.</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-8 opacity-80">تعرّف على أحدث الأجهزة، قارن الخيارات، وتحقق من التوفر في فروعنا بكل سهولة.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/search" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground smooth hover:gap-3">اكتشف الهواتف <ArrowLeft className="size-4" /></Link>
                <Link href="/branches" className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/25 px-6 py-3 text-sm font-semibold smooth hover:bg-ink-foreground/10"><MapPin className="size-4" /> فروعنا</Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-xs opacity-75">
                <span className="flex items-center gap-1.5"><ShieldCheck className="size-4" /> معلومات واضحة عن التوفر</span>
                <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {branches.length} فروع للتواصل</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <img src={s?.heroUrl || "/images/storefront.png"} alt="متجر الوسوف" className="float-slow aspect-[5/4] w-full rounded-2xl object-cover shadow-lift ring-1 ring-ink-foreground/10" />
              <div className="glass absolute -bottom-4 start-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-foreground shadow-lift">
                <span className="grid size-10 place-items-center rounded-xl bg-brand text-primary-foreground"><Smartphone className="size-5" /></span>
                <div className="text-sm"><b className="block">أحدث الأجهزة</b><small className="text-muted-foreground">تصفّح المتوفر الآن</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell mt-8">
        <Link href="/search" className="flex h-14 items-center gap-3 rounded-2xl border border-input bg-card px-5 text-muted-foreground shadow-soft smooth hover:border-primary md:hidden">
          <Search className="size-5" /> ابحث عن هاتف أو ماركة...
        </Link>
      </section>

      {brands.length > 0 && (
        <section className="shell mt-10">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {brands.map((b) => (
              <Link key={b.name} href={`/search?brand=${encodeURIComponent(b.name)}`} className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-soft smooth hover:border-primary hover:text-primary">
                {b.name} <span className="text-muted-foreground">· {b.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="shell mt-12">
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:px-0 lg:grid-cols-3">
            {offers.map((o) => (
              <article key={o.id} className="lift relative w-[85%] shrink-0 snap-start overflow-hidden rounded-3xl border border-border bg-card shadow-soft md:w-auto">
                {o.imageSrc && <img src={o.imageSrc} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />}
                <div className="p-5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> عرض خاص</span>
                  <h3 className="mt-2 text-lg font-bold">{o.title}</h3>
                  {o.description && <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>}
                  {o.cta_url && <a href={o.cta_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">{o.cta_label || "اعرف المزيد"} <ArrowLeft className="size-4" /></a>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="shell mt-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">جديدنا</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">وصل حديثًا</h2>
          </div>
          <Link href="/search" className="inline-flex items-center gap-1 text-sm font-semibold text-primary smooth hover:gap-2">عرض الكل <ArrowLeft className="size-4" /></Link>
        </div>
        {isLoading ? <SkeletonGrid /> : products?.length ? <ProductGrid products={products} currency={settings?.currency} showPrices={settings?.show_prices ?? true} /> : <Empty title="لا توجد أجهزة منشورة بعد" text="ستظهر الأجهزة هنا فور إضافتها من لوحة الإدارة." />}
      </section>
    </>
  );
}
