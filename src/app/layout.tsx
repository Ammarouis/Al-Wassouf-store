import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../styles.css";
import { Providers } from "@/components/providers/Providers";
import { StoreChrome } from "@/components/providers/StoreChrome";

const DESC = "أحدث الهواتف الذكية وتوفرها في فروع الوسوف للاتصالات.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "الوسوف للاتصالات — عالم الهواتف الذكية",
  description: DESC,
  openGraph: { title: "الوسوف للاتصالات", description: DESC, type: "website" },
  twitter: { card: "summary_large_image" },
  icons: { icon: [{ url: "/favicon.ico", type: "image/x-icon" }] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f8fc",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>
          <StoreChrome>{children}</StoreChrome>
        </Providers>
      </body>
    </html>
  );
}
