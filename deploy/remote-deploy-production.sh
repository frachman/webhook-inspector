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
    curl --fail --silent --show-error --max-time 10 https://hookbin.mikrolyt.com/ >/dev/null
    smoke=$(mktemp)
    trap 'rm -f "$smoke"' EXIT
    curl --fail --silent --show-error --max-time 10 -H 'Content-Type: application/json' -X POST https://hookbin.mikrolyt.com/api/backend/endpoints -d '{}' >"$smoke"
    readarray -t smoke_values < <(python3 - "$smoke" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)

for key in ("webhookUrl", "endpointId", "viewerToken"):
    value = payload.get(key)
    if not isinstance(value, str) or not value:
        raise SystemExit(f"missing smoke response field: {key}")
    print(value)
PY
    )
    webhook_url="${smoke_values[0]}"
    endpoint_id="${smoke_values[1]}"
    viewer_token="${smoke_values[2]}"
    curl --fail --silent --show-error --max-time 10 -H 'Content-Type: application/json' -X POST "$webhook_url" -d '{"smoke":"production"}' >/dev/null
    curl --fail --silent --show-error --max-time 10 -H "Authorization: Bearer $viewer_token" "https://hookbin.mikrolyt.com/api/backend/endpoints/$endpoint_id/requests" | python3 -c 'import json, sys; raise SystemExit(0 if len(json.load(sys.stdin)) >= 1 else 1)'
    rm -f "$smoke"
    echo "production deployment verified: $image_tag"
    exit 0
  fi
  sleep 5
done
echo "production deployment did not become healthy" >&2
exit 1
