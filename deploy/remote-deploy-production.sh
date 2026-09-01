#!/usr/bin/env bash
set -eu

image_tag="$1"
release_sha="${image_tag#sha-}"
cd /srv/hookbin
backup="/srv/hookbin/.env.pre-$release_sha"
cp .env "$backup"
rollback() {
  cp "$backup" .env
  docker compose --env-file .env -f docker-compose.yml up -d api web >/dev/null 2>&1 || true
}
trap rollback ERR
sed -i "s#^HOOKBIN_API_IMAGE=.*#HOOKBIN_API_IMAGE=ghcr.io/frachman/webhook-inspector-api:$image_tag#; s#^HOOKBIN_WEB_IMAGE=.*#HOOKBIN_WEB_IMAGE=ghcr.io/frachman/webhook-inspector-web:$image_tag#" .env
docker compose --env-file .env -f docker-compose.yml pull api web
docker compose --env-file .env -f docker-compose.yml up -d api web
for attempt in $(seq 1 30); do
  api_health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' hookbin-api-1)
  web_health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' hookbin-web-1)
  if [ "$api_health" = healthy ] && [ "$web_health" = healthy ]; then
    curl --fail --silent --show-error --max-time 10 https://hookbin.farandy.id/ >/dev/null
    smoke=$(mktemp)
    trap 'rm -f "$smoke"' EXIT
    curl --fail --silent --show-error --max-time 10 -H 'Content-Type: application/json' -X POST https://hookbin.farandy.id/api/backend/endpoints -d '{}' >"$smoke"
    webhook_url=$(jq -er '.webhookUrl' "$smoke")
    endpoint_id=$(jq -er '.endpointId' "$smoke")
    viewer_token=$(jq -er '.viewerToken' "$smoke")
    curl --fail --silent --show-error --max-time 10 -H 'Content-Type: application/json' -X POST "$webhook_url" -d '{"smoke":"production"}' >/dev/null
    curl --fail --silent --show-error --max-time 10 -H "Authorization: Bearer $viewer_token" "https://hookbin.farandy.id/api/backend/endpoints/$endpoint_id/requests" | jq -e 'length >= 1' >/dev/null
    trap - ERR
    echo "production deployment verified: $image_tag"
    exit 0
  fi
  sleep 5
done
echo "production deployment did not become healthy" >&2
exit 1
