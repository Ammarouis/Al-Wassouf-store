import type { Metadata } from "next";
import { ProductView } from "@/views/ProductView";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw);
  return {
    title: `${code} — الوسوف للاتصالات`,
    description: "تفاصيل الجهاز والمواصفات والتوفر في الفروع.",
    openGraph: { title: `جهاز ${code} — الوسوف`, description: "تفاصيل الجهاز والتوفر في الفروع.", type: "website" },
  };
}

export default async function Page({ params }: Props) {
  const { code } = await params;
  return <ProductView code={decodeURIComponent(code)} />;
}
