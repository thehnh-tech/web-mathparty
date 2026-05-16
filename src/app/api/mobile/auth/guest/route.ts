import { NextRequest, NextResponse } from "next/server";
import {
  createMobileGuestSession,
  validateGuestUsername,
} from "@/lib/actor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { username?: string } | null;
  const username = body?.username?.trim() ?? "";
  const error = validateGuestUsername(username);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const session = createMobileGuestSession(username);
  return NextResponse.json(session);
}
