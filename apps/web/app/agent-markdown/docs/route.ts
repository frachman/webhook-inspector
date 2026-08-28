const DOCS_MARKDOWN = `# Webhook Inspector usage guide

Webhook Inspector creates a temporary endpoint for inspecting requests sent by
Stripe, GitHub, payment gateways, and other integrations.

## Create an endpoint

Send a JSON request to \`POST /api/endpoints\`. You may provide \`ttlHours\`
between 1 and 168. The response includes a \`webhookUrl\`, \`endpointId\`, and
one-time \`viewerToken\`.

## Send a test webhook

Send GET, POST, PUT, PATCH, or DELETE requests to the returned \`webhookUrl\`.
The service captures the method, path, query string, headers, content type,
body, and timestamps.

## Inspect captured requests

Use \`Authorization: Bearer VIEWER_TOKEN\` with the viewer API:

- \`GET /api/endpoints/{endpointId}/requests\`
- \`GET /api/endpoints/{endpointId}/requests/{requestId}\`

Use synthetic, non-sensitive data while testing. Endpoints and captured
requests expire automatically.
`;

export function GET() {
  return new Response(DOCS_MARKDOWN, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      "x-markdown-tokens": String(Math.ceil(DOCS_MARKDOWN.length / 4)),
    },
  });
}
