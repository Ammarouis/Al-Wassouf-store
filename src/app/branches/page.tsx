import type { Metadata } from "next";
import { BranchesView } from "@/views/BranchesView";

export const metadata: Metadata = {
  title: "الفروع والتواصل — الوسوف للاتصالات",
  description: "عناوين فروع الوسوف وأرقام التواصل وواتساب.",
  openGraph: { title: "فروع الوسوف للاتصالات", description: "عناوين الفروع ومعلومات التواصل." },
};

export default function Page() {
  return <BranchesView />;
}
