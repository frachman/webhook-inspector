# Hookbin Operator Runbook

Use this runbook only after reading `DEPLOYMENT_PLAN.md`. It begins with a
privileged read-only audit; it does not authorize deployment or DNS changes.

## Rules

- Run commands from your own terminal after connecting with `ssh mikrolyt-vps`.
- Enter sudo credentials only into your terminal; never send them to chat.
- Do not paste `.env` files, private keys, passwords, tokens, or full Docker
  inspect output into chat.
- Stop after each numbered phase and review the evidence before proceeding.

## Phase 1 — Privileged Read-only Audit

Connect and establish your interactive sudo session:

```bash
ssh mikrolyt-vps
sudo -v
```

Then run the following commands. They do not alter services or configuration:

```bash
sudo docker ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}'
sudo docker network inspect web --format '{{range .Containers}}{{.Name}} {{end}}'
sudo docker compose -f /srv/infra/docker-compose.yml ps
sudo sed -n '1,260p' /srv/infra/Caddyfile
sudo ss -ltnp
sudo ufw status verbose
sudo find /srv -maxdepth 2 -type d -name 'hookbin' -print
sudo docker volume ls --format '{{.Name}}'
```

Record only the following evidence: Caddy container/project name, `web` network
membership, public listeners, firewall status, whether `/srv/hookbin` exists,
and candidate volume names. Do not record container environment values.

## Phase 2 — Decisions Required Before Changes

Confirm these choices explicitly:

1. DNS: create only an IPv4 A record for `hookbin.farandy.id` pointing to the
   Mikrolyt VPS after the host IP is reverified. Do not create AAAA without a
   separate IPv6 audit.
2. Database backup: choose the encrypted backup destination and the operator
   who can run a restore test.
3. Deployment ownership: use `/srv/hookbin`, a dedicated Compose project,
   `hookbin-internal` network, and a named PostgreSQL volume. Do not reuse
   another application's database or volume.
4. Image source: use immutable GHCR images published from `main`. The server
   must pull the exact SHA-tagged API and web image references; it must not
   build application source during release.

## Repository Delivery Artifacts

The repository supplies the following files for review before Phase 3:

- `apps/api/Dockerfile` and `apps/web/Dockerfile` build the application images.
- `.github/workflows/ci.yml` verifies both image builds without publishing.
- `.github/workflows/publish-images.yml` publishes separate API and web images
  tagged as `sha-<Git commit>` only after CI succeeds for a `main` commit.
- `deploy/docker-compose.production.yml` keeps PostgreSQL and API private and
  attaches only the web container to the existing external `web` network.
- `deploy/hookbin.env.example` is a non-secret reference. Copy it to
  `/srv/hookbin/.env` and replace values there only.

Before allowing a first image push, confirm that the GitHub repository permits
GitHub Actions to write packages and decide whether the resulting GHCR packages
will be public (recommended for the VPS pull path) or whether the server will
hold a narrowly scoped read-only package credential outside Git.

## Phase 3 — Change Proposal Gate

Before any command that creates DNS records, directories, volumes, containers,
or Caddy configuration, prepare and approve a change record containing:

- exact target hostname and public IP;
- exact Git commit or image digest;
- Compose and Caddy diffs;
- database password handling location (never the value);
- backup and restore commands;
- verification commands;
- rollback commands.

No infrastructure mutation is permitted until this gate is explicitly accepted.
