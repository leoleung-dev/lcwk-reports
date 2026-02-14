import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "hkfh-sales-years", limit: 60 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      }
    );
  }

  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  try {
    const rows = await query(
      `SELECT DISTINCT entry_year
       FROM hkfh_sales_entries
       ORDER BY entry_year DESC`
    );
    const years = rows
      .map((row) => String(row.entry_year || "").trim())
      .filter((value) => /^\d{4}$/.test(value));
    return NextResponse.json({ years });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load Hong Kong branch sales years." },
      { status: 500 }
    );
  }
}
