# Hookbin Deployment Plan

Status: planning only — no infrastructure change has been made.

## Target and Evidence

| Item | Status | Evidence |
| --- | --- | --- |
| Intended public hostname | KNOWN | `hookbin.farandy.id` |
| Candidate host | KNOWN | SSH alias `mikrolyt-vps`, hostname `mikrolyt-us-west-1` |
| Runtime resources | KNOWN | Ubuntu 22.04; approximately 42 GB disk and 2 GB RAM available during the read-only audit |
| Reverse proxy pattern | KNOWN | Containerized Caddy owns host ports 80/443; `/srv/infra/Caddyfile` includes an existing Docker-network alias upstream |
| External Docker network | KNOWN | `web` contains Caddy and `ratecraft-web-1`; a Hookbin web upstream can join with a unique alias |
| PostgreSQL | KNOWN | Existing PostgreSQL is dedicated to RateCraft; Hookbin must use a separate container and new named volume |
| DNS for `hookbin.farandy.id` | BLOCKED | No public A or AAAA record resolved on 2026-08-24 |
| Privileged deployment access | OPERATOR-ASSISTED | `deploy` has no passwordless sudo or Docker-group access; operator is available for interactive sudo |

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

## Completed Privileged Read-only Audit

On 2026-08-24, the operator confirmed:

- Caddy is the only container publishing 80 and 443; UFW permits only 22, 80,
  and 443 inbound.
- Existing direct host publications 8080 and 8090 belong to Shlink. Hookbin
  must not use either port.
- No `/srv/hookbin` directory exists and no Hookbin Docker volume exists.
- Current named volumes are Caddy and RateCraft only; do not reuse
  `ratecraft-postgres-data`.
- `/srv/infra/Caddyfile` is a single-file bind mount into the Caddy container.
  Do not atomically replace it with `mv`; preserve its inode for edits and
  reload, or explicitly recreate the Caddy service after a pathname replacement.
- No application PostgreSQL backup or restore procedure was found. The only
  scheduled backup timer is `dpkg-db-backup`; static Caddy and Compose repair
  backups are not a database recovery strategy.

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
5. Back up the existing Caddyfile, edit its existing inode, validate from the
   Caddy container, then reload Caddy using its verified operator procedure.
   Do not use atomic replacement followed only by reload.
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
