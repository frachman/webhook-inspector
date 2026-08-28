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
      linkset: [
        {
          anchor: `${origin}/api`,
          "service-desc": [{ href: `${origin}/openapi.json` }],
          "service-doc": [{ href: `${origin}/docs` }],
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Type": "application/linkset+json",
      },
    },
  );
}
