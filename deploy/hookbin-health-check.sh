#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE=/etc/hookbin/health-check.env
if [[ ! -r "$CONFIG_FILE" ]]; then
  echo "missing $CONFIG_FILE" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$CONFIG_FILE"

compose=(docker compose --env-file "$HOOKBIN_ENV_FILE" -f "$HOOKBIN_COMPOSE_FILE")
for service in postgres api web; do
  container_id=$("${compose[@]}" ps -q "$service")
  if [[ -z "$container_id" ]]; then
    echo "health check failed: $service container is missing" >&2
    exit 1
  fi
  state=$(docker inspect --format '{{.State.Status}}' "$container_id")
  health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id")
  if [[ "$state" != "running" || "$health" != "healthy" ]]; then
    echo "health check failed: $service state=$state health=$health" >&2
    exit 1
  fi
done

curl --fail --silent --show-error --max-time "${HOOKBIN_PUBLIC_TIMEOUT_SECONDS:-10}" "$HOOKBIN_PUBLIC_URL/" >/dev/null
echo "health check succeeded: containers and public URL are healthy"
