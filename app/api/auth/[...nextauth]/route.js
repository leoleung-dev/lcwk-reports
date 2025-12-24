import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

async function rateLimitedHandler(request) {
  const rate = rateLimit(request, { keyPrefix: "auth", limit: 30 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      }
    );
  }

  return handler(request);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
