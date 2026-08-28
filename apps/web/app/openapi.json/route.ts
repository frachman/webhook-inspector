import { headers } from "next/headers";

async function publicOrigin(): Promise<string> {
  const configured = process.env.HOOKBIN_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
  return `${forwardedProto || "http"}://${host}`;
}

export async function GET() {
  const origin = await publicOrigin();

  return Response.json(
    {
      openapi: "3.1.0",
      info: {
        title: "Webhook Inspector API",
        version: "1.0.0",
        description: "Create disposable webhook endpoints and inspect captured requests.",
      },
      servers: [{ url: origin }],
      paths: {
        "/api/endpoints": {
          post: {
            summary: "Create a disposable endpoint",
            requestBody: {
              required: false,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ttlHours: { type: "integer", minimum: 1, maximum: 168 } },
                  },
                },
              },
            },
            responses: { "200": { description: "Endpoint created" } },
          },
        },
        "/w/{publicKey}": {
          parameters: [{ name: "publicKey", in: "path", required: true, schema: { type: "string" } }],
          post: { summary: "Capture a webhook request", responses: { "202": { description: "Request captured" } } },
          get: { summary: "Capture a GET webhook request", responses: { "202": { description: "Request captured" } } },
          put: { summary: "Capture a PUT webhook request", responses: { "202": { description: "Request captured" } } },
          patch: { summary: "Capture a PATCH webhook request", responses: { "202": { description: "Request captured" } } },
          delete: { summary: "Capture a DELETE webhook request", responses: { "202": { description: "Request captured" } } },
        },
      },
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
