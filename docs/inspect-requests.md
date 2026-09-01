# Inspect requests

The private viewer lists captures for the active endpoint. A request detail
contains:

- HTTP method and request path;
- raw query string;
- normalized request headers;
- content type and body size;
- creation and expiry timestamps;
- a text preview when the content type is textual;
- a Base64 representation for every body.

Captured HTML is displayed as text. It is not inserted into the viewer as
trusted markup.

## API access

Use the one-time viewer token as a bearer credential:

```bash
curl -sS \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  "https://hookbin.mikrolyt.com/api/endpoints/$ENDPOINT_ID/requests"
```

Keep both `$VIEWER_TOKEN` and `$ENDPOINT_ID` private. The viewer token grants
access to the captures for that endpoint.
