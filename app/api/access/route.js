import { NextResponse } from "next/server";
import {
  addAllowedEmail,
  getFallbackEmails,
  listAllowedEmails,
  normalizeAllowedEmail,
  removeAllowedEmail,
} from "@/lib/access-list";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  try {
    const entries = await listAllowedEmails();
    const fallback = getFallbackEmails();
    const existing = new Set(entries.map((entry) => entry.email));
    const fallbackEntries = fallback
      .filter((email) => !existing.has(email))
      .map((email) => ({
        id: `env-${email}`,
        email,
        addedBy: "env",
        createdAt: null,
        source: "env",
      }));

    return NextResponse.json({
      emails: [
        ...fallbackEntries,
        ...entries.map((entry) => ({ ...entry, source: "db" })),
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load access list." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { response, email: actorEmail } = await requireAuth();
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

  const email = normalizeAllowedEmail(payload?.email);
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const entry = await addAllowedEmail(email, actorEmail);
    return NextResponse.json({ entry: { ...entry, source: "db" } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add email." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

  const email = normalizeAllowedEmail(payload?.email);
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const fallback = getFallbackEmails();
  if (fallback.includes(email)) {
    return NextResponse.json(
      { error: "Email is managed by environment variables." },
      { status: 400 }
    );
  }

  try {
    await removeAllowedEmail(email);
    return NextResponse.json({ removed: email });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove email." },
      { status: 500 }
    );
  }
}
