import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value || "");
}

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function monthToKey(monthValue) {
  const [year, month] = monthValue.split("-");
  return `${year.slice(2)}${month}`;
}

function mapRow(row, year) {
  const monthPart = String(row.entry_month || "").slice(2);
  return {
    entryMonth: year && monthPart ? `${year}-${monthPart}` : row.entry_month,
    amountSifangjie: row.amount_sifangjie,
    amountHkShop: row.amount_hk_shop,
    amountHkPickup: row.amount_hk_pickup,
    amountBranchSales: row.amount_branch_sales,
    amountConsultant: row.amount_consultant,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "cerement", limit: 120 });
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
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  try {
    if (month) {
      if (!isValidMonth(month)) {
        return NextResponse.json(
          { error: "Valid month is required in YYYY-MM format." },
          { status: 400 }
        );
      }
      const entryMonth = monthToKey(month);
      const rows = await query(
        `SELECT entry_month,
          amount_sifangjie,
          amount_hk_shop,
          amount_hk_pickup,
          amount_branch_sales,
          amount_consultant,
          created_by,
          created_at,
          updated_by,
          updated_at
         FROM cerement_reports
         WHERE entry_month = $1`,
        [entryMonth]
      );
      const [yearValue] = month.split("-");
      return NextResponse.json({
        entry: rows[0] ? mapRow(rows[0], yearValue) : null,
      });
    }

    if (year) {
      if (!isValidYear(year)) {
        return NextResponse.json(
          { error: "Valid year is required in YYYY format." },
          { status: 400 }
        );
      }
      const yearKey = year.slice(2);
      const rows = await query(
        `SELECT entry_month,
          amount_sifangjie,
          amount_hk_shop,
          amount_hk_pickup,
          amount_branch_sales,
          amount_consultant,
          created_by,
          created_at,
          updated_by,
          updated_at
         FROM cerement_reports
         WHERE entry_month BETWEEN $1 AND $2
         ORDER BY entry_month ASC`,
        [`${yearKey}01`, `${yearKey}12`]
      );
      return NextResponse.json({
        entries: rows.map((row) => mapRow(row, year)),
      });
    }

    return NextResponse.json(
      { error: "Month or year is required." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load cerement totals." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const rate = rateLimit(request, { keyPrefix: "cerement-write", limit: 60 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      }
    );
  }

  const { email, response } = await requireAuth();
  if (response) {
    return response;
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const month = String(payload?.month || "");
  const sifangjie = Number(payload?.sifangjie || 0);
  const hkShop = Number(payload?.hkShop || 0);
  const hkPickup = Number(payload?.hkPickup || 0);
  const branchSales = Number(payload?.branchSales || 0);
  const consultant = Number(payload?.consultant || 0);

  if (!isValidMonth(month)) {
    return NextResponse.json(
      { error: "Month must be in YYYY-MM format." },
      { status: 400 }
    );
  }

  const amounts = [sifangjie, hkShop, hkPickup, branchSales, consultant];
  if (!amounts.every((value) => Number.isFinite(value) && value >= 0)) {
    return NextResponse.json(
      { error: "Amounts must be zero or positive." },
      { status: 400 }
    );
  }

  const entryMonth = monthToKey(month);

  try {
    const rows = await query(
      `INSERT INTO cerement_reports (
        entry_month,
        amount_sifangjie,
        amount_hk_shop,
        amount_hk_pickup,
        amount_branch_sales,
        amount_consultant,
        created_by,
        updated_by,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, NOW())
      ON CONFLICT (entry_month) DO UPDATE SET
        amount_sifangjie = EXCLUDED.amount_sifangjie,
        amount_hk_shop = EXCLUDED.amount_hk_shop,
        amount_hk_pickup = EXCLUDED.amount_hk_pickup,
        amount_branch_sales = EXCLUDED.amount_branch_sales,
        amount_consultant = EXCLUDED.amount_consultant,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at
      RETURNING entry_month,
        amount_sifangjie,
        amount_hk_shop,
        amount_hk_pickup,
        amount_branch_sales,
        amount_consultant,
        created_by,
        created_at,
        updated_by,
        updated_at`,
      [
        entryMonth,
        sifangjie,
        hkShop,
        hkPickup,
        branchSales,
        consultant,
        email || "unknown",
      ]
    );

    const [yearValue] = month.split("-");
    return NextResponse.json({
      entry: rows[0] ? mapRow(rows[0], yearValue) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save cerement totals." },
      { status: 500 }
    );
  }
}
