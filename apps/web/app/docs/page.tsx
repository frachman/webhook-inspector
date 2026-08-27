"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Language, LanguageToggle } from "../components/LanguageToggle";

const curlExample = [
  "curl -X POST 'YOUR_WEBHOOK_URL' \\",
  "  -H 'Content-Type: application/json' \\",
  "  -H 'X-Event: order.created' \\",
  "  -d '{\"orderId\":\"123\",\"status\":\"paid\"}'",
].join("\n");

export default function DocsPage() {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("webhook-inspector.language");
    if (saved === "en" || saved === "id") setLanguage(saved);
  }, []);
  function changeLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem("webhook-inspector.language", next);
  }

  return (
    <main className="docs-page">
      <LanguageToggle language={language} onChange={changeLanguage} />
      <Link className="back-link" href="/">← Back to inspector</Link>
      <p className="eyebrow">{language === "id" ? "Panduan penggunaan" : "Usage guide"}</p>
      <h1>{language === "id" ? "Uji webhook dalam hitungan menit" : "Test any webhook in minutes"}</h1>
      <p className="intro">{language === "id" ? "Webhook Inspector memberikan URL sementara yang merekam request HTTP agar Anda dapat memeriksa persis data yang dikirim integrasi." : "Webhook Inspector gives you a temporary URL that records incoming HTTP requests so you can inspect exactly what your integration sends."}</p>

      <section className="docs-section">
        <h2>1. {language === "id" ? "Buat endpoint" : "Create an endpoint"}</h2>
        <p>{language === "id" ? <>Kembali ke halaman utama dan klik <strong>Buat endpoint</strong>. Salin URL yang dihasilkan ke pengaturan webhook layanan atau aplikasi Anda.</> : <>Return to the home page and click <strong>Create endpoint</strong>. Copy the generated URL into the webhook setting of your service or application.</>}</p>
      </section>

      <section className="docs-section">
        <h2>2. {language === "id" ? "Kirim request" : "Send a request"}</h2>
        <p>{language === "id" ? <>Endpoint menerima <code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>, dan <code>DELETE</code>, termasuk query parameter, header, JSON, teks, dan body biner.</> : <>The endpoint accepts <code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>, and <code>DELETE</code>, including query parameters, headers, JSON, text, and binary bodies.</>}</p>
        <pre>{curlExample}</pre>
        <p>{language === "id" ? "Dari JavaScript:" : "From JavaScript:"}</p>
        <pre>{`await fetch("YOUR_WEBHOOK_URL", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ orderId: "123", status: "paid" }),
});`}</pre>
      </section>

      <section className="docs-section">
        <h2>3. {language === "id" ? "Periksa capture" : "Inspect the capture"}</h2>
        <p>{language === "id" ? <>Kembali ke inspector dan klik <strong>Refresh</strong>. Pilih request untuk melihat method, path, query string, header, content type, dan body.</> : <>Return to the inspector and click <strong>Refresh</strong>. Select a request to view its method, path, query string, headers, content type, and body.</>}</p>
      </section>

      <section className="docs-section notes">
        <h2>{language === "id" ? "Catatan penting" : "Good to know"}</h2>
        <ul>
          <li>{language === "id" ? "Endpoint dan viewer privatnya akan kedaluwarsa otomatis." : "Endpoints and their private viewer expire automatically."}</li>
          <li>{language === "id" ? "Kredensial viewer disimpan di browser ini; jangan membagikannya." : "The viewer credential is kept in this browser; do not share it."}</li>
          <li>{language === "id" ? "Gunakan data uji atau data yang tidak sensitif." : "Use test or non-sensitive data. Captured requests are intended for debugging integrations."}</li>
          <li>{language === "id" ? "URL yang dihasilkan dapat digunakan dengan provider webhook apa pun." : "Use the generated URL with any webhook provider; it does not need to be hosted on your domain."}</li>
        </ul>
      </section>
    </main>
  );
}
