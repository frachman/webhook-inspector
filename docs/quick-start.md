# Quick start

Create an endpoint in the Hookbin viewer, copy its generated webhook URL, send
a request, and refresh the viewer to inspect it.

## Send a test request

```bash
curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -H 'X-Event: order.created' \
  -d '{"orderId":"123","status":"paid"}'
```

The endpoint accepts `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`. Replace
`$WEBHOOK_URL` with the URL shown when the endpoint is created.

## Inspect the capture

Return to the private viewer and select the request. Hookbin shows its method,
path, query string, headers, content type, body, size, and timestamps.

Send only test or non-sensitive data to a disposable endpoint.
