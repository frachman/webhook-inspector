# Create an endpoint

The web viewer creates an anonymous disposable endpoint. The creation response
contains:

- `webhookUrl`: the public URL that receives requests;
- `endpointId`: the private identifier used by the viewer API;
- `viewerToken`: a one-time bearer credential for reading captures;
- `createdAt` and `expiresAt`: lifecycle timestamps.

The viewer stores the endpoint ID and viewer token in browser-local storage for
the active session. Do not share the viewer token with a webhook provider or
commit it to source control.

## API creation

Tools can create an endpoint directly:

```bash
curl -sS -X POST 'https://hookbin.mikrolyt.com/api/endpoints' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

The optional `ttlHours` field accepts a value from 1 to 168 hours. When omitted,
the configured default is 24 hours.
