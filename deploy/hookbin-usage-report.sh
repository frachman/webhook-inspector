#!/usr/bin/env bash
set -Eeuo pipefail

config_file=${HOOKBIN_REPORT_CONFIG:-/etc/hookbin/usage-report.env}
if [[ ! -r "$config_file" ]]; then
  echo "missing $config_file" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$config_file"

from_date=${1:-$(date -u -d '6 days ago' +%F)}
to_date=${2:-$(date -u +%F)}

docker compose --env-file "$HOOKBIN_ENV_FILE" -f "$HOOKBIN_COMPOSE_FILE" exec -T postgres \
  psql -U "$HOOKBIN_DB_USER" -d "$HOOKBIN_DB_NAME" \
  -v from_date="$from_date" -v to_date="$to_date" <<'SQL'
\pset format aligned
\pset pager off
SELECT event_date, landing_views, endpoints_created, webhooks_received,
       endpoint_views, request_detail_views, rate_limited_requests,
       CASE WHEN endpoints_created = 0 THEN 0
            ELSE round(webhooks_received::numeric / endpoints_created * 100, 2)
       END AS capture_conversion_percent
FROM usage_daily
WHERE event_date BETWEEN :'from_date'::date AND :'to_date'::date
ORDER BY event_date;

SELECT COALESCE(sum(landing_views), 0) AS landing_views,
       COALESCE(sum(endpoints_created), 0) AS endpoints_created,
       COALESCE(sum(webhooks_received), 0) AS webhooks_received,
       COALESCE(sum(endpoint_views), 0) AS endpoint_views,
       COALESCE(sum(request_detail_views), 0) AS request_detail_views,
       COALESCE(sum(rate_limited_requests), 0) AS rate_limited_requests,
       CASE WHEN COALESCE(sum(endpoints_created), 0) = 0 THEN 0
            ELSE round(sum(webhooks_received)::numeric / sum(endpoints_created) * 100, 2)
       END AS capture_conversion_percent
FROM usage_daily
WHERE event_date BETWEEN :'from_date'::date AND :'to_date'::date;
SQL
