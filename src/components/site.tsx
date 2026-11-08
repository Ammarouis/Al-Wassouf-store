"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Grid2X2, Home, MapPin, MessageCircle, Search, Smartphone } from "lucide-react";
import { branchesQuery, settingsQuery, track, type PublicProduct } from "@/lib/store";

const NAV = [
  { to: "/", label: "الرئيسية", Icon: Home },
  { to: "/search", label: "الأجهزة", Icon: Smartphone },
  { to: "/brands", label: "الماركات", Icon: Grid2X2 },
  { to: "/branches", label: "الفروع", Icon: MapPin },
] as const;

/** Public image assets live in /public/images. */
export const LOGO_MARK_URL = "/images/logo-mark.png";

function useActive() {
  const path = usePathname() ?? "/";
  return (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border" style={{ width: size, height: size }}>
      <img src={LOGO_MARK_URL} alt="" className="h-full w-full object-contain p-1" />
    </span>
  );
}

export function Header() {
  const { data } = useQuery(settingsQuery);
  const name = data?.settings?.store_name ?? "الوسوف للاتصالات";
  const [q, setQ] = useState("");
  const router = useRouter();
  const isActive = useActive();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };
  return (
    <header className="glass sticky top-0 z-40 border-b border-border/70">
      <div className="shell flex h-16 items-center gap-4 md:h-[72px]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="الرئيسية">
          <Logo size={40} />
          <span className="leading-tight">
            <b className="block font-display text-[15px] font-bold">{name}</b>
            <small className="text-xs text-muted-foreground">عالم الهواتف الذكية</small>
          </span>
        </Link>
        <form onSubmit={submit} role="search" className="mx-auto hidden h-11 max-w-md flex-1 items-center gap-2 rounded-full border border-input bg-card px-4 shadow-soft smooth focus-within:ring-2 focus-within:ring-ring/30 md:flex">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="ابحث عن هاتف أو ماركة..." aria-label="البحث" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <button type="submit" aria-label="بحث" className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground smooth hover:scale-105"><ArrowLeft className="size-3.5" /></button>
        </form>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {NAV.map(({ to, label }) => (
            <Link key={to} href={to} className={`rounded-full px-4 py-2 text-sm font-medium smooth ${isActive(to) ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</Link>
          ))}
        </nav>
        <Link href="/search" className="ms-auto grid size-10 place-items-center rounded-full bg-secondary text-secondary-foreground md:hidden" aria-label="البحث"><Search className="size-5" /></Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const isActive = useActive();
  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 lg:hidden" aria-label="التنقل السفلي">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <Link key={to} href={to} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium smooth ${active ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`grid h-8 w-12 place-items-center rounded-full smooth ${active ? "bg-secondary" : ""}`}><Icon className="size-5" /></span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Footer() {
  const { data } = useQuery(settingsQuery);
  const { data: branches = [] } = useQuery(branchesQuery);
  const s = data?.settings;
  const name = s?.store_name ?? "الوسوف للاتصالات";
  return (
    <footer className="mt-20 bg-ink pb-24 text-ink-foreground lg:pb-0">
      <div className="shell grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3"><Logo size={44} /><b className="font-display text-lg">{name}</b></div>
          <p className="mt-4 max-w-xs text-sm leading-7 opacity-70">{s?.about}</p>
          {s?.whatsapp_channel_url && (
            <a href={s.whatsapp_channel_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-4 py-2 text-sm smooth hover:bg-ink-foreground/20"><MessageCircle className="size-4" /> قناتنا على واتساب</a>
          )}
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <h3 className="mb-1 font-display text-base">روابط سريعة</h3>
          <Link href="/search" className="opacity-75 smooth hover:opacity-100">الأجهزة والبحث</Link>
          <Link href="/brands" className="opacity-75 smooth hover:opacity-100">تصفّح الماركات</Link>
          <Link href="/branches" className="opacity-75 smooth hover:opacity-100">الفروع والتواصل</Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <h3 className="mb-1 font-display text-base">فروعنا</h3>
          {branches.slice(0, 3).map((b) => (
            <Link key={b.id} href="/branches" className="flex gap-2 opacity-75 smooth hover:opacity-100"><MapPin className="mt-0.5 size-4 shrink-0" /><span>{b.name}<small className="block opacity-70">{b.address}</small></span></Link>
          ))}
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="shell flex flex-col items-center justify-between gap-2 py-5 text-xs opacity-70 sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. جميع الحقوق محفوظة.</p>
          <a href="https://cyriux.com" target="_blank" rel="noopener noreferrer" dir="ltr" className="smooth hover:opacity-100">Designed by Cyriux</a>
        </div>
      </div>
    </footer>
  );
}

export function ProductCard({ product, currency, showPrices = true }: { product: PublicProduct; currency?: string | undefined; showPrices?: boolean | undefined }) {
  const wa = product.availability.find((a) => a.whatsappUrl)?.whatsappUrl;
  const inStock = product.availability.some((a) => a.status === "in_stock");
  return (
    <article className="group lift flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <Link href={`/product/${encodeURIComponent(product.product_code)}`} className="relative block aspect-square overflow-hidden bg-muted">
        {product.imageUrls[0] ? (
          <img src={product.imageUrls[0]} alt={product.name} loading="lazy" className="h-full w-full object-contain p-4 smooth group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><Smartphone className="size-12 opacity-40" /></div>
        )}
        {product.isNew && <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">وصل حديثًا</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{product.brand}</p>
        <Link href={`/product/${encodeURIComponent(product.product_code)}`}><h3 className="line-clamp-2 text-[15px] font-semibold leading-6">{product.name}</h3></Link>
        <p className={`flex items-center gap-1.5 text-xs ${inStock ? "text-success" : "text-muted-foreground"}`}>
          <span className={`size-1.5 rounded-full ${inStock ? "bg-success" : "bg-muted-foreground"}`} />{inStock ? "متوفر" : "اسأل عن التوفر"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          {showPrices && product.price != null ? <strong className="font-display text-base">{Number(product.price).toLocaleString("ar")} <small className="text-xs font-normal text-muted-foreground">{product.currency || currency}</small></strong> : <span className="text-sm text-muted-foreground">للاستفسار عن السعر</span>}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click", { product_code: product.product_code })} aria-label="استفسر عبر واتساب" className="grid size-9 place-items-center rounded-full bg-success text-success-foreground smooth hover:scale-110"><MessageCircle className="size-4" /></a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, currency, showPrices }: { products: PublicProduct[]; currency?: string | undefined; showPrices?: boolean | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => <div key={p.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}><ProductCard product={p} currency={currency} showPrices={showPrices} /></div>)}
    </div>
  );
}

export function SkeletonGrid({ n = 8 }: { n?: number }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: n }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />)}</div>;
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <Smartphone className="mx-auto size-10 text-muted-foreground/60" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function PageTitle({ kicker, title, text }: { kicker?: string; title: string; text?: string }) {
  return (
    <div className="rise py-8 md:py-12">
      {kicker && <p className="text-sm font-semibold text-primary">{kicker}</p>}
      <h1 className="mt-1 text-3xl font-bold md:text-4xl">{title}</h1>
      {text && <p className="mt-3 max-w-xl text-muted-foreground">{text}</p>}
    </div>
  );
}
