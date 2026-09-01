# Security and privacy

Hookbin is designed for temporary debugging with test or non-sensitive data.

- Viewer access uses a separate random bearer token; only its SHA-256 digest is
  persisted.
- The viewer token is returned when the endpoint is created and should be kept
  out of logs, source control, and public client code.
- Captured request headers and bodies are stored as data. Textual bodies are
  shown as text, not rendered as trusted HTML.
- Request bodies are bounded, and expired resources are removed.
- API and webhook requests have separate in-memory rate limits; the configured
  defaults are 60 API requests and 120 webhook requests per minute per tracked
  client key.

Do not send passwords, private keys, access tokens, payment data, or production
payloads to a disposable public endpoint. Hookbin does not make a compliance
or data-retention guarantee beyond the behavior documented here.
