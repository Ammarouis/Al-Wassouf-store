import type { Metadata } from "next";
import { AdminView } from "@/views/AdminView";

// The admin area is client-only (Supabase session lives in the browser; RLS enforces access),
// matching the original `ssr: false` route. Layout chrome is hidden for /admin by <StoreChrome />.
export const metadata: Metadata = {
  title: "لوحة الإدارة — الوسوف",
  description: "إدارة المنتجات والفروع والعروض في متجر الوسوف.",
  robots: { index: false, follow: false },
  openGraph: { title: "لوحة الإدارة — الوسوف", description: "إدارة متجر الوسوف." },
};

export default function Page() {
  return <AdminView />;
}
