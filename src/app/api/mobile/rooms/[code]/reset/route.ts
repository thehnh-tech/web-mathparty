import { NextRequest, NextResponse } from "next/server";
import { getActorFromHeaders } from "@/lib/actor";
import { resetRoomForActor } from "@/lib/room-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const actor = await getActorFromHeaders(req.headers);
  if (!actor) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { code } = await params;
  const result = await resetRoomForActor(actor, code);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
