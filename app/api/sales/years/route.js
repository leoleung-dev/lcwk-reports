import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "sales-years", limit: 60 });
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
      `SELECT DISTINCT SUBSTRING(entry_month, 1, 2) AS year_key
       FROM sales_entries
       ORDER BY year_key DESC`
    );
    const years = rows.map((row) => `20${row.year_key}`);
    return NextResponse.json({ years });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load sales years." },
      { status: 500 }
    );
  }
}
