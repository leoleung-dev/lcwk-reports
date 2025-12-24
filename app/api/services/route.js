import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  try {
    const services = await query(
      "SELECT id, name FROM services WHERE is_active = true ORDER BY LOWER(name) ASC"
    );
    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load services." },
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

  const name = String(payload?.name || "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Service name is required." },
      { status: 400 }
    );
  }

  try {
    const rows = await query(
      `INSERT INTO services (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [name]
    );
    return NextResponse.json({ service: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add service." },
      { status: 500 }
    );
  }
}
