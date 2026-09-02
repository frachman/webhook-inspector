# Webhook Inspector Project Status

Last updated: 2026-08-26

## Mission

Build a small, publicly demoable webhook inspector using Spring Boot and Next.js:
create a disposable endpoint, receive arbitrary HTTP requests, persist them, and
inspect them through a private viewer.

## Current State

Milestones 0, 1, and 2 are complete, along with Milestone 3's local safeguards
and validation. The application now has a minimal web viewer over the backend
vertical slice:

```text
create endpoint -> receive webhook -> persist request -> retrieve request
```

The public repository is maintained on its `main` branch. Use Git itself for
the current commit and branch; this document is a high-level status summary,
not an operational deployment record.


## Implemented

- Spring Boot 4.1.1 API targeting Java 17.
- PostgreSQL persistence managed by Flyway.
- Anonymous endpoint creation with a configurable 1-168 hour TTL.
- Random 192-bit public webhook key.
- Independent random 256-bit viewer token; only its SHA-256 digest is stored.
- Bearer-protected request list and detail endpoints.
- GET, POST, PUT, PATCH, and DELETE webhook capture mappings.
- Captured method, path, raw query, normalized headers, raw body, content type,
  body size, creation time, and expiry time.
- Text preview for textual payloads and Base64 representation for every body.
- Configurable body limit, defaulting to 256 KB.
- Actuator health and info exposure.
- Next.js web viewer for anonymous endpoint creation.
- Browser-local storage of the endpoint ID and viewer token for the active
  anonymous session, with an in-memory fallback for browsers that block local
  storage.
- Copyable webhook URL, captured-request list, and request-detail view.
- Captured textual bodies are rendered as text inside a `pre` element; captured
  HTML is never inserted into the page as executable or rendered markup.
- A same-origin Next.js proxy routes viewer API calls to the Spring API without
  adding a broad CORS policy to the backend.
- GitHub Actions CI workflow for pushes and pull requests to `main`: Maven API
  integration tests on JDK 17, plus a reproducible Next.js production build on
  Node.js 24.
- Configurable per-endpoint captured-request cap, defaulting to 100; a capture
  at capacity evicts that endpoint's oldest request.
- Scheduled physical deletion of expired endpoints (and their requests through
  the database foreign-key cascade), defaulting to an hourly interval.
- Production Dockerfiles for the API and web viewer, both running as
  non-root users.
- A production Compose template that keeps PostgreSQL and the API on a private
  network and attaches only the web container to Caddy's existing external
  network.
- CI image-build checks and a separate GHCR publisher that emits API and web
  images tagged with the immutable Git commit SHA only after CI succeeds for a
  `main` commit.
- Configurable public webhook origin through `WEBHOOK_PUBLIC_BASE_URL`, so the
  generated capture URL is independent of private proxy hops.
- Privacy-preserving daily usage metrics buffered in memory and flushed to
  PostgreSQL, covering landing views, endpoint creation, webhook receipt,
  viewer interactions, and rate-limited requests. The operator report is
  available through `deploy/hookbin-usage-report.sh`; no payloads, tokens, or
  full IP addresses are recorded as analytics data.

## API Surface

```text
POST /api/endpoints
GET  /api/endpoints/{endpointId}/requests
GET  /api/endpoints/{endpointId}/requests/{requestId}
ANY  /w/{publicKey}  (GET, POST, PUT, PATCH, DELETE)
GET  /actuator/health
```

Viewer routes require:

```text
Authorization: Bearer <viewer-token>
```

The viewer token is returned only when an endpoint is created.

## Verified Evidence

The application has passed CI, container image build checks, local integration
tests, and a production-path smoke test covering endpoint creation, webhook
capture, authenticated request listing, and request detail. Operational
deployment, host topology, backup locations, and recovery transcripts are kept
outside this public status document.

Most recent full verification on 2026-08-24:

```bash
./scripts/project.sh verify
```

Equivalent Maven command used during Milestone 1:

```bash
mvn -f apps/api/pom.xml clean test
```

Result: 6 tests passed against an isolated PostgreSQL 17 Testcontainer.

Covered:

