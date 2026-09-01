# Send a webhook

Use the generated `webhookUrl` as the destination for a provider, local
application, or test command. Hookbin captures `GET`, `POST`, `PUT`, `PATCH`,
and `DELETE` requests and responds with `202 Accepted` when a request is
captured.

## cURL

```bash
curl -X POST "$WEBHOOK_URL?source=checkout" \
  -H 'Content-Type: application/json' \
  -H 'X-Event: checkout.completed' \
  -d '{"orderId":"123","status":"paid"}'
```

## JavaScript

```javascript
await fetch(process.env.WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Event': 'checkout.completed',
  },
  body: JSON.stringify({ orderId: '123', status: 'paid' }),
});
```

The request body limit defaults to 256 KiB. Hookbin is for debugging and
integration testing, not for durable event storage.
