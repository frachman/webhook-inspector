# Hookbin Deployment Plan

Status: planning only — no infrastructure change has been made.

## Target and Evidence

| Item | Status | Evidence |
| --- | --- | --- |
| Intended public hostname | KNOWN | `hookbin.farandy.id` |
| Candidate host | KNOWN | SSH alias `mikrolyt-vps`, hostname `mikrolyt-us-west-1` |
| Runtime resources | KNOWN | Ubuntu 22.04; approximately 42 GB disk and 2 GB RAM available during the read-only audit |
| Reverse proxy pattern | KNOWN | Containerized Caddy with `/srv/infra/Caddyfile`; existing `ratecraft.farandy.id` proxies to a Docker-network alias |
| External Docker network | KNOWN | Existing deployment configuration expects external network `web` |
| PostgreSQL | ASSUMED | Must be a dedicated container and named volume; privileged Docker inspection is still required to confirm current state |
| DNS for `hookbin.farandy.id` | BLOCKED | No public A or AAAA record resolved on 2026-08-24 |
| Privileged deployment access | BLOCKED | `deploy` has no passwordless sudo and no Docker-group access |

## Intended Topology

```text
Internet
  -> hookbin.farandy.id:443
  -> Caddy (existing external Docker network: web)
  -> webhook-inspector-web
  -> webhook-inspector-api
  -> dedicated PostgreSQL volume (internal network only)
```

Only Caddy should publish ports 80 and 443. The API and PostgreSQL must not be
published directly to the host. The web container should be the Caddy upstream;
it proxies viewer API calls to the API over the private application network.

## Required Preflight

1. Confirm DNS control for `farandy.id`, then create an A record for
   `hookbin.farandy.id` pointing to the audited VPS IPv4 address. Do not create
   an AAAA record unless the host's IPv6 routing is independently verified.
2. With the operator present for interactive sudo, inspect the active Caddy
   Compose project, `web` network, running containers, firewall, disk space,
   Docker version, and Caddy reload procedure.
3. Create and review production-only secret material outside Git:
   PostgreSQL password and any deployment environment file. Never put values in
   `.env.example`, repository history, terminal output, or this document.
4. Define backup and restore evidence before first exposure: PostgreSQL logical
   dump destination, encryption/access, restore command, and recovery owner.
5. Build immutable application images and a dedicated Compose stack. The
   repository does not yet contain Dockerfiles or production Compose artifacts,
   so this is a separate implementation change.

## Bounded Deployment Change

After preflight acceptance and a backup, the first release should:

1. Create a dedicated internal Docker network and named PostgreSQL volume.
2. Start PostgreSQL, apply Flyway through the API startup, then start API and
   web containers with health checks.
3. Attach only the web container to the existing `web` network with a unique
   Caddy alias.
4. Add a single `hookbin.farandy.id` Caddy site block that reverse-proxies to
   that alias; configure trusted forwarded-header handling in the API before
   relying on externally generated webhook URLs.
5. Reload Caddy using its verified operator procedure, preserving the known
   single-file bind-mount constraint.
6. Verify DNS, TLS, public endpoint creation, webhook capture, viewer access,
   backups, and rollback readiness.

## Rollback

Do not remove volumes during rollback. Revert the Caddy site block and stop
only the Hookbin application containers; retain the PostgreSQL volume for
recovery. The initial release has no prior Hookbin version, so application-image
rollback is unavailable until a second verified release exists.

## Approval Gate

Before any remote mutation, obtain explicit approval for the exact target,
DNS record, Caddy edit, Compose files, backup destination, and commands. The
read-only audit does not authorize any of those changes.
