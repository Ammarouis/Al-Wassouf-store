import type { Metadata } from "next";
import { BrandsView } from "@/views/BrandsView";

export const metadata: Metadata = {
  title: "الماركات — الوسوف للاتصالات",
  description: "تصفّح الهواتف حسب الماركة: سامسونج، أبل، شاومي وغيرها.",
  openGraph: { title: "الماركات — الوسوف", description: "تصفّح الهواتف حسب الماركة." },
};

export default function Page() {
  return <BrandsView />;
}
