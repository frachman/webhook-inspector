"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Language, LanguageToggle } from "./components/LanguageToggle";

type Endpoint = {
  endpointId: string;
  webhookUrl: string;
  viewerToken: string;
  createdAt: string;
  expiresAt: string;
};

type RequestSummary = {
  id: string;
  method: string;
  path: string;
  rawQuery: string | null;
  contentType: string | null;
  bodySize: number;
  createdAt: string;
};

type RequestDetail = RequestSummary & {
  headers: Record<string, string[]>;
  bodyBase64: string;
  bodyText: string | null;
  expiresAt: string;
};

const storageKey = "webhook-inspector.endpoint";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(
    new Date(value),
  );
}

function displayPath(request: Pick<RequestSummary, "path" | "rawQuery">) {
  return request.rawQuery ? `${request.path}?${request.rawQuery}` : request.path;
}

async function responseError(response: Response) {
  const detail = await response.text();
  return detail ? `Request failed (${response.status}): ${detail}` : `Request failed (${response.status}).`;
}

export default function Home() {
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [language, setLanguage] = useState<Language>("en");
  const [requestSearch, setRequestSearch] = useState("");

  useEffect(() => {
    void fetch("/api/backend/telemetry/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "landing" }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setEndpoint(JSON.parse(saved) as Endpoint);
    } catch {
      setStorageAvailable(false);
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("webhook-inspector.language");
    if (saved === "en" || saved === "id") setLanguage(saved);
  }, []);

  function changeLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem("webhook-inspector.language", next);
  }

  const loadRequests = useCallback(async (current: Endpoint) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/backend/endpoints/${current.endpointId}/requests`, {
        headers: { Authorization: `Bearer ${current.viewerToken}` },
      });
      if (!response.ok) throw new Error(await responseError(response));
      setRequests((await response.json()) as RequestSummary[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load captured requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (endpoint) void loadRequests(endpoint);
  }, [endpoint, loadRequests]);

  async function createEndpoint() {
    setIsCreating(true);
    setError(null);
    setSelectedRequest(null);
    try {
      const response = await fetch("/api/backend/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error(await responseError(response));
      const created = (await response.json()) as Endpoint;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(created));
      } catch {
        setStorageAvailable(false);
      }
      setRequests([]);
      setEndpoint(created);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create an endpoint.");
    } finally {
      setIsCreating(false);
    }
  }

  async function selectRequest(request: RequestSummary) {
    if (!endpoint) return;
    setError(null);
    try {
      const response = await fetch(`/api/backend/endpoints/${endpoint.endpointId}/requests/${request.id}`, {
        headers: { Authorization: `Bearer ${endpoint.viewerToken}` },
      });
      if (!response.ok) throw new Error(await responseError(response));
      setSelectedRequest((await response.json()) as RequestDetail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load request detail.");
    }
  }

  async function copyWebhookUrl() {
    if (!endpoint) return;
    try {
      await navigator.clipboard.writeText(endpoint.webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Select the webhook URL and copy it manually.");
    }
  }

  function forgetEndpoint() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      setStorageAvailable(false);
    }
    setEndpoint(null);
    setRequests([]);
    setSelectedRequest(null);
    setError(null);
    setRequestSearch("");
  }

  const filteredRequests = requests.filter((request) =>
    `${request.method} ${displayPath(request)} ${request.contentType ?? ""}`.toLowerCase().includes(requestSearch.toLowerCase()),
  );

  return (
    <main>
      <div className="topbar">
        <a className="brand" href="https://mikrolyt.com"><span className="brand-mark">M</span><span>Hookbin <small>by Mikrolyt</small></span></a>
        <LanguageToggle language={language} onChange={changeLanguage} />
      </div>
      <section className="hero">
        <p className="eyebrow">{language === "id" ? "M01 · Endpoint webhook sementara" : "M01 · Disposable webhook endpoint"}</p>
        <h1>Hookbin</h1>
        <p className="intro">{language === "id" ? "Lihat persis data yang dikirim aplikasi. Body yang ditangkap ditampilkan sebagai teks, bukan dirender sebagai HTML." : "See exactly what an application sends. Captured bodies are shown as text, never rendered as HTML."}</p>
        <div className="how-it-works">
          <p className="eyebrow">{language === "id" ? "Cara kerja" : "How it works"}</p>
          <ol>
            <li>{language === "id" ? "Buat endpoint sementara." : "Create a temporary endpoint."}</li>
            <li>{language === "id" ? "Kirim request ke URL tersebut." : "Send your request to its URL."}</li>
            <li>{language === "id" ? "Refresh untuk melihat data yang masuk." : "Refresh to inspect what arrived."}</li>
          </ol>
          <Link className="guide-link" href="/docs">{language === "id" ? "Baca panduan penggunaan →" : "Read the usage guide →"}</Link>
        </div>
        {!endpoint ? (
          <button type="button" onClick={() => void createEndpoint()} disabled={isCreating}>
            {isCreating ? (language === "id" ? "Membuat endpoint…" : "Creating endpoint…") : (language === "id" ? "Buat endpoint" : "Create endpoint")}
          </button>
        ) : (
          <button type="button" className="secondary" onClick={forgetEndpoint}>Forget this endpoint</button>
        )}
      </section>

      <section className="benefits" aria-labelledby="benefits-heading">
        <p className="eyebrow">{language === "id" ? "Mengapa Hookbin?" : "Why use Hookbin?"}</p>
        <h2 id="benefits-heading">{language === "id" ? "Pahami webhook sebelum menulis handler production." : "Understand a webhook before writing your production handler."}</h2>
        <p className="muted">{language === "id" ? "Gunakan endpoint sementara untuk melihat payload nyata dari Stripe, GitHub, payment gateway, atau aplikasi Anda sendiri." : "Use a temporary endpoint to see the real payload from Stripe, GitHub, a payment gateway, or your own application."}</p>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {endpoint && (
        <section className="endpoint-card" aria-labelledby="endpoint-heading">
          <div>
            <p className="eyebrow">Send requests to</p>
            <h2 id="endpoint-heading">Your webhook URL</h2>
          </div>
          <div className="url-row">
            <code>{endpoint.webhookUrl}</code>
            <button type="button" onClick={() => void copyWebhookUrl()}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <p className="muted">
            {storageAvailable
              ? `${language === "id" ? "Viewer privat berakhir" : "This private viewer expires"} ${formatDate(endpoint.expiresAt)}. ${language === "id" ? "Kredensial hanya tersimpan di browser ini." : "Its credentials stay only in this browser."}`
              : (language === "id" ? "Browser ini memblokir local storage, sehingga endpoint akan dilupakan saat reload." : "This browser blocks local storage, so this endpoint will be forgotten when the page reloads.")}
          </p>
          <p className="endpoint-stats">{language === "id" ? "Capture" : "Captured"}: {requests.length} / 100 · {language === "id" ? "kedaluwarsa" : "expires"} {formatDate(endpoint.expiresAt)}</p>
          <div className="usage-example">
            <p className="eyebrow">Try it now</p>
            <p className="muted">Send a request from any terminal or application. The URL accepts GET, POST, PUT, PATCH, and DELETE.</p>
            <pre>{`curl -X POST '${endpoint.webhookUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Demo: webhook-inspector' \\\n  -d '{"hello":"world"}'`}</pre>
          </div>
        </section>
      )}

      {endpoint && (
        <section className="inspector" aria-label="Captured requests">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Requests</p>
              <h2>Captured traffic</h2>
            </div>
            <button type="button" className="secondary" onClick={() => void loadRequests(endpoint)} disabled={isLoading}>
              {isLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {requests.length === 0 ? <p className="empty">{language === "id" ? "Belum ada request. Kirim request ke URL webhook, lalu refresh." : "No requests yet. Send one to the webhook URL, then refresh."}</p> : (
            <div className="request-layout">
              <div>
                <label className="search-label" htmlFor="request-search">{language === "id" ? "Cari request" : "Search requests"}</label>
                <input id="request-search" className="request-search" value={requestSearch} onChange={(event) => setRequestSearch(event.target.value)} placeholder={language === "id" ? "method, path, content type" : "method, path, content type"} />
                <ol className="request-list">
                {filteredRequests.map((request) => (
                  <li key={request.id}>
                    <button type="button" className={selectedRequest?.id === request.id ? "request active" : "request"} onClick={() => void selectRequest(request)}>
                      <span className="method">{request.method}</span>
                      <span>{displayPath(request)}</span>
                      <small>{formatDate(request.createdAt)} · {request.bodySize} B</small>
                    </button>
                  </li>
                ))}
                </ol>
                {filteredRequests.length === 0 && <p className="empty">{language === "id" ? "Tidak ada hasil." : "No matching requests."}</p>}
              </div>
              {selectedRequest && <RequestPanel request={selectedRequest} endpointUrl={endpoint.webhookUrl} />}
            </div>
          )}
        </section>
      )}

      <footer className="site-footer">
        {language === "id"
          ? <>Hookbin adalah bagian dari <a href="https://mikrolyt.com">Mikrolyt</a> developer tools.</>
          : <>Hookbin is part of the <a href="https://mikrolyt.com">Mikrolyt</a> developer tools.</>}
      </footer>
    </main>
  );
}

function RequestPanel({ request, endpointUrl }: { request: RequestDetail; endpointUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const body = request.bodyText ?? (request.bodyBase64 ? `[base64]\n${request.bodyBase64}` : "");
  const curl = [`curl -X ${request.method} '${endpointUrl}'`, ...Object.entries(request.headers).filter(([name]) => !["host", "content-length"].includes(name)).map(([name, values]) => `  -H '${name}: ${values.join(", ")}'`), ...(body ? [`  --data-raw '${body.replaceAll("'", "'\\''")}'`] : [])].join(" \\\n");
  async function copy(value: string, kind: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }
  return (
    <article className="detail">
      <h2><span className="method">{request.method}</span> {displayPath(request)}</h2>
      <p className="muted">{request.contentType ?? "No content type"} · {request.bodySize} B · {formatDate(request.createdAt)}</p>
      <h3>Headers</h3>
      <dl>
        {Object.entries(request.headers).map(([name, values]) => <div key={name}><dt>{name}</dt><dd>{values.join(", ")}</dd></div>)}
      </dl>
      <h3>Body</h3>
      <div className="detail-actions">
        <button type="button" className="secondary" onClick={() => void copy(request.bodyText ?? request.bodyBase64, "body")}>{copied === "body" ? "Copied" : "Copy body"}</button>
        <button type="button" className="secondary" onClick={() => void copy(curl, "curl")}>{copied === "curl" ? "Copied" : "Copy as cURL"}</button>
      </div>
      {request.bodyText !== null ? <pre>{request.bodyText || "(empty body)"}</pre> : <pre>Binary body (Base64):{`\n`}{request.bodyBase64 || "(empty body)"}</pre>}
    </article>
  );
}
