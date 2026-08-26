# Hookbin First-Release Change Record

Status: implemented on 2026-08-26. This record captures the first release;
future changes still require their own approval.

## Scope

- Service: Webhook Inspector / Hookbin.
- Intended hostname: `hookbin.farandy.id`.
- Release commit: `77cfae8c48e206273b09450bb91be1e537b3ad07`.
- API image: `ghcr.io/frachman/webhook-inspector-api:sha-77cfae8c48e206273b09450bb91be1e537b3ad07`.
- Web image: `ghcr.io/frachman/webhook-inspector-web:sha-77cfae8c48e206273b09450bb91be1e537b3ad07`.
- Deployment source: `deploy/docker-compose.production.yml` copied to
  `/srv/hookbin/docker-compose.yml` with a server-only `/srv/hookbin/.env`.

## Preconditions

1. Reconfirm the target VPS identity, Caddy container, external `web` network,
   available capacity, and public IPv4 immediately before the change.
2. Create `/srv/hookbin/.env` outside Git with a unique PostgreSQL password,
   `HOOKBIN_PUBLIC_BASE_URL=https://hookbin.farandy.id`, and the exact image
   references above. Never print or commit the file.
3. Confirm the public DNS A record will point to the rechecked VPS IPv4. Do not
   create an AAAA record without a separate IPv6 review.
4. Preserve the current Caddyfile and do not atomically replace its host path;
   it is a single-file bind mount into the Caddy container.

## Planned Caddy Addition

Add exactly this site block after the Hookbin web container is healthy on the
external `web` network:

```caddyfile
hookbin.farandy.id {
  reverse_proxy webhook-inspector-web:3000
}
```

Edit the existing Caddyfile inode, validate the configuration from the Caddy
container, reload using the established operator procedure, and check existing
sites after the reload.

## Recovery Gate Before Public Ingress

The encrypted SFTP transport and homelab decryption path were proven with
synthetic content. Before DNS or Caddy exposure, run the following with real
Hookbin database content:

1. Produce a PostgreSQL logical dump in custom format with `pg_dump -Fc`.
2. Encrypt it on the VPS before it leaves the host.
3. Transfer it through the restricted SFTP backup account to off-host storage.
4. Decrypt and restore it into an isolated temporary PostgreSQL instance on
   the homelab.
5. Verify the restored database is readable, retain the encrypted artifact
   according to the operator's retention policy, and record timestamp,
   checksum, and result without recording payload data.

This passed before the Caddy site block was added. The encrypted backup artifact
and its checksum are retained in root-only verified off-host storage.

## Rollback

- Before ingress: stop only Hookbin services if necessary; retain the named
  PostgreSQL volume and encrypted backup artifact.
- After ingress: remove only the Hookbin Caddy site block using an in-place
  edit and reload; stop Hookbin services. Do not remove volumes or alter other
  Caddy sites.
- The first release has no prior deployed Hookbin image. Application rollback
  becomes available only after a later verified release.

## Approval Required

Explicit approval is required immediately before each material change: server
directory/Compose creation, starting the stack, real backup rehearsal, DNS
record creation, and Caddy modification.
