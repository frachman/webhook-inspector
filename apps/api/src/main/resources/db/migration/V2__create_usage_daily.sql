CREATE TABLE usage_daily (
    event_date DATE PRIMARY KEY,
    landing_views BIGINT NOT NULL DEFAULT 0,
    endpoints_created BIGINT NOT NULL DEFAULT 0,
    webhooks_received BIGINT NOT NULL DEFAULT 0,
    endpoint_views BIGINT NOT NULL DEFAULT 0,
    request_detail_views BIGINT NOT NULL DEFAULT 0,
    rate_limited_requests BIGINT NOT NULL DEFAULT 0
);
