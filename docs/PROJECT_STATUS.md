# Webhook Inspector Project Status

Last updated: 2026-08-24

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

Repository baseline:

- branch: `main`
- completed implementation commit: `3660906`
- first GitHub integration commit: `558c812`
- remote: `git@github.com:frachman/webhook-inspector.git`

Always use Git itself for the current commit and branch; the hashes above are
historical milestone anchors, not a substitute for live state.

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
- No application-level rate limiting.
- No staging or production deployment configuration.
- Forwarded-header handling for externally generated webhook URLs is not yet
  configured or production-tested.

These limitations are acceptable for the completed backend vertical slice but
must be addressed before public exposure as appropriate.

## Recommended Next Milestone

Next milestone: deployment planning for public exposure.

Smallest useful scope:

1. Select and perform a read-only suitability audit of the hosting target for
   `hookbin.farandy.id`; do not infer a host from prior projects.
2. Design deployment, PostgreSQL backup/restore, TLS, forwarding-header, and
   exposure controls for that target before making any infrastructure change.
3. Make the first deployment only after the plan, backup readiness, and exact
   target identity are accepted.

Current deployment-planning evidence is in `docs/DEPLOYMENT_PLAN.md`. The
candidate Mikrolyt VPS has a compatible Caddy/Docker topology, but privileged
preflight access is pending and `hookbin.farandy.id` has no public DNS record.

Do not add accounts, SSE, distributed infrastructure, or broad portfolio polish
as part of this milestone.

## Updating This File

Update this document only with repository-backed facts. Record tests that were
actually run, distinguish untested behavior, and replace the recommended next
milestone when it is completed.
