import { NextResponse } from "next/server";
import { listAuthAttempts } from "@/lib/auth-audit";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));

  try {
    const attempts = await listAuthAttempts(limitParam || 50);
    return NextResponse.json({ attempts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load auth activity." },
      { status: 500 }
    );
  }
}
