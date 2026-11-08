import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AVAILABILITY_LABELS_AR, buildWhatsAppUrl, isNewArrival, normalizeText, productInquiryMessage, type AvailabilityStatus } from "./shared";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type BranchRow = Database["public"]["Tables"]["branches"]["Row"];
export type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
export type SettingsRow = Database["public"]["Tables"]["store_settings"]["Row"];
export type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];

export type StoredImage = { path: string; alt?: string };
export const BUCKET = "product-images";
const URL_TTL = 60 * 60 * 24 * 7;

/** Resolve storage paths to viewable URLs (bucket is private; links are signed). */
export async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (!unique.length) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, URL_TTL);
  const map: Record<string, string> = {};
  data?.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
  return map;
}

export function imagesOf(p: Pick<ProductRow, "images">): StoredImage[] {
  return Array.isArray(p.images) ? (p.images as unknown as StoredImage[]).filter((i) => i && typeof i.path === "string") : [];
}

export type Availability = { branchCode: string; branchName: string; status: AvailabilityStatus; label: string; quantity: number | null; whatsappUrl?: string | undefined };
export type PublicProduct = ProductRow & { imageUrls: string[]; availability: Availability[]; isNew: boolean };

async function decorate(products: ProductRow[]): Promise<PublicProduct[]> {
  if (!products.length) return [];
  const ids = products.map((p) => p.id);
  const [{ data: inv }, { data: branches }, urls] = await Promise.all([
    supabase.from("inventory").select("*").in("product_id", ids),
    supabase.from("branches").select("*").eq("is_active", true).order("sort_order"),
    signPaths(products.flatMap((p) => imagesOf(p).map((i) => i.path))),
  ]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return products.map((p) => {
    const availability: Availability[] = (branches ?? []).flatMap((b) => {
      const row = inv?.find((i) => i.product_id === p.id && i.branch_id === b.id);
      if (!row) return [];
      const url = `${origin}/product/${encodeURIComponent(p.product_code)}`;
      return [{
        branchCode: b.code, branchName: b.name, status: row.status, label: AVAILABILITY_LABELS_AR[row.status], quantity: row.quantity,
        whatsappUrl: buildWhatsAppUrl(b.whatsapp ?? undefined, productInquiryMessage(p.name, url)),
      }];
    });
    return { ...p, imageUrls: imagesOf(p).map((i) => urls[i.path]).filter((u): u is string => !!u), availability, isNew: p.published_at ? isNewArrival(p.published_at) : false };
  });
}

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data } = await supabase.from("store_settings").select("id, store_name, about, show_prices, show_quantities, currency, contact_address, whatsapp_channel_url, hero_image_url, updated_at").eq("id", 1).maybeSingle();
    const heroUrl = data?.hero_image_url ? (await signPaths([data.hero_image_url]))[data.hero_image_url] : undefined;
    return { settings: data, heroUrl };
  },
  staleTime: 60_000,
});

export const branchesQuery = queryOptions({
  queryKey: ["branches", "public"],
  queryFn: async () => {
    const { data } = await supabase.from("branches").select("*").eq("is_active", true).order("sort_order");
    return data ?? [];
  },
  staleTime: 60_000,
});

export const offersQuery = queryOptions({
  queryKey: ["offers", "public"],
  queryFn: async () => {
    const { data } = await supabase.from("offers").select("*").eq("is_active", true).order("sort_order");
    const urls = await signPaths((data ?? []).map((o) => o.image_url ?? ""));
    return (data ?? []).map((o) => ({ ...o, imageSrc: o.image_url ? urls[o.image_url] : undefined }));
  },
  staleTime: 60_000,
});

export const latestQuery = (limit = 8) => queryOptions({
  queryKey: ["products", "latest", limit],
  queryFn: async () => {
    const { data } = await supabase.from("products").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(limit);
    return decorate(data ?? []);
  },
  staleTime: 30_000,
});

export const brandsQuery = queryOptions({
  queryKey: ["brands"],
  queryFn: async () => {
    const { data } = await supabase.from("products").select("brand").eq("status", "published");
    const counts = new Map<string, number>();
    (data ?? []).forEach((r) => counts.set(r.brand, (counts.get(r.brand) ?? 0) + 1));
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  },
  staleTime: 60_000,
});

export type SearchParams = { q?: string | undefined; brand?: string | undefined; branch?: string | undefined };
export const searchQuery = (s: SearchParams) => queryOptions({
  queryKey: ["products", "search", s],
  queryFn: async () => {
    let q = supabase.from("products").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(200);
    if (s.brand) q = q.ilike("brand", s.brand);
    const { data } = await q;
    let rows = data ?? [];
    const term = normalizeText(s.q ?? "");
    if (term) {
      const words = term.split(" ");
      rows = rows.filter((r) => { const hay = r.search_text || normalizeText(`${r.name} ${r.brand} ${r.model ?? ""}`); return words.every((w) => hay.includes(w)); });
    }
    let out = await decorate(rows);
    if (s.branch) out = out.filter((p) => p.availability.some((a) => a.branchCode === s.branch && a.status !== "out_of_stock"));
    return out;
  },
});

export const productQuery = (code: string) => queryOptions({
  queryKey: ["product", code],
  queryFn: async () => {
    const { data } = await supabase.from("products").select("*").eq("product_code", code).maybeSingle();
    if (!data) return null;
    return (await decorate([data]))[0];
  },
});

export function track(event_type: "search" | "whatsapp_click" | "product_view", extra: { term?: string | undefined; product_code?: string | undefined } = {}) {
  void supabase.from("analytics_events").insert({ event_type, term: extra.term?.slice(0, 120) ?? null, product_code: extra.product_code?.slice(0, 40) ?? null });
}
