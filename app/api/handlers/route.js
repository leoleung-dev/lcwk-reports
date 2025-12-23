import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const handlers = await query(
      "SELECT id, name FROM commission_handlers WHERE is_active = true ORDER BY LOWER(name) ASC"
    );
    return NextResponse.json({ handlers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load handlers." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const name = String(payload?.name || "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Handler name is required." },
      { status: 400 }
    );
  }

  try {
    const rows = await query(
      `INSERT INTO commission_handlers (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [name]
    );
    return NextResponse.json({ handler: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add handler." },
      { status: 500 }
    );
  }
}
