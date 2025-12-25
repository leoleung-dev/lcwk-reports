import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const rate = rateLimit(request, { keyPrefix: "services", limit: 120 });
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
  const rate = rateLimit(request, { keyPrefix: "services", limit: 60 });
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
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name, is_active = true
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

export async function DELETE(request) {
  const rate = rateLimit(request, { keyPrefix: "services-write", limit: 30 });
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
    return NextResponse.json(
      { error: "Valid service id is required." },
      { status: 400 }
    );
  }

  try {
    const rows = await query(
      "UPDATE services SET is_active = false WHERE id = $1 AND is_active = true RETURNING id, name",
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Service not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ service: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove service." },
      { status: 500 }
    );
  }
}
