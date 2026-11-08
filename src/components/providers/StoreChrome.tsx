"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav, Footer, Header } from "@/components/site";

/** Header / footer / bottom-nav are hidden on /admin (same as the original root route). */
export function StoreChrome({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  const isAdmin = path.startsWith("/admin");
  return (
    <>
      {!isAdmin && <Header />}
      <main key={path} className="page-enter min-h-[60vh]">
        {children}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <BottomNav />}
    </>
  );
}
