import { NextResponse } from "next/server";
import { getClient, query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const monthKeys = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0")
);

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function normalizeStaffName(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function mapRow(row) {
  const amounts = monthKeys.reduce((acc, month) => {
    acc[month] = Number(row[`amount_${month}`] || 0);
    return acc;
  }, {});

  return {
    id: row.id,
    staffName: normalizeStaffName(row.staff_name),
    displayOrder: row.display_order,
    amounts,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function getLatestUpdatedAt(rows) {
  return rows.reduce((latest, row) => {
    const stamp = row.updated_at || row.created_at;
    if (!stamp) {
      return latest;
    }
    if (!latest) {
      return stamp;
    }
    return new Date(stamp).getTime() > new Date(latest).getTime()
      ? stamp
      : latest;
  }, null);
}

function parseEntries(entries) {
  if (!Array.isArray(entries)) {
    return { error: "Entries must be an array.", entries: null };
  }

  const parsed = [];
  const seenNames = new Set();

  for (let index = 0; index < entries.length; index += 1) {
    const row = entries[index] || {};
    const staffName = normalizeStaffName(row.staffName);
    if (!staffName) {
      return {
        error: `Row ${index + 1}: staff name is required.`,
        entries: null,
      };
    }

    const normalizedName = staffName.toLowerCase();
    if (seenNames.has(normalizedName)) {
      return {
        error: `Row ${index + 1}: duplicate staff name "${staffName}".`,
        entries: null,
      };
    }
    seenNames.add(normalizedName);

    const amounts = {};
    for (const month of monthKeys) {
      const value = Number(row?.amounts?.[month] ?? 0);
      if (!Number.isFinite(value) || value < 0) {
        return {
          error: `Row ${index + 1}: month ${month} must be zero or positive.`,
          entries: null,
        };
      }
      amounts[month] = value;
    }

    parsed.push({
      staffName,
      displayOrder: index,
      amounts,
    });
  }

  return { error: null, entries: parsed };
}

async function fetchYearRows(year, db = query) {
  const result = await db(
    `SELECT id,
      entry_year,
      staff_name,
      display_order,
      amount_01,
      amount_02,
      amount_03,
      amount_04,
      amount_05,
      amount_06,
      amount_07,
      amount_08,
      amount_09,
      amount_10,
      amount_11,
      amount_12,
      created_by,
      created_at,
      updated_by,
      updated_at
     FROM hkfh_sales_entries
     WHERE entry_year = $1
     ORDER BY display_order ASC, staff_name ASC`,
    [year]
  );
  return Array.isArray(result) ? result : result.rows || [];
}

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "hkfh-sales", limit: 120 });
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

  try {
    const rows = await fetchYearRows(year);
    return NextResponse.json({
      entries: rows.map((row) => mapRow(row)),
      updatedAt: getLatestUpdatedAt(rows),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load Hong Kong branch sales entries." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const rate = rateLimit(request, { keyPrefix: "hkfh-sales-write", limit: 60 });
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

  const year = String(payload?.year || "");
  if (!isValidYear(year)) {
    return NextResponse.json(
      { error: "Year must be in YYYY format." },
      { status: 400 }
    );
  }

  const parsed = parseEntries(payload?.entries);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rowsToSave = parsed.entries;
  const client = await getClient();

  try {
    await client.query("BEGIN");

    for (const entry of rowsToSave) {
      await client.query(
        `INSERT INTO hkfh_sales_entries (
          entry_year,
          staff_name,
          display_order,
          amount_01,
          amount_02,
          amount_03,
          amount_04,
          amount_05,
          amount_06,
          amount_07,
          amount_08,
          amount_09,
          amount_10,
          amount_11,
          amount_12,
          created_by,
          updated_by,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $16, NOW()
        )
        ON CONFLICT (entry_year, staff_name) DO UPDATE SET
          display_order = EXCLUDED.display_order,
          amount_01 = EXCLUDED.amount_01,
          amount_02 = EXCLUDED.amount_02,
          amount_03 = EXCLUDED.amount_03,
          amount_04 = EXCLUDED.amount_04,
          amount_05 = EXCLUDED.amount_05,
          amount_06 = EXCLUDED.amount_06,
          amount_07 = EXCLUDED.amount_07,
          amount_08 = EXCLUDED.amount_08,
          amount_09 = EXCLUDED.amount_09,
          amount_10 = EXCLUDED.amount_10,
          amount_11 = EXCLUDED.amount_11,
          amount_12 = EXCLUDED.amount_12,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at`,
        [
          year,
          entry.staffName,
          entry.displayOrder,
          entry.amounts["01"],
          entry.amounts["02"],
          entry.amounts["03"],
          entry.amounts["04"],
          entry.amounts["05"],
          entry.amounts["06"],
          entry.amounts["07"],
          entry.amounts["08"],
          entry.amounts["09"],
          entry.amounts["10"],
          entry.amounts["11"],
          entry.amounts["12"],
          email || "unknown",
        ]
      );
    }

    const keepNames = rowsToSave.map((row) => row.staffName);
    await client.query(
      `DELETE FROM hkfh_sales_entries
       WHERE entry_year = $1
         AND NOT (staff_name = ANY($2::text[]))`,
      [year, keepNames]
    );

    const rows = await fetchYearRows(year, (text, params) =>
      client.query(text, params)
    );
    await client.query("COMMIT");

    return NextResponse.json({
      entries: rows.map((row) => mapRow(row)),
      updatedAt: getLatestUpdatedAt(rows),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: "Failed to save Hong Kong branch sales entries." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
