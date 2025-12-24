import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "access-check", limit: 60 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      }
    );
  }

  const { response, email } = await requireAuth();
  if (response) {
    return response;
  }

  return NextResponse.json({ email });
}
