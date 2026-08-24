# Webhook Inspector Project Status

Last updated: 2026-08-24

## Mission

Build a small, publicly demoable webhook inspector using Spring Boot and Next.js:
create a disposable endpoint, receive arbitrary HTTP requests, persist them, and
inspect them through a private viewer.

## Current State

Milestone 0 and Milestone 1 are complete. The backend vertical slice works:

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

Result: 3 tests passed against an isolated PostgreSQL 17 Testcontainer.

Covered:

- endpoint creation;
- POST webhook capture and PostgreSQL persistence;
- authenticated request list and detail retrieval;
- invalid viewer-token rejection;
- oversized-body rejection.

The required non-POST methods are mapped but have not each been exercised by an
integration test. No homelab, staging, production, or visual browser path has
been verified.

## Decisions to Preserve

- Keep public webhook addressing separate from private viewer authorization.
- Never put viewer credentials in URLs or persistence in plaintext.
- Keep runtime credentials environment-only.
- Preserve raw request bodies; do not assume JSON-only webhooks.
- Use PostgreSQL-specific integration tests for schema and JSONB behavior.
- Production must not depend on homelab availability.
- Keep the initial application single-node and monolithic.

## Known Limitations

- `apps/web` has not been implemented.
- No SSE/live updates.
- Expiry is enforced on capture and retrieval, but expired rows are not yet
  physically deleted by a scheduled cleanup job.
- No retained-request cap per endpoint.
- No application-level rate limiting.
- No staging or production deployment configuration.
- No CI workflow.
- Forwarded-header handling for externally generated webhook URLs is not yet
  configured or production-tested.

These limitations are acceptable for the completed backend vertical slice but
must be addressed before public exposure as appropriate.

## Recommended Next Milestone

Milestone 2: minimal Next.js web experience.

Smallest useful scope:

1. Create an endpoint from the browser.
2. Store the endpoint ID and viewer token locally for the anonymous session.
3. Show the public webhook URL with copy support.
4. List captured requests.
5. Show a safe request-detail view without rendering captured HTML.

Do not add accounts, SSE, distributed infrastructure, or broad portfolio polish
as part of this milestone.

## Updating This File

Update this document only with repository-backed facts. Record tests that were
actually run, distinguish untested behavior, and replace the recommended next
milestone when it is completed.
