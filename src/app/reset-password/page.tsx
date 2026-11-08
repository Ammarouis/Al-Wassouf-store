import type { Metadata } from "next";
import { ResetView } from "@/views/ResetView";

export const metadata: Metadata = {
  title: "تعيين كلمة مرور جديدة — الوسوف",
  description: "تعيين كلمة مرور جديدة لحساب الإدارة.",
  robots: { index: false, follow: false },
  openGraph: { title: "تعيين كلمة المرور — الوسوف", description: "تعيين كلمة مرور جديدة." },
};

export default function Page() {
  return <ResetView />;
}
