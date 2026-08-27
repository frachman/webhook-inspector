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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Webhook Inspector",
        url: "https://hookbin.farandy.id/docs",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        description: "Temporary webhook URL for inspecting requests from integrations.",
      }) }} />
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

      <section className="docs-section">
        <h2>{language === "id" ? "Contoh penggunaan nyata" : "Real-world examples"}</h2>
        <article className="use-case">
          <h3>Stripe webhook</h3>
          <p>{language === "id" ? "Saat mengintegrasikan Stripe, gunakan URL Hookbin sebagai tujuan webhook sementara. Jalankan test event seperti checkout.session.completed untuk melihat payload JSON, header signature, dan event type sebelum membuat handler backend." : "When integrating Stripe, use your Hookbin URL as a temporary webhook destination. Trigger a test event such as checkout.session.completed to inspect the JSON payload, signature headers, and event type before writing your backend handler."}</p>
          <p className="muted">{language === "id" ? "Setelah handler siap, ganti URL Hookbin dengan endpoint production Anda. Hookbin bukan payment processor dan bukan endpoint pembayaran production." : "Once your handler is ready, replace the Hookbin URL with your production endpoint. Hookbin is not a payment processor or a production payment endpoint."}</p>
        </article>
        <article className="use-case">
          <h3>GitHub webhook</h3>
          <p>{language === "id" ? "Untuk GitHub, kirim test event push ke URL Hookbin. Periksa header X-GitHub-Event dan payload commit untuk memastikan aplikasi Anda memahami format event yang benar." : "For GitHub, send a test push event to your Hookbin URL. Inspect the X-GitHub-Event header and commit payload to confirm your application understands the event format."}</p>
        </article>
        <article className="use-case">
          <h3>Payment gateway</h3>
          <p>{language === "id" ? "Gunakan Hookbin untuk melihat notification callback dari payment gateway seperti Midtrans atau provider lain: status pembayaran, order ID, signature, dan content type dapat diperiksa sebelum endpoint production dibuat." : "Use Hookbin to inspect notification callbacks from a payment gateway such as Midtrans or another provider: payment status, order ID, signature, and content type can be checked before building the production endpoint."}</p>
        </article>
      </section>

      <section className="docs-section" id="faq">
        <h2>FAQ</h2>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "What is Webhook Inspector?", acceptedAnswer: { "@type": "Answer", text: "It creates a temporary URL that records incoming HTTP requests so you can inspect webhook integrations." } },
            { "@type": "Question", name: "Can I use it with Stripe or GitHub?", acceptedAnswer: { "@type": "Answer", text: "Yes. Use the generated URL as a temporary webhook destination while testing event payloads and headers." } },
            { "@type": "Question", name: "Is it a production webhook endpoint?", acceptedAnswer: { "@type": "Answer", text: "No. It is intended for debugging with test or non-sensitive data. Replace it with your own production endpoint when ready." } },
          ],
        }) }} />
        <details><summary>What is Webhook Inspector?</summary><p>It creates a temporary URL that records incoming HTTP requests so you can inspect webhook integrations.</p></details>
        <details><summary>Can I use it with Stripe or GitHub?</summary><p>Yes. Use the generated URL as a temporary webhook destination while testing event payloads and headers.</p></details>
        <details><summary>Is it a production webhook endpoint?</summary><p>No. It is intended for debugging with test or non-sensitive data. Replace it with your own production endpoint when ready.</p></details>
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

      <section className="docs-section">
        <h2>{language === "id" ? "Pengembangan berikutnya" : "What is next"}</h2>
        <p>{language === "id" ? "Fitur lanjutan yang sedang dipertimbangkan: replay request, export capture, signature verification, dan akun untuk menyimpan beberapa endpoint." : "Potential next features include request replay, capture export, signature verification, and accounts for keeping multiple endpoints."}</p>
        <p className="muted">{language === "id" ? "Login belum diperlukan untuk alur debugging cepat ini. Akun akan berguna ketika Anda membutuhkan endpoint persisten, riwayat lintas perangkat, atau kolaborasi tim." : "Login is not required for this quick debugging flow. Accounts become useful when you need persistent endpoints, cross-device history, or team collaboration."}</p>
      </section>
    </main>
  );
}
