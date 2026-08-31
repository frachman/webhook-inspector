# Webhook Inspector

> Create disposable webhook endpoints and inspect requests, headers, queries,
> and bodies.

A disposable endpoint for seeing exactly what an application sends.

Create a temporary webhook URL, send requests from any service or terminal,
then inspect the method, query string, headers, and body in a private viewer.
The hosted usage guide is available at [hookbin.mikrolyt.com/docs](https://hookbin.mikrolyt.com/docs).

The repository is a small monorepo:

- `apps/api` — Spring Boot API and webhook receiver
- `apps/web` — minimal Next.js viewer

## Quick usage

1. Start the web viewer and click **Create endpoint**.
2. Copy the generated URL into a webhook provider, application, or test command.
3. Refresh the viewer to inspect captured requests.

Example request:

```bash
curl -X POST 'YOUR_WEBHOOK_URL' \
  -H 'Content-Type: application/json' \
  -H 'X-Event: order.created' \
  -d '{"orderId":"123","status":"paid"}'
```

The endpoint accepts `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`. Endpoints and
their private viewers expire automatically. Use test or non-sensitive data;
this project is intended for debugging integrations.

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

### Disposable local PostgreSQL

For an isolated development database, start PostgreSQL in a disposable local
container. `trust` authentication is appropriate only because this binds to
localhost and the container is removed when stopped:

```bash
docker run --rm --name webhook-inspector-postgres \
  --publish 127.0.0.1:55432:5432 \
  --env POSTGRES_DB=webhook_dev \
  --env POSTGRES_USER=webhook_dev \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  postgres:17-alpine
```

In another terminal, run the API against it:

```bash
export DB_URL='jdbc:postgresql://127.0.0.1:55432/webhook_dev'
export DB_USERNAME='webhook_dev'
export DB_PASSWORD=''
mvn -f apps/api/pom.xml spring-boot:run
```

## Run the web viewer

In a second terminal, after the API is running:

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000`. The web server proxies API calls to
`http://localhost:8080` by default. Set `API_ORIGIN` if the API runs elsewhere;
see `apps/web/.env.example`. The browser retains the current endpoint ID and
viewer token in local storage, so use **Forget this endpoint** on a shared
machine.

With the disposable database and API above running, this starts the complete
local development stack. The web server proxies viewer API calls to the local
API, so no browser CORS configuration is needed.

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

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the public, high-level product roadmap.

## Production operations

The production deployment uses immutable GHCR image tags, private PostgreSQL and
API containers, scheduled encrypted PostgreSQL backups, backup verification on
off-host storage, and a five-minute container/public health check. See
[`docs/DEPLOYMENT_PLAN.md`](docs/DEPLOYMENT_PLAN.md) for the public release principles.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, verification,
commit, and Pull Request guidelines.

## Continue in a New CLI Session

Coding agents should read `AGENTS.md` automatically. For a quick manual handoff:

```bash
./scripts/project.sh context
```

Check the local toolchain with `./scripts/project.sh doctor` and run the complete
backend verification with `./scripts/project.sh verify`. The durable milestone
record, decisions, limitations, and recommended next work live in
`docs/PROJECT_STATUS.md`.
