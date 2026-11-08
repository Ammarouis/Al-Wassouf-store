import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";

export const metadata: Metadata = {
  title: "الوسوف للاتصالات — هاتفك القادم يبدأ من هنا",
  description: "تصفّح أحدث الهواتف الذكية، قارن الخيارات وتحقق من التوفر في فروع الوسوف.",
  openGraph: {
    title: "الوسوف للاتصالات — هاتفك القادم يبدأ من هنا",
    description: "تصفّح أحدث الهواتف الذكية وتحقق من التوفر في فروع الوسوف.",
  },
};

export default function Page() {
  return <HomeView />;
}
