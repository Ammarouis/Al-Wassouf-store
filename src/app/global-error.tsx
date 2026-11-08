"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20 }}>تعذر تحميل الصفحة</h1>
          <p style={{ color: "#4b5563" }}>حدث خطأ ما. حاول التحديث.</p>
          <button onClick={() => reset()} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid #ccc", cursor: "pointer" }}>حاول مجددًا</button>
        </div>
      </body>
    </html>
  );
}
