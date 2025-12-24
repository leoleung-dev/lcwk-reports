import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "commission-summary", limit: 120 });
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

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  if (!isValidYear(year)) {
    return NextResponse.json(
      { error: "Valid year is required in YYYY format." },
      { status: 400 }
    );
  }

  const yearKey = year.slice(2);
  const start = `${yearKey}01`;
  const end = `${yearKey}12`;

  try {
    const rows = await query(
      `SELECT ce.entry_month,
        ch.name AS handler,
        COUNT(*) AS count,
        COALESCE(SUM(ce.total), 0) AS total,
        COALESCE(SUM(ce.total_commission), 0) AS total_commission
       FROM commission_entries ce
       JOIN commission_handlers ch ON ch.id = ce.handler_id
       WHERE ce.entry_month BETWEEN $1 AND $2
       GROUP BY ce.entry_month, ch.name
       ORDER BY ch.name, ce.entry_month`,
      [start, end]
    );

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      return `${year}-${month}`;
    });

    return NextResponse.json({
      months,
      rows: rows.map((row) => ({
        month: `${year}-${row.entry_month.slice(2)}`,
        handler: row.handler,
        count: Number(row.count),
        total: Number(row.total),
        total_commission: Number(row.total_commission),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load commission summary." },
      { status: 500 }
    );
  }
}
