const HOME_MARKDOWN = `# Webhook Inspector

Create disposable webhook endpoints and inspect requests, headers, queries,
and bodies before connecting an integration to production.

## Quick start

1. Create an endpoint with \`POST /api/endpoints\`.
2. Send a request to the returned \`webhookUrl\`.
3. Use the returned \`endpointId\` and one-time \`viewerToken\` to inspect captured requests.

## Supported webhook methods

The capture endpoint accepts GET, POST, PUT, PATCH, and DELETE requests. It
preserves the request method, path, query string, headers, content type, body,
and timestamps.

## Resources

- Usage guide: [/docs](/docs)
- API catalog: [/.well-known/api-catalog](/.well-known/api-catalog)
- OpenAPI description: [/openapi.json](/openapi.json)
- Authentication notes: [/auth.md](/auth.md)

Endpoints and captured requests expire automatically. Use synthetic,
non-sensitive data while testing.
`;

export function GET() {
  const tokenEstimate = Math.ceil(HOME_MARKDOWN.length / 4);

  return new Response(HOME_MARKDOWN, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      "x-markdown-tokens": String(tokenEstimate),
    },
  });
}
