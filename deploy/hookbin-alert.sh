#!/usr/bin/env bash
set -Eeuo pipefail

config_file=${HOOKBIN_ALERT_CONFIG:-/etc/hookbin/alert.env}
unit_name=${1:-unknown-unit}

if [[ ${EUID} -ne 0 ]]; then
  printf 'error: alert notifier must run as root\n' >&2
  exit 1
fi
if [[ ! -r ${config_file} ]]; then
  printf 'error: missing alert config: %s\n' "$config_file" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$config_file"
: "${HOOKBIN_ALERT_WEBHOOK_URL:?missing HOOKBIN_ALERT_WEBHOOK_URL}"

timeout_seconds=${HOOKBIN_ALERT_TIMEOUT_SECONDS:-10}
[[ ${timeout_seconds} =~ ^[0-9]+$ ]] || {
  printf 'error: alert timeout must be an integer\n' >&2
  exit 1
}

hostname_value=$(hostname --fqdn 2>/dev/null || hostname)
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
message="Hookbin alert: ${unit_name} failed on ${hostname_value} at ${timestamp}"

# The payload is intentionally provider-neutral. Providers that require a
# different envelope can be fronted by a small relay without exposing this URL.
payload=$(printf '{"text":"%s"}' "$message")
curl --fail --silent --show-error --max-time "$timeout_seconds" \
  -H 'Content-Type: application/json' \
  --data-binary "$payload" \
  "$HOOKBIN_ALERT_WEBHOOK_URL" >/dev/null
printf 'alert sent for %s\n' "$unit_name"
