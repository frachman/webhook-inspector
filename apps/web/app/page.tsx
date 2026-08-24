"use client";

import { useCallback, useEffect, useState } from "react";

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

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      setEndpoint(JSON.parse(saved) as Endpoint);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

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
      window.localStorage.setItem(storageKey, JSON.stringify(created));
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
    window.localStorage.removeItem(storageKey);
    setEndpoint(null);
    setRequests([]);
    setSelectedRequest(null);
    setError(null);
  }

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Disposable endpoint</p>
        <h1>Webhook Inspector</h1>
        <p className="intro">See exactly what an application sends. Captured bodies are shown as text, never rendered as HTML.</p>
        {!endpoint ? (
          <button type="button" onClick={() => void createEndpoint()} disabled={isCreating}>
            {isCreating ? "Creating endpoint…" : "Create endpoint"}
          </button>
        ) : (
          <button type="button" className="secondary" onClick={forgetEndpoint}>Forget this endpoint</button>
        )}
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
          <p className="muted">This private viewer expires {formatDate(endpoint.expiresAt)}. Its credentials stay only in this browser.</p>
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
          {requests.length === 0 ? <p className="empty">No requests yet. Send one to the webhook URL, then refresh.</p> : (
            <div className="request-layout">
              <ol className="request-list">
                {requests.map((request) => (
                  <li key={request.id}>
                    <button type="button" className={selectedRequest?.id === request.id ? "request active" : "request"} onClick={() => void selectRequest(request)}>
                      <span className="method">{request.method}</span>
                      <span>{displayPath(request)}</span>
                      <small>{formatDate(request.createdAt)} · {request.bodySize} B</small>
                    </button>
                  </li>
                ))}
              </ol>
              {selectedRequest && <RequestPanel request={selectedRequest} />}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function RequestPanel({ request }: { request: RequestDetail }) {
  return (
    <article className="detail">
      <h2><span className="method">{request.method}</span> {displayPath(request)}</h2>
      <p className="muted">{request.contentType ?? "No content type"} · {request.bodySize} B · {formatDate(request.createdAt)}</p>
      <h3>Headers</h3>
      <dl>
        {Object.entries(request.headers).map(([name, values]) => <div key={name}><dt>{name}</dt><dd>{values.join(", ")}</dd></div>)}
      </dl>
      <h3>Body</h3>
      {request.bodyText !== null ? <pre>{request.bodyText || "(empty body)"}</pre> : <pre>Binary body (Base64):{`\n`}{request.bodyBase64 || "(empty body)"}</pre>}
    </article>
  );
}
