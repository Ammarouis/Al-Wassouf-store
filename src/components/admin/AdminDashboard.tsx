"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3, Building2, ExternalLink, History, ImagePlus, KeyRound, LogOut, Megaphone, Package, Pencil, Plus, Settings, Trash2, Users, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site";
import { AVAILABILITY_LABELS_AR, AVAILABILITY_STATUSES, ADMIN_ROLES, roleHasPermission, searchKeywords, type AdminRole, type AvailabilityStatus, type Permission } from "@/lib/shared";
import { BUCKET, imagesOf, signPaths, type BranchRow, type OfferRow, type ProductRow, type StoredImage } from "@/lib/store";
import { addMember, listTeam, updateMember } from "@/lib/team.functions";

const ROLE_AR: Record<AdminRole, string> = { owner: "المالك", admin: "مدير", editor: "محرر", inventory_manager: "مسؤول مخزون" };
const STATUS_AR: Record<ProductRow["status"], string> = { draft: "مسودة", published: "منشور", hidden: "مخفي", archived: "مؤرشف" };
const MAX_IMAGES = 8;
const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Tab = "products" | "branches" | "offers" | "settings" | "stats" | "activity" | "team" | "account";
const TABS: { id: Tab; label: string; Icon: typeof Package; perm?: Permission }[] = [
  { id: "products", label: "المنتجات", Icon: Package, perm: "product:read" },
  { id: "branches", label: "الفروع", Icon: Building2, perm: "branch:edit" },
  { id: "offers", label: "العروض", Icon: Megaphone, perm: "offers:edit" },
  { id: "settings", label: "الإعدادات", Icon: Settings, perm: "settings:edit" },
  { id: "stats", label: "الإحصائيات", Icon: BarChart3, perm: "stats:view" },
  { id: "activity", label: "السجل", Icon: History, perm: "settings:edit" },
  { id: "team", label: "الفريق", Icon: Users, perm: "admins:manage" },
  { id: "account", label: "حسابي", Icon: KeyRound },
];

const errMsg = (e: unknown) => {
  const m = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "حدث خطأ";
  if (m.includes("products_identity_active")) return "يوجد منتج نشط بنفس الماركة والموديل";
  if (m.includes("inventory_branch_id_fkey")) return "لا يمكن حذف فرع لديه مخزون — عطّله بدلًا من ذلك";
  return m;
};

