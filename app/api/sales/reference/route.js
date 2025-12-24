import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

function monthToKey(monthValue) {
  const [year, month] = monthValue.split("-");
  return `${year.slice(2)}${month}`;
}

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "sales-reference", limit: 120 });
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
  const date = searchParams.get("date");

  if (!isValidDate(date)) {
    return NextResponse.json(
      { error: "Valid date is required in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const entryMonth = monthToKey(date.slice(0, 7));

  try {
    const rows = await query(
      "SELECT COALESCE(MAX(entry_seq), 0) + 1 AS next_seq FROM sales_entries WHERE entry_month = $1",
      [entryMonth]
    );

    const nextSeq = Number(rows[0].next_seq);
    const reference = `${String(nextSeq).padStart(3, "0")}/${entryMonth}`;

    return NextResponse.json({ reference, entryMonth, nextSeq });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate reference." },
      { status: 500 }
    );
  }
}
