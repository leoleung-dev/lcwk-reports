import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

export async function GET(request) {
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
      `SELECT entry_month,
        COUNT(*) AS count,
        COALESCE(SUM(cost_hkd), 0) AS total
       FROM sales_entries
       WHERE entry_month BETWEEN $1 AND $2
       GROUP BY entry_month
       ORDER BY entry_month`,
      [start, end]
    );

    const rowMap = new Map(
      rows.map((row) => [
        row.entry_month,
        {
          count: Number(row.count),
          total: Number(row.total),
        },
      ])
    );

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      const key = `${yearKey}${month}`;
      const data = rowMap.get(key) || { count: 0, total: 0 };
      return {
        month: `${year}-${month}`,
        count: data.count,
        total: data.total,
      };
    });

    return NextResponse.json({ months });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load summary." },
      { status: 500 }
    );
  }
}
