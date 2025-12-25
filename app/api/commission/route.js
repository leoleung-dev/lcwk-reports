import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value || "");
}

function monthToKey(monthValue) {
  const [year, month] = monthValue.split("-");
  return `${year.slice(2)}${month}`;
}

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "commission", limit: 120 });
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

  if (!isValidMonth(month)) {
    return NextResponse.json(
      { error: "Valid month is required in YYYY-MM format." },
      { status: 400 }
    );
  }

  const entryMonth = monthToKey(month);

  try {
    const entries = await query(
        `SELECT ce.id,
        ce.entry_month,
        ce.client_name,
        ce.item_shroud,
        ce.item_quilt,
        ce.item_other,
        ce.total,
        ce.commission_rate,
        ce.total_commission,
        ch.name AS handler,
        ce.created_by,
        ce.created_at
       FROM commission_entries ce
       JOIN commission_handlers ch ON ch.id = ce.handler_id
       WHERE ce.entry_month = $1
       ORDER BY ce.created_at ASC`,
      [entryMonth]
    );

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load commission entries." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const rate = rateLimit(request, { keyPrefix: "commission-write", limit: 60 });
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
  const clientName = String(payload?.clientName || "").trim();
  const handlerId = Number(payload?.handlerId);
  const itemShroud = Number(payload?.itemShroud || 0);
  const itemQuilt = Number(payload?.itemQuilt || 0);
  const itemOther = Number(payload?.itemOther || 0);
  const commissionRate = Number(payload?.commissionRate);

  if (!isValidMonth(month)) {
    return NextResponse.json(
      { error: "Month must be in YYYY-MM format." },
      { status: 400 }
    );
  }

  if (!clientName) {
    return NextResponse.json(
      { error: "Client name is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(handlerId) || handlerId <= 0) {
    return NextResponse.json(
      { error: "Handler selection is required." },
      { status: 400 }
    );
  }

  if (![itemShroud, itemQuilt, itemOther].every((value) => value >= 0)) {
    return NextResponse.json(
      { error: "Amounts must be zero or positive." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(commissionRate) || commissionRate < 0) {
    return NextResponse.json(
      { error: "Commission rate must be zero or positive." },
      { status: 400 }
    );
  }

  const entryMonth = monthToKey(month);
  const total = itemShroud + itemQuilt + itemOther;
  const totalCommission = total * commissionRate;

  try {
    const rows = await query(
      `WITH inserted AS (
        INSERT INTO commission_entries (
          entry_month,
          client_name,
          handler_id,
          item_shroud,
          item_quilt,
          item_other,
          total,
          commission_rate,
          total_commission,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id,
          entry_month,
          client_name,
          item_shroud,
          item_quilt,
          item_other,
          total,
          commission_rate,
          total_commission,
          handler_id,
          created_by,
          created_at
      )
      SELECT inserted.id,
        inserted.entry_month,
        inserted.client_name,
        inserted.item_shroud,
        inserted.item_quilt,
        inserted.item_other,
        inserted.total,
        inserted.commission_rate,
        inserted.total_commission,
        inserted.created_by,
        inserted.created_at,
        ch.name AS handler
      FROM inserted
      JOIN commission_handlers ch ON ch.id = inserted.handler_id`,
      [
        entryMonth,
        clientName,
        handlerId,
        itemShroud,
        itemQuilt,
        itemOther,
        total,
        commissionRate,
        totalCommission,
        email,
      ]
    );

    return NextResponse.json({ entry: rows[0] }, { status: 201 });
  } catch (error) {
    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Handler not found." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save commission entry." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const rate = rateLimit(request, { keyPrefix: "commission-write", limit: 60 });
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

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const id = Number(payload?.id);
  const month = String(payload?.month || "");
  const clientName = String(payload?.clientName || "").trim();
  const handlerId = Number(payload?.handlerId);
  const itemShroud = Number(payload?.itemShroud || 0);
  const itemQuilt = Number(payload?.itemQuilt || 0);
  const itemOther = Number(payload?.itemOther || 0);
  const commissionRate = Number(payload?.commissionRate);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
  }

  if (!isValidMonth(month)) {
    return NextResponse.json(
      { error: "Month must be in YYYY-MM format." },
      { status: 400 }
    );
  }

  if (!clientName) {
    return NextResponse.json(
      { error: "Client name is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(handlerId) || handlerId <= 0) {
    return NextResponse.json(
      { error: "Handler selection is required." },
      { status: 400 }
    );
  }

  if (![itemShroud, itemQuilt, itemOther].every((value) => value >= 0)) {
    return NextResponse.json(
      { error: "Amounts must be zero or positive." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(commissionRate) || commissionRate < 0) {
    return NextResponse.json(
      { error: "Commission rate must be zero or positive." },
      { status: 400 }
    );
  }

  const entryMonth = monthToKey(month);
  const total = itemShroud + itemQuilt + itemOther;
  const totalCommission = total * commissionRate;

  try {
    const rows = await query(
      `WITH updated AS (
        UPDATE commission_entries
        SET entry_month = $1,
          client_name = $2,
          handler_id = $3,
          item_shroud = $4,
          item_quilt = $5,
          item_other = $6,
          total = $7,
          commission_rate = $8,
          total_commission = $9
        WHERE id = $10
        RETURNING id,
          entry_month,
          client_name,
          item_shroud,
          item_quilt,
          item_other,
          total,
          commission_rate,
          total_commission,
          handler_id,
          created_by,
          created_at
      )
      SELECT updated.id,
        updated.entry_month,
        updated.client_name,
        updated.item_shroud,
        updated.item_quilt,
        updated.item_other,
        updated.total,
        updated.commission_rate,
        updated.total_commission,
        updated.created_by,
        updated.created_at,
        ch.name AS handler
      FROM updated
      JOIN commission_handlers ch ON ch.id = updated.handler_id`,
      [
        entryMonth,
        clientName,
        handlerId,
        itemShroud,
        itemQuilt,
        itemOther,
        total,
        commissionRate,
        totalCommission,
        id,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json({ entry: rows[0] }, { status: 200 });
  } catch (error) {
    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Handler not found." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update commission entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const rate = rateLimit(request, { keyPrefix: "commission-write", limit: 60 });
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

  let id = null;
  try {
    const { searchParams } = new URL(request.url);
    const paramId = searchParams.get("id");
    if (paramId) {
      id = Number(paramId);
    } else {
      const payload = await request.json();
      id = Number(payload?.id);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
  }

  try {
    const rows = await query(
      "DELETE FROM commission_entries WHERE id = $1 RETURNING id",
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete commission entry." },
      { status: 500 }
    );
  }
}
