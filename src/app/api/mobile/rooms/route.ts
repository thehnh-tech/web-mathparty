import { NextRequest, NextResponse } from "next/server";
import { getActorFromHeaders } from "@/lib/actor";
import * as engine from "@/lib/game-engine";
import { createRoomForActor } from "@/lib/room-service";
import { RoomType } from "@/lib/game-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const actor = await getActorFromHeaders(req.headers);
  if (!actor) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ rooms: await engine.listPublicRooms() });
}

export async function POST(req: NextRequest) {
  const actor = await getActorFromHeaders(req.headers);
  if (!actor) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    chapterId?: string;
    roomType?: RoomType;
  } | null;
  const result = await createRoomForActor(
    actor,
    body?.chapterId ?? "all",
    body?.roomType ?? "public"
  );
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
