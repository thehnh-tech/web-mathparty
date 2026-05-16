import { NextRequest, NextResponse } from "next/server";
import { getActorFromHeaders } from "@/lib/actor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const actor = await getActorFromHeaders(req.headers);
  if (!actor) {
    return NextResponse.json({ actor: null }, { status: 401 });
  }
  return NextResponse.json({ actor });
}
