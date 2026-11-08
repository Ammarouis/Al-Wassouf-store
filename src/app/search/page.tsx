import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/views/SearchView";
import { SkeletonGrid } from "@/components/site";

export const metadata: Metadata = {
  title: "البحث عن الأجهزة — الوسوف للاتصالات",
  description: "ابحث بالعربية أو الإنجليزية عن الهواتف حسب الماركة والفرع.",
  openGraph: { title: "البحث عن الأجهزة — الوسوف", description: "ابحث عن هاتفك وتحقق من توفره في الفروع." },
};

export default function Page() {
  // useSearchParams() requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="shell mt-24"><SkeletonGrid /></div>}>
      <SearchView />
    </Suspense>
  );
}
