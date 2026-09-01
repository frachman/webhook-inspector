# Lifecycle and limits

Hookbin resources are intentionally temporary.

| Setting | Current behavior |
| --- | --- |
| Default endpoint lifetime | 24 hours |
| Configurable endpoint lifetime | 1–168 hours |
| Default request body limit | 256 KiB |
| Captured requests per endpoint | 100; the oldest is evicted at capacity |
| Expired-resource cleanup | Scheduled hourly by default |

The endpoint and its captures are available only while the endpoint has not
expired. Expired endpoints are deleted by the cleanup job, and their captures
are removed through the database relationship. A request sent after expiry is
not captured.

These values are deployment configuration defaults and may be changed by the
operator. Hookbin should not be used as durable storage.
