import Link from "next/link";

const curlExample = [
  "curl -X POST 'YOUR_WEBHOOK_URL' \\",
  "  -H 'Content-Type: application/json' \\",
  "  -H 'X-Event: order.created' \\",
  "  -d '{\"orderId\":\"123\",\"status\":\"paid\"}'",
].join("\n");

export default function DocsPage() {
  return (
    <main className="docs-page">
      <Link className="back-link" href="/">← Back to inspector</Link>
      <p className="eyebrow">Usage guide</p>
      <h1>Test any webhook in minutes</h1>
      <p className="intro">Webhook Inspector gives you a temporary URL that records incoming HTTP requests so you can inspect exactly what your integration sends.</p>

      <section className="docs-section">
        <h2>1. Create an endpoint</h2>
        <p>Return to the home page and click <strong>Create endpoint</strong>. Copy the generated URL into the webhook setting of your service or application.</p>
      </section>

      <section className="docs-section">
        <h2>2. Send a request</h2>
        <p>The endpoint accepts <code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>, and <code>DELETE</code>, including query parameters, headers, JSON, text, and binary bodies.</p>
        <pre>{curlExample}</pre>
        <p>From JavaScript:</p>
        <pre>{`await fetch("YOUR_WEBHOOK_URL", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ orderId: "123", status: "paid" }),
});`}</pre>
      </section>

      <section className="docs-section">
        <h2>3. Inspect the capture</h2>
        <p>Return to the inspector and click <strong>Refresh</strong>. Select a request to view its method, path, query string, headers, content type, and body.</p>
      </section>

      <section className="docs-section notes">
        <h2>Good to know</h2>
        <ul>
          <li>Endpoints and their private viewer expire automatically.</li>
          <li>The viewer credential is kept in this browser; do not share it.</li>
          <li>Use test or non-sensitive data. Captured requests are intended for debugging integrations.</li>
          <li>Use the generated URL with any webhook provider; it does not need to be hosted on your domain.</li>
        </ul>
      </section>
    </main>
  );
}
