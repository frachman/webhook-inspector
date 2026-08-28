const AUTH_MARKDOWN = `# auth.md

## Audience

This service is intended for developers and automation agents that need to
inspect webhook integrations. No account or OAuth registration is required for
the disposable inspection flow.

## Registration and provisioning

Create a temporary inspection endpoint with:

\`POST /api/endpoints\`

The optional JSON field \`ttlHours\` controls the endpoint lifetime. The
response provides:

- \`webhookUrl\`: the URL that receives webhook requests;
- \`endpointId\`: the private identifier used by the viewer API; and
- \`viewerToken\`: a one-time bearer credential for reading captured requests.

## Credential use

Send supported webhook requests to \`webhookUrl\` without an authorization
header. Use the one-time \`viewerToken\` with the \`Authorization: Bearer\`
header when calling:

- \`GET /api/endpoints/{endpointId}/requests\`
- \`GET /api/endpoints/{endpointId}/requests/{requestId}\`

Viewer tokens are not included in URLs and are not stored directly by the
service. Do not log, share, or commit them. Endpoints and captured requests
expire automatically.

This service does not currently publish OAuth Protected Resource Metadata or
OAuth Authorization Server Metadata, and it does not provide agent account
registration or long-lived credentials.
`;

export function GET() {
  return new Response(AUTH_MARKDOWN, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
