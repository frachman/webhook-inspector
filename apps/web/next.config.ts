import path from "node:path";
import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value:
              '</.well-known/api-catalog>; rel="api-catalog", </openapi.json>; rel="service-desc", </docs>; rel="service-doc", </openapi.json>; rel="describedby"',
          },
          { key: "Vary", value: "Accept" },
        ],
      },
      {
        source: "/docs",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/w/:path*",
        destination: `${apiOrigin}/w/:path*`,
      },
    ];
  },
};

export default nextConfig;
