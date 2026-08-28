import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function requestsMarkdown(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  return /(?:^|,)\s*text\/markdown(?:\s*;|\s*,|\s*$)/i.test(accept);
}

export function proxy(request: NextRequest) {
  if (requestsMarkdown(request) && (request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/docs")) {
    const markdownUrl = request.nextUrl.clone();
    markdownUrl.pathname = request.nextUrl.pathname === "/docs" ? "/agent-markdown/docs" : "/agent-markdown";
    return NextResponse.rewrite(markdownUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
