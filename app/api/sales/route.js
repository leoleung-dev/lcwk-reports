import { NextResponse } from "next/server";
import { getClient, query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value || "");
}

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

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
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  try {
    let entries = [];
    if (month) {
      if (!isValidMonth(month)) {
        return NextResponse.json(
          { error: "Valid month is required in YYYY-MM format." },
          { status: 400 }
        );
      }
      const entryMonth = monthToKey(month);
      entries = await query(
        `SELECT se.id,
          se.entry_date,
          se.reference,
          se.client_name,
          se.cost_hkd,
          s.name AS service
         FROM sales_entries se
         JOIN services s ON s.id = se.service_id
         WHERE se.entry_month = $1
         ORDER BY se.entry_date ASC, se.entry_seq ASC`,
        [entryMonth]
      );
    } else if (year) {
      if (!isValidYear(year)) {
        return NextResponse.json(
          { error: "Valid year is required in YYYY format." },
          { status: 400 }
        );
      }
      const yearKey = year.slice(2);
      const start = `${yearKey}01`;
      const end = `${yearKey}12`;
      entries = await query(
        `SELECT se.id,
          se.entry_date,
          se.reference,
          se.client_name,
          se.cost_hkd,
          s.name AS service
         FROM sales_entries se
         JOIN services s ON s.id = se.service_id
         WHERE se.entry_month BETWEEN $1 AND $2
         ORDER BY se.entry_date ASC, se.entry_seq ASC`,
        [start, end]
      );
    } else {
      return NextResponse.json(
        { error: "Month or year is required." },
        { status: 400 }
      );
    }

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load entries." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

  const entryDate = String(payload?.entryDate || "");
  const clientName = String(payload?.clientName || "").trim();
  const serviceId = Number(payload?.serviceId);
  const costHkd = Number(payload?.costHkd);

  if (!isValidDate(entryDate)) {
    return NextResponse.json(
      { error: "Entry date must be in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  if (!clientName) {
    return NextResponse.json(
      { error: "Client name is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(serviceId) || serviceId <= 0) {
    return NextResponse.json(
      { error: "Service selection is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(costHkd) || costHkd <= 0) {
    return NextResponse.json(
      { error: "Cost must be a positive number." },
      { status: 400 }
    );
  }

  const entryMonth = monthToKey(entryDate.slice(0, 7));
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const seqResult = await client.query(
      "SELECT COALESCE(MAX(entry_seq), 0) + 1 AS next_seq FROM sales_entries WHERE entry_month = $1",
      [entryMonth]
    );
    const entrySeq = Number(seqResult.rows[0].next_seq);
    const reference = `${String(entrySeq).padStart(3, "0")}/${entryMonth}`;

    const insertResult = await client.query(
      `WITH inserted AS (
        INSERT INTO sales_entries (
          entry_date,
          entry_month,
          entry_seq,
          reference,
          client_name,
          service_id,
          cost_hkd
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id,
          entry_date,
          reference,
          client_name,
          cost_hkd,
          service_id
      )
      SELECT inserted.id,
        inserted.entry_date,
        inserted.reference,
        inserted.client_name,
        inserted.cost_hkd,
        services.name AS service
      FROM inserted
      JOIN services ON services.id = inserted.service_id`,
      [entryDate, entryMonth, entrySeq, reference, clientName, serviceId, costHkd]
    );

    await client.query("COMMIT");

    return NextResponse.json({ entry: insertResult.rows[0] }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Service not found." },
        { status: 400 }
      );
    }

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Reference already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save entry." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PATCH(request) {
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
  const entryDate = String(payload?.entryDate || "");
  const clientName = String(payload?.clientName || "").trim();
  const serviceId = Number(payload?.serviceId);
  const costHkd = Number(payload?.costHkd);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
  }

  if (!isValidDate(entryDate)) {
    return NextResponse.json(
      { error: "Entry date must be in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  if (!clientName) {
    return NextResponse.json(
      { error: "Client name is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(serviceId) || serviceId <= 0) {
    return NextResponse.json(
      { error: "Service selection is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(costHkd) || costHkd <= 0) {
    return NextResponse.json(
      { error: "Cost must be a positive number." },
      { status: 400 }
    );
  }

  const newEntryMonth = monthToKey(entryDate.slice(0, 7));
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      "SELECT entry_month, entry_seq, reference FROM sales_entries WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    const current = currentResult.rows[0];
    let entrySeq = current.entry_seq;
    let reference = current.reference;

    if (current.entry_month !== newEntryMonth) {
      const seqResult = await client.query(
        "SELECT COALESCE(MAX(entry_seq), 0) + 1 AS next_seq FROM sales_entries WHERE entry_month = $1",
        [newEntryMonth]
      );
      entrySeq = Number(seqResult.rows[0].next_seq);
      reference = `${String(entrySeq).padStart(3, "0")}/${newEntryMonth}`;
    }

    const updateResult = await client.query(
      `WITH updated AS (
        UPDATE sales_entries
        SET entry_date = $1,
          entry_month = $2,
          entry_seq = $3,
          reference = $4,
          client_name = $5,
          service_id = $6,
          cost_hkd = $7
        WHERE id = $8
        RETURNING id,
          entry_date,
          reference,
          client_name,
          cost_hkd,
          service_id
      )
      SELECT updated.id,
        updated.entry_date,
        updated.reference,
        updated.client_name,
        updated.cost_hkd,
        services.name AS service
      FROM updated
      JOIN services ON services.id = updated.service_id`,
      [
        entryDate,
        newEntryMonth,
        entrySeq,
        reference,
        clientName,
        serviceId,
        costHkd,
        id,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({ entry: updateResult.rows[0] }, { status: 200 });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Service not found." },
        { status: 400 }
      );
    }

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Reference already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update entry." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request) {
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
      "DELETE FROM sales_entries WHERE id = $1 RETURNING id",
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete entry." },
      { status: 500 }
    );
  }
}
