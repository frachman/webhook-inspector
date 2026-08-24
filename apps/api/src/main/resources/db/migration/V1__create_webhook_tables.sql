CREATE TABLE webhook_endpoint (
    id UUID PRIMARY KEY,
    public_key VARCHAR(64) NOT NULL UNIQUE,
    viewer_token_hash BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT webhook_endpoint_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE TABLE captured_request (
    id UUID PRIMARY KEY,
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoint(id) ON DELETE CASCADE,
    method VARCHAR(16) NOT NULL,
    path TEXT NOT NULL,
    raw_query TEXT,
    headers JSONB NOT NULL,
    body BYTEA,
    content_type TEXT,
    body_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT captured_request_body_size_nonnegative CHECK (body_size >= 0),
    CONSTRAINT captured_request_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX captured_request_endpoint_created_idx
    ON captured_request (endpoint_id, created_at DESC);

CREATE INDEX webhook_endpoint_expiry_idx ON webhook_endpoint (expires_at);
CREATE INDEX captured_request_expiry_idx ON captured_request (expires_at);
