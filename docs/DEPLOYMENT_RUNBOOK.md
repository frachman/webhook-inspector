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

## Phase 2 — Confirmed Decisions Before Changes

Confirm these choices explicitly:

1. DNS: create only an IPv4 A record for `hookbin.farandy.id` pointing to the
   Mikrolyt VPS after the host IP is reverified. Do not create AAAA without a
   separate IPv6 audit.
2. Database backup: use a manual encrypted PostgreSQL logical dump transferred
   through restricted SFTP to user-controlled off-host homelab storage. The
   homelab recovery key and a restore-capable operator remain outside Git. The
   actual Hookbin dump and isolated restore rehearsal are required before
   public ingress.
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
  `/srv/hookbin/.env` and replace values there only. Set
  `HOOKBIN_PUBLIC_BASE_URL` to the approved public HTTPS origin.

The GitHub Actions publish workflow has completed successfully for commit
`77cfae8c48e206273b09450bb91be1e537b3ad07`. Both GHCR packages are public and
their immutable API and web tags have been verified anonymously pullable. Put
only those exact image references in the server-only environment file.

## Phase 2.1 — Recovery Rehearsal Gate

After the private Compose stack is running but before DNS or Caddy ingress:

1. Create a real `pg_dump -Fc` from the Hookbin PostgreSQL service.
2. Encrypt it on the VPS with the configured homelab public key.
3. Upload it with the restricted backup SFTP account.
4. Decrypt and restore it on the homelab into an isolated temporary PostgreSQL
   instance; verify that the restore is readable.
5. Record only success/failure, artifact timestamp, checksum, and restore
   result. Do not commit webhook data, dump contents, private keys, or
   credentials.

The transport and decryption path has passed with synthetic content. This does
not substitute for a database backup and restore rehearsal.

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
