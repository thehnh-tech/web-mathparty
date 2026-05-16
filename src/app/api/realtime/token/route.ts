import { NextRequest, NextResponse } from "next/server";
import { getActorFromHeaders } from "@/lib/actor";
import {
  createRealtimeTokenRequest,
  isAblyConfigured,
} from "@/lib/ably";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const actor = await getActorFromHeaders(req.headers);
  if (!actor) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAblyConfigured()) {
    return NextResponse.json(
      { error: "Ably realtime is not configured" },
      { status: 503 }
    );
  }

  try {
    const tokenRequest = await createRealtimeTokenRequest(actor);
    return NextResponse.json(tokenRequest);
  } catch {
    return NextResponse.json(
      { error: "Could not create Ably token" },
      { status: 500 }
    );
  }
}
