"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">تعذر تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">حدث خطأ ما. حاول التحديث أو العودة للرئيسية.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => reset()} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">حاول مجددًا</button>
          <a href="/" className="rounded-full border border-input px-5 py-2.5 text-sm font-medium">الرئيسية</a>
        </div>
      </div>
    </div>
  );
}