export const inputCls = "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none smooth focus:ring-2 focus:ring-ring/30";
const btn = "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold smooth disabled:opacity-50";
const btnPrimary = `${btn} bg-primary text-primary-foreground hover:opacity-90`;
const btnGhost = `${btn} border border-input bg-card hover:bg-muted`;

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block text-sm ${className}`}><span className="mb-1.5 block text-muted-foreground">{label}</span>{children}</label>;
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="page-enter">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold">{title}</h1>{action}</div>
      {children}
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="rise max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-lift sm:rounded-3xl sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full hover:bg-muted"><X className="size-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

export function AdminDashboard({ role, userId, email }: { role: AdminRole; userId: string; email: string }) {
  const can = (p: Permission) => roleHasPermission(role, p);
  const tabs = TABS.filter((t) => !t.perm || can(t.perm));
  const [tab, setTab] = useState<Tab>("products");
  const qc = useQueryClient();
  const router = useRouter();
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); router.replace("/admin"); };

  return (
    <div className="min-h-screen bg-muted lg:flex">
      <aside className="sticky top-0 z-30 border-b border-border bg-card lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-e">
        <div className="flex items-center justify-between gap-3 p-4 lg:p-5">
          <div className="flex items-center gap-3"><Logo size={38} /><div className="leading-tight"><b className="block font-display text-sm">لوحة الإدارة</b><small className="text-xs text-muted-foreground">{ROLE_AR[role]}</small></div></div>
          <div className="flex gap-1 lg:hidden">
            <Link href="/" className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="المتجر"><ExternalLink className="size-4" /></Link>
            <button onClick={signOut} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="خروج"><LogOut className="size-4" /></button>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium smooth ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-4" />{label}</button>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-border p-4 lg:block">
          <p className="truncate text-xs text-muted-foreground" dir="ltr">{email}</p>
          <div className="mt-3 flex gap-2"><Link href="/" className={`${btnGhost} flex-1`}><ExternalLink className="size-4" />المتجر</Link><button onClick={signOut} className={btnGhost} aria-label="خروج"><LogOut className="size-4" /></button></div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
        <div key={tab} className="mx-auto max-w-6xl">
          {tab === "products" && <ProductsPanel can={can} />}
          {tab === "branches" && <BranchesPanel />}
          {tab === "offers" && <OffersPanel />}
          {tab === "settings" && <SettingsPanel />}
          {tab === "stats" && <StatsPanel />}
          {tab === "activity" && <ActivityPanel />}
          {tab === "team" && <TeamPanel userId={userId} />}
          {tab === "account" && <AccountPanel />}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Products ---------------- */
function useAllBranches() {
  return useQuery({ queryKey: ["admin", "branches"], queryFn: async () => (await supabase.from("branches").select("*").order("sort_order")).data ?? [] });
}

function ProductsPanel({ can }: { can: (p: Permission) => boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ProductRow["status"]>("all");
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(1000);
      const rows = data ?? [];
      const urls = await signPaths(rows.map((r) => imagesOf(r)[0]?.path ?? ""));
      return rows.map((r) => ({ ...r, thumb: urls[imagesOf(r)[0]?.path ?? ""] }));
    },
  });
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.filter((p) => (status === "all" || p.status === status) && (!t || `${p.name} ${p.brand} ${p.model ?? ""} ${p.product_code}`.toLowerCase().includes(t)));
  }, [data, q, status]);

  const setStatusMut = useMutation({
    mutationFn: async ({ id, s }: { id: string; s: ProductRow["status"] }) => { const { error } = await supabase.from("products").update({ status: s }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: async (p: ProductRow) => {
      const { error } = await supabase.from("products").delete().eq("id", p.id); if (error) throw error;
      const paths = imagesOf(p).map((i) => i.path); if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin", "products"] }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Panel title="المنتجات" action={can("product:create") && <button className={btnPrimary} onClick={() => setEditing("new")}><Plus className="size-4" />منتج جديد</button>}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الماركة أو الرمز" className={inputCls} />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={`${inputCls} sm:w-44`}>
          <option value="all">كل الحالات</option>{(Object.keys(STATUS_AR) as ProductRow["status"][]).map((s) => <option key={s} value={s}>{STATUS_AR[s]}</option>)}
        </select>
      </div>
      {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-card" /> : list.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground">لا توجد منتجات بعد.</div>
      ) : (
        <div className="grid gap-2">
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">{p.thumb && <img src={p.thumb} alt="" className="h-full w-full object-contain" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.brand} · <span dir="ltr">{p.product_code}</span></p>
              </div>
              {can("product:visibility") ? (
                <select value={p.status} onChange={(e) => setStatusMut.mutate({ id: p.id, s: e.target.value as ProductRow["status"] })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs">
                  {(Object.keys(STATUS_AR) as ProductRow["status"][]).filter((s) => s !== "archived" || can("product:archive") || p.status === "archived").map((s) => <option key={s} value={s}>{STATUS_AR[s]}</option>)}
                </select>
              ) : <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{STATUS_AR[p.status]}</span>}
              <button onClick={() => setEditing(p)} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="تعديل"><Pencil className="size-4" /></button>
              {can("product:delete") && <button onClick={() => confirm(`حذف ${p.name} نهائيًا؟`) && del.mutate(p)} className="grid size-9 place-items-center rounded-full text-destructive hover:bg-destructive/10" aria-label="حذف"><Trash2 className="size-4" /></button>}
            </div>
          ))}
        </div>
      )}
      {editing && <ProductEditor product={editing === "new" ? null : editing} can={can} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

function specsToText(s: unknown) { return Object.entries((s ?? {}) as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join("\n"); }
function textToSpecs(t: string) {
  const o: Record<string, string> = {};
  t.split("\n").forEach((line) => { const i = line.indexOf(":"); if (i > 0) { const k = line.slice(0, i).trim(); const v = line.slice(i + 1).trim(); if (k && v) o[k] = v; } });
  return o;
}
async function validImage(f: File) {
  if (!OK_TYPES.includes(f.type) || f.size > MAX_BYTES) return false;
  const b = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const jpg = b[0] === 0xff && b[1] === 0xd8; const png = b[0] === 0x89 && b[1] === 0x50; const gif = b[0] === 0x47 && b[1] === 0x49;
  const webp = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return jpg || png || gif || webp;
}
async function uploadImages(files: File[], prefix: string): Promise<StoredImage[]> {
  const out: StoredImage[] = [];
  for (const f of files) {
    if (!(await validImage(f))) { toast.error(`${f.name}: يُقبل JPEG/PNG/WebP/GIF حتى 8 ميغابايت`); continue; }
    const ext = (f.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
    if (error) toast.error(error.message); else out.push({ path });
  }
  return out;
}

function ProductEditor({ product, can, onClose }: { product: ProductRow | null; can: (p: Permission) => boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: branches = [] } = useAllBranches();
  const editable = product ? can("product:edit") : can("product:create");
  const [f, setF] = useState({
    name: product?.name ?? "", brand: product?.brand ?? "", model: product?.model ?? "", description: product?.description ?? "",
    specs: specsToText(product?.specifications), price: product?.price?.toString() ?? "", currency: product?.currency ?? "",
    status: product?.status ?? "draft", is_featured: product?.is_featured ?? false,
  });
  const [images, setImages] = useState<StoredImage[]>(product ? imagesOf(product) : []);
  const [busy, setBusy] = useState(false);
  const { data: urls = {} } = useQuery({ queryKey: ["sign", images.map((i) => i.path).join()], queryFn: () => signPaths(images.map((i) => i.path)) });
  const { data: inv = [] } = useQuery({ queryKey: ["admin", "inv", product?.id], enabled: !!product, queryFn: async () => (await supabase.from("inventory").select("*").eq("product_id", product!.id)).data ?? [] });
  const [stock, setStock] = useState<Record<string, { status: AvailabilityStatus; quantity: string }>>({});
  const stockOf = (bid: string) => stock[bid] ?? (() => { const r = inv.find((i) => i.branch_id === bid); return { status: (r?.status ?? "ask_to_confirm") as AvailabilityStatus, quantity: r?.quantity?.toString() ?? "" }; })();
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list).slice(0, MAX_IMAGES - images.length);
    if (list.length > files.length) toast.error(`الحد الأقصى ${MAX_IMAGES} صور`);
    setBusy(true);
    const up = await uploadImages(files, "products");
    setImages((i) => [...i, ...up]);
    setBusy(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let id = product?.id;
      if (editable) {
        const row = {
          name: f.name.trim(), brand: f.brand.trim(), model: f.model.trim() || null, description: f.description.trim() || null,
          specifications: textToSpecs(f.specs), price: f.price ? Number(f.price) : null, currency: f.currency.trim() || null,
          is_featured: f.is_featured, images: images as unknown as never,
          search_text: searchKeywords(f.name, f.brand, f.model),
          ...(can("product:visibility") ? { status: f.status as ProductRow["status"] } : {}),
        };
        if (product) { const { error } = await supabase.from("products").update(row).eq("id", product.id); if (error) throw error; }
        else { const { data, error } = await supabase.from("products").insert(row).select("id").single(); if (error) throw error; id = data.id; }
      }
      if (id && can("inventory:edit")) {
        const rows = branches.map((b) => { const s = stockOf(b.id); return { product_id: id!, branch_id: b.id, status: s.status, quantity: s.quantity === "" ? null : Math.max(0, parseInt(s.quantity) || 0), updated_at: new Date().toISOString() }; });
        if (rows.length) { const { error } = await supabase.from("inventory").upsert(rows, { onConflict: "product_id,branch_id" }); if (error) throw error; }
      }
      if (product) { const removed = imagesOf(product).filter((o) => !images.some((i) => i.path === o.path)).map((i) => i.path); if (removed.length) await supabase.storage.from(BUCKET).remove(removed); }
      toast.success("تم الحفظ");
      qc.invalidateQueries();
      onClose();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title={product ? "تعديل المنتج" : "منتج جديد"} onClose={onClose}>
      <form onSubmit={save} className="grid gap-4">
        <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم *"><input required value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
          <Field label="الماركة *"><input required value={f.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} /></Field>
          <Field label="الموديل"><input value={f.model} onChange={(e) => set("model", e.target.value)} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="السعر"><input type="number" min={0} value={f.price} onChange={(e) => set("price", e.target.value)} className={inputCls} /></Field>
            <Field label="العملة"><input value={f.currency} placeholder="ل.س" onChange={(e) => set("currency", e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="الوصف" className="sm:col-span-2"><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} className={`${inputCls} h-auto py-2`} /></Field>
          <Field label="المواصفات (سطر لكل مواصفة: الاسم: القيمة)" className="sm:col-span-2"><textarea rows={4} value={f.specs} onChange={(e) => set("specs", e.target.value)} placeholder={"الذاكرة: 256GB\nالشاشة: 6.7 إنش"} className={`${inputCls} h-auto py-2`} /></Field>
          {can("product:visibility") && (
            <Field label="الحالة"><select value={f.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>{(Object.keys(STATUS_AR) as ProductRow["status"][]).filter((s) => s !== "archived" || can("product:archive")).map((s) => <option key={s} value={s}>{STATUS_AR[s]}</option>)}</select></Field>
          )}
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="size-4 accent-primary" /> منتج مميز</label>
        </fieldset>

        {editable && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">الصور ({images.length}/{MAX_IMAGES})</p>
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.path} className="relative size-20 overflow-hidden rounded-xl border border-border bg-muted">
                  {urls[img.path] && <img src={urls[img.path]} alt="" className="h-full w-full object-contain" />}
                  <button type="button" onClick={() => setImages((i) => i.filter((x) => x.path !== img.path))} className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-card shadow-soft" aria-label="إزالة"><X className="size-3" /></button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="grid size-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground smooth hover:border-primary hover:text-primary">
                  <ImagePlus className="size-5" /><input type="file" accept={OK_TYPES.join(",")} multiple hidden onChange={(e) => addFiles(e.target.files)} />
                </label>
              )}
            </div>
          </div>
        )}

        {can("inventory:edit") && branches.length > 0 && (
          <div className="rounded-2xl bg-muted p-4">
            <p className="mb-3 text-sm font-semibold">التوفر في الفروع</p>
            <div className="grid gap-2">
              {branches.map((b) => { const s = stockOf(b.id); return (
                <div key={b.id} className="grid grid-cols-[1fr_auto_5rem] items-center gap-2 text-sm">
                  <span className="truncate">{b.name}{!b.is_active && " (معطّل)"}</span>
                  <select value={s.status} onChange={(e) => setStock((x) => ({ ...x, [b.id]: { ...s, status: e.target.value as AvailabilityStatus } }))} className="h-9 rounded-lg border border-input bg-background px-2 text-xs">
                    {AVAILABILITY_STATUSES.map((a) => <option key={a} value={a}>{AVAILABILITY_LABELS_AR[a]}</option>)}
                  </select>
                  <input type="number" min={0} placeholder="الكمية" value={s.quantity} onChange={(e) => setStock((x) => ({ ...x, [b.id]: { ...s, quantity: e.target.value } }))} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" />
                </div>
              ); })}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={btnGhost}>إلغاء</button><button disabled={busy} className={btnPrimary}>{busy ? "جارٍ الحفظ..." : "حفظ"}</button></div>
      </form>
    </Modal>
  );
}

/* ---------------- Branches ---------------- */
function BranchesPanel() {
  const qc = useQueryClient();
  const { data = [] } = useAllBranches();
  const [editing, setEditing] = useState<Partial<BranchRow> | null>(null);
  const save = useMutation({
    mutationFn: async (b: Partial<BranchRow>) => {
      const row = { code: (b.code ?? "").trim().toUpperCase(), name: (b.name ?? "").trim(), address: b.address ?? "", phone: b.phone || null, whatsapp: b.whatsapp?.replace(/\D/g, "") || null, email: b.email || null, maps_url: b.maps_url || null, is_active: b.is_active ?? true, sort_order: Number(b.sort_order) || 0 };
      const { error } = b.id ? await supabase.from("branches").update(row).eq("id", b.id) : await supabase.from("branches").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحفظ"); setEditing(null); qc.invalidateQueries(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { count } = await supabase.from("inventory").select("id", { count: "exact", head: true }).eq("branch_id", id);
      if (count) throw new Error("لا يمكن حذف فرع لديه مخزون — عطّله بدلًا من ذلك");
      const { error } = await supabase.from("branches").delete().eq("id", id); if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Panel title="الفروع" action={<button className={btnPrimary} onClick={() => setEditing({ is_active: true })}><Plus className="size-4" />فرع جديد</button>}>
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((b) => (
          <div key={b.id} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-semibold">{b.name} <span className="text-xs text-muted-foreground" dir="ltr">{b.code}</span></p><p className="text-sm text-muted-foreground">{b.address}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${b.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{b.is_active ? "نشط" : "معطّل"}</span>
            </div>
            <div className="mt-3 flex gap-2"><button className={btnGhost} onClick={() => setEditing(b)}><Pencil className="size-4" />تعديل</button><button className={`${btnGhost} text-destructive`} onClick={() => confirm("حذف الفرع؟") && del.mutate(b.id)}><Trash2 className="size-4" /></button></div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title={editing.id ? "تعديل الفرع" : "فرع جديد"} onClose={() => setEditing(null)}>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="grid gap-4 sm:grid-cols-2">
            {([["code", "الرمز *", true], ["name", "الاسم *", true], ["address", "العنوان", false], ["phone", "الهاتف", false], ["whatsapp", "واتساب (بالصيغة الدولية مثل 9639...)", false], ["email", "البريد", false], ["maps_url", "رابط الخريطة", false], ["sort_order", "الترتيب", false]] as const).map(([k, l, req]) => (
              <Field key={k} label={l}><input required={req} value={(editing[k] as string | number | null | undefined) ?? ""} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} className={inputCls} /></Field>
            ))}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="size-4 accent-primary" /> فرع نشط</label>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setEditing(null)} className={btnGhost}>إلغاء</button><button disabled={save.isPending} className={btnPrimary}>حفظ</button></div>
          </form>
        </Modal>
      )}
    </Panel>
  );
}

/* ---------------- Offers ---------------- */
function OffersPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin", "offers"], queryFn: async () => (await supabase.from("offers").select("*").order("sort_order")).data ?? [] });
  const [editing, setEditing] = useState<Partial<OfferRow> | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!editing) return;
    if (editing.cta_url && !editing.cta_url.startsWith("https://")) { toast.error("الرابط يجب أن يبدأ بـ https://"); return; }
    setBusy(true);
    const row = { title: editing.title ?? "", description: editing.description || null, image_url: editing.image_url || null, cta_label: editing.cta_label || null, cta_url: editing.cta_url || null, is_active: editing.is_active ?? true, sort_order: Number(editing.sort_order) || 0 };
    const { error } = editing.id ? await supabase.from("offers").update(row).eq("id", editing.id) : await supabase.from("offers").insert(row);
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("تم الحفظ"); setEditing(null); qc.invalidateQueries();
  };
  const remove = async (id: string) => { const { error } = await supabase.from("offers").delete().eq("id", id); if (error) toast.error(errMsg(error)); else qc.invalidateQueries(); };
  return (
    <Panel title="العروض" action={<button className={btnPrimary} onClick={() => setEditing({ is_active: true })}><Plus className="size-4" />عرض جديد</button>}>
      <div className="grid gap-2">
        {data.length === 0 && <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground">لا توجد عروض.</div>}
        {data.map((o) => (
          <div key={o.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{o.title}</p><p className="truncate text-xs text-muted-foreground">{o.is_active ? "ظاهر" : "مخفي"}</p></div>
            <button onClick={() => setEditing(o)} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="تعديل"><Pencil className="size-4" /></button>
            <button onClick={() => confirm("حذف العرض؟") && remove(o.id)} className="grid size-9 place-items-center rounded-full text-destructive hover:bg-destructive/10" aria-label="حذف"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title={editing.id ? "تعديل العرض" : "عرض جديد"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid gap-4">
            <Field label="العنوان *"><input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} /></Field>
            <Field label="الوصف"><textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={`${inputCls} h-auto py-2`} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نص الزر"><input value={editing.cta_label ?? ""} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} className={inputCls} /></Field>
              <Field label="رابط الزر (https)"><input dir="ltr" value={editing.cta_url ?? ""} onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="صورة العرض"><input type="file" accept={OK_TYPES.join(",")} onChange={async (e) => { const fl = e.target.files?.[0]; if (!fl) return; setBusy(true); const [img] = await uploadImages([fl], "offers"); setBusy(false); if (img) setEditing((x) => ({ ...x, image_url: img.path })); }} className="text-sm" /></Field>
            {editing.image_url && <p className="text-xs text-success">تم إرفاق صورة</p>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="size-4 accent-primary" /> ظاهر في المتجر</label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className={btnGhost}>إلغاء</button><button disabled={busy} className={btnPrimary}>حفظ</button></div>
          </form>
        </Modal>
      )}
    </Panel>
  );
}

/* ---------------- Settings ---------------- */
function SettingsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "settings"], queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data });
  const [f, setF] = useState<Record<string, string | boolean | null>>({});
  const v = (k: string) => (k in f ? f[k] : (data as Record<string, unknown> | null | undefined)?.[k] ?? "") as string;
  const b = (k: string) => (k in f ? f[k] : (data as Record<string, unknown> | null | undefined)?.[k]) as boolean;
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const ch = f["whatsapp_channel_url"] as string | undefined;
    if (ch && !/^https:\/\/([a-z0-9-]+\.)*(whatsapp\.com|wa\.me)\//i.test(ch)) { toast.error("رابط قناة واتساب غير صالح"); return; }
    setBusy(true);
    const { error } = await supabase.from("store_settings").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1);
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("تم حفظ الإعدادات"); setF({}); qc.invalidateQueries();
  };
  if (!data) return <div className="h-60 animate-pulse rounded-2xl bg-card" />;
  return (
    <Panel title="إعدادات المتجر">
      <form onSubmit={save} className="grid gap-4 rounded-2xl bg-card p-5 shadow-soft sm:grid-cols-2 sm:p-7">
        <Field label="اسم المتجر"><input value={v("store_name")} onChange={(e) => setF({ ...f, store_name: e.target.value })} className={inputCls} /></Field>
        <Field label="العملة"><input value={v("currency")} onChange={(e) => setF({ ...f, currency: e.target.value })} className={inputCls} /></Field>
        <Field label="نبذة" className="sm:col-span-2"><textarea rows={3} value={v("about")} onChange={(e) => setF({ ...f, about: e.target.value })} className={`${inputCls} h-auto py-2`} /></Field>
        <Field label="هاتف التواصل"><input value={v("contact_phone")} onChange={(e) => setF({ ...f, contact_phone: e.target.value || null })} className={inputCls} /></Field>
        <Field label="بريد التواصل"><input value={v("contact_email")} onChange={(e) => setF({ ...f, contact_email: e.target.value || null })} className={inputCls} /></Field>
        <Field label="قناة واتساب (https)" className="sm:col-span-2"><input dir="ltr" value={v("whatsapp_channel_url")} onChange={(e) => setF({ ...f, whatsapp_channel_url: e.target.value || null })} className={inputCls} /></Field>
        <Field label="صورة الواجهة الرئيسية" className="sm:col-span-2"><input type="file" accept={OK_TYPES.join(",")} onChange={async (e) => { const fl = e.target.files?.[0]; if (!fl) return; const [img] = await uploadImages([fl], "settings"); if (img) setF((x) => ({ ...x, hero_image_url: img.path })); }} className="text-sm" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b("show_prices")} onChange={(e) => setF({ ...f, show_prices: e.target.checked })} className="size-4 accent-primary" /> إظهار الأسعار</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b("show_quantities")} onChange={(e) => setF({ ...f, show_quantities: e.target.checked })} className="size-4 accent-primary" /> إظهار الكميات</label>
        <div className="flex justify-end sm:col-span-2"><button disabled={busy || !Object.keys(f).length} className={btnPrimary}>حفظ</button></div>
      </form>
    </Panel>
  );
}

/* ---------------- Stats ---------------- */
function StatsPanel() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [pub, all, s, w, ev] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("products").select("brand"),
        supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "search").gte("created_at", today.toISOString()),
        supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "whatsapp_click").gte("created_at", today.toISOString()),
        supabase.from("analytics_events").select("term").eq("event_type", "search").gte("created_at", since).limit(1000),
      ]);
      const terms = new Map<string, number>();
      (ev.data ?? []).forEach((r) => { const t = (r.term ?? "").trim().toLowerCase(); if (t) terms.set(t, (terms.get(t) ?? 0) + 1); });
      return {
        published: pub.count ?? 0, brands: new Set((all.data ?? []).map((r) => r.brand)).size, searches: s.count ?? 0, clicks: w.count ?? 0,
        top: Array.from(terms).sort((a, b) => b[1] - a[1]).slice(0, 10),
      };
    },
  });
  const cards = [["منتجات منشورة", data?.published], ["ماركات", data?.brands], ["عمليات بحث اليوم", data?.searches], ["نقرات واتساب اليوم", data?.clicks]] as const;
  return (
    <Panel title="الإحصائيات">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([l, n]) => <div key={l} className="rounded-2xl bg-card p-5 shadow-soft"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-2 font-display text-3xl font-bold">{n ?? "—"}</p></div>)}
      </div>
      <div className="mt-6 rounded-2xl bg-card p-5 shadow-soft">
        <h2 className="font-semibold">الأكثر بحثًا (30 يومًا)</h2>
        <ul className="mt-3 divide-y divide-border text-sm">{data?.top.length ? data.top.map(([t, c]) => <li key={t} className="flex justify-between py-2.5"><span>{t}</span><span className="text-muted-foreground">{c}</span></li>) : <li className="py-2.5 text-muted-foreground">لا توجد بيانات بعد.</li>}</ul>
      </div>
    </Panel>
  );
}

/* ---------------- Activity ---------------- */
const ACT_AR: Record<string, string> = { insert: "إضافة", update: "تعديل", delete: "حذف" };
const ENT_AR: Record<string, string> = { products: "منتج", branches: "فرع", offers: "عرض", store_settings: "الإعدادات" };
function ActivityPanel() {
  const { data = [] } = useQuery({ queryKey: ["admin", "audit"], queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [] });
  return (
    <Panel title="سجل النشاط">
      <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
        <ul className="divide-y divide-border text-sm">
          {data.length === 0 && <li className="p-6 text-center text-muted-foreground">لا يوجد نشاط بعد.</li>}
          {data.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <span><b>{ACT_AR[l.action] ?? l.action}</b> {ENT_AR[l.entity] ?? l.entity}{l.entity_label ? ` — ${l.entity_label}` : ""}</span>
              <span className="text-xs text-muted-foreground">{l.actor_name ?? "—"} · {new Date(l.created_at).toLocaleString("ar")}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ---------------- Team ---------------- */
function TeamPanel({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const list = listTeam;
  const add = (a: { data: Parameters<typeof addMember>[0] }) => addMember(a.data);
  const upd = (a: { data: Parameters<typeof updateMember>[0] }) => updateMember(a.data);
  const { data = [] } = useQuery({ queryKey: ["admin", "team"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ email: "", password: "", name: "", role: "editor" as AdminRole });
  const addMut = useMutation({ mutationFn: () => add({ data: f }), onSuccess: () => { toast.success("تمت إضافة العضو"); setOpen(false); setF({ email: "", password: "", name: "", role: "editor" }); qc.invalidateQueries({ queryKey: ["admin", "team"] }); }, onError: (e) => toast.error(errMsg(e)) });
  const updMut = useMutation({ mutationFn: (d: { userId: string; role?: AdminRole; isActive?: boolean }) => upd({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "team"] }), onError: (e) => toast.error(errMsg(e)) });
  return (
    <Panel title="فريق الإدارة" action={<button className={btnPrimary} onClick={() => setOpen(true)}><Plus className="size-4" />عضو جديد</button>}>
      <div className="grid gap-2">
        {data.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{m.display_name || m.email}</p><p className="truncate text-xs text-muted-foreground" dir="ltr">{m.email}</p></div>
            {m.user_id === userId ? <span className="rounded-full bg-secondary px-3 py-1 text-xs">{ROLE_AR[m.role as AdminRole]} (أنت)</span> : (
              <>
                <select value={m.role} onChange={(e) => updMut.mutate({ userId: m.user_id, role: e.target.value as AdminRole })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs">{ADMIN_ROLES.map((r) => <option key={r} value={r}>{ROLE_AR[r]}</option>)}</select>
                <button onClick={() => updMut.mutate({ userId: m.user_id, isActive: !m.is_active })} className={`rounded-full px-3 py-1.5 text-xs ${m.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{m.is_active ? "مفعّل" : "معطّل"}</button>
              </>
            )}
          </div>
        ))}
      </div>
      {open && (
        <Modal title="إضافة عضو" onClose={() => setOpen(false)}>
          <form onSubmit={(e) => { e.preventDefault(); addMut.mutate(); }} className="grid gap-4">
            <Field label="الاسم"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
            <Field label="البريد *"><input required type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></Field>
            <Field label="كلمة مرور مؤقتة * (12 حرفًا على الأقل)"><input required minLength={12} dir="ltr" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={inputCls} /></Field>
            <Field label="الدور"><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as AdminRole })} className={inputCls}>{ADMIN_ROLES.map((r) => <option key={r} value={r}>{ROLE_AR[r]}</option>)}</select></Field>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className={btnGhost}>إلغاء</button><button disabled={addMut.isPending} className={btnPrimary}>إضافة</button></div>
          </form>
        </Modal>
      )}
    </Panel>
  );
}

/* ---------------- Account ---------------- */
function AccountPanel() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as { password: string });
    if (error) { toast.error(error.message); return; }
    toast.success("تم تغيير كلمة المرور"); setCur(""); setPw("");
  };
  return (
    <Panel title="حسابي">
      <form onSubmit={save} className="grid max-w-md gap-4 rounded-2xl bg-card p-6 shadow-soft">
        <Field label="كلمة المرور الحالية"><input type="password" required dir="ltr" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} /></Field>
        <Field label="كلمة المرور الجديدة (12 حرفًا على الأقل)"><input type="password" required minLength={12} dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} /></Field>
        <div className="flex justify-end"><button className={btnPrimary}>تحديث</button></div>
      </form>
    </Panel>
  );
}
