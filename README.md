# Webhook Inspector

A disposable endpoint for seeing exactly what an application sends.

The repository is a small monorepo:

- `apps/api` — Spring Boot API and webhook receiver
- `apps/web` — reserved for the minimal Next.js viewer in Milestone 2

## Run the API

Requirements: Java 17+, Maven 3.6.3+, and PostgreSQL.

Create a database and role, then provide credentials through the environment:

```bash
export DB_URL='jdbc:postgresql://localhost:5432/webhook_dev'
export DB_USERNAME='webhook_dev'
export DB_PASSWORD='replace-me'
mvn -f apps/api/pom.xml spring-boot:run
```

Flyway applies the schema at startup. No credentials belong in this repository.

## Vertical-slice API

Create a disposable endpoint:

```bash
curl -sS -X POST http://localhost:8080/api/endpoints \
  -H 'Content-Type: application/json' \
  -d '{}'
```

The response contains a public `webhookUrl`, a private `endpointId`, and a
one-time `viewerToken`. Send any supported request to `webhookUrl`, then use:

```bash
curl -sS http://localhost:8080/api/endpoints/ENDPOINT_ID/requests \
  -H 'Authorization: Bearer VIEWER_TOKEN'
```

The viewer token is never stored directly; only its SHA-256 digest is persisted.

## Continue in a New CLI Session

Coding agents should read `AGENTS.md` automatically. For a quick manual handoff:

```bash
./scripts/project.sh context
```

Check the local toolchain with `./scripts/project.sh doctor` and run the complete
backend verification with `./scripts/project.sh verify`. The durable milestone
record, decisions, limitations, and recommended next work live in
`docs/PROJECT_STATUS.md`.