- endpoint creation;
- POST webhook capture and PostgreSQL persistence;
- authenticated request list and detail retrieval;
- invalid viewer-token rejection;
- oversized-body rejection.
- per-endpoint request-cap eviction.
- removal of expired endpoints and their captured requests.
- GET, POST, PUT, PATCH, and DELETE webhook capture mappings.

The required non-POST methods are mapped but have not each been exercised by an
integration test. No homelab, staging, production, or visual browser path has
been verified.

Milestone 2 web verification on 2026-08-24:

```bash
cd apps/web && npm run build
npm run start -- --port 3010
curl -sS -D - http://127.0.0.1:3010/
```

Result: the production build completed successfully, and the local-only smoke
request returned HTTP 200 with the expected page title and introductory
content. The interactive create, copy, proxy, list, and detail flows have not
been exercised against a running API in a browser.

CI workflow verification on 2026-08-24:

- `.github/workflows/ci.yml` was syntax-checked locally.
- `mvn --batch-mode --file apps/api/pom.xml test` passed locally: 3
  PostgreSQL Testcontainer integration tests passed.
- `npm ci --prefix apps/web` and `npm run build --prefix apps/web` passed
  locally.
- The first remote run (`32739823084`) completed successfully: both API tests
  and the web build passed on GitHub-hosted runners.

Local web/API smoke verification on 2026-08-24:

- A temporary PostgreSQL 17 container, Spring API, and Next.js development
  server were run together on local-only ports.
- The web proxy sequence passed: endpoint creation, POST capture, and
  authenticated request listing.
- Manual browser validation confirmed endpoint creation, copying the generated
  webhook URL, request capture, refresh, safe request-detail display, and
  endpoint persistence after a page reload.

## Decisions to Preserve

- Keep public webhook addressing separate from private viewer authorization.
- Never put viewer credentials in URLs or persistence in plaintext.
- Keep runtime credentials environment-only.
- Preserve raw request bodies; do not assume JSON-only webhooks.
- Use PostgreSQL-specific integration tests for schema and JSONB behavior.
- Production must not depend on homelab availability.
- Keep the initial application single-node and monolithic.
- Keep retention limits configurable through environment variables; do not
  allow an endpoint to retain unbounded captured bodies.

## Known Limitations

- No SSE/live updates.
- No staging deployment.
- The 2026-08-31 production audit found that the currently referenced GHCR API
  tag does not contain the expected application artifact: the public API routes
  return 404 even though the source and local tests contain them. The root cause
  was a Docker-network hostname collision: the web proxy resolved `api` to an
  unrelated stack. The production template now uses the unique `hookbin-api`
  alias; a corrected image must be published and deployed, followed by the
  functional deployment smoke test.
- A manual browser acceptance pass is still useful, but the production
  webhook-capture path is verified.
- The encrypted off-host backup transport and real PostgreSQL restore rehearsal
  passed before public ingress. Backup automation, retention handling, and
  freshness checks are represented by the deployable timer units in `deploy/`.

These limitations are acceptable for the completed backend vertical slice but
must be addressed before public exposure as appropriate.

## Recommended Next Milestone

Deploy and verify the privacy-preserving usage metrics baseline, then continue
with external alerting and recovery verification. Do not collect webhook
payloads, headers, viewer tokens, or full IP addresses as analytics data. Keep
infrastructure-specific commands and sensitive deployment evidence in
access-controlled operator documentation.

## Updating This File

Update this document only with repository-backed facts. Record tests that were
actually run, distinguish untested behavior, and replace the recommended next
milestone when it is completed.

## Brand Token Alignment (2026-09-02, branch feature/brand-token-alignment)

- The web UI (landing + usage guide) now uses the Mikrolyt brand token system: ink #111827 surface, slate #1F2937 cards, yellow #F5C518 primary accent, green-derived link tints, gray #647488 muted text, with derived tints via color-mix.
- Space Grotesk (display) and Inter (body) are loaded via next/font.
- The product name "Hookbin" is restored on the landing h1, page title, JSON-LD, and usage-guide copy; a persistent "Hookbin by Mikrolyt" brand row and footer attribution link to mikrolyt.com.
- Metadata: title "Hookbin by Mikrolyt — Webhook Inspector", og:site_name "Mikrolyt".
- Verified: `next build` for apps/web succeeds locally. Not yet verified: browser visual pass and production deployment; the branch is not merged.
