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
4. Image source: decide whether the server builds from a checked-out revision
   or pulls immutable registry images. Prefer immutable images for release.

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
