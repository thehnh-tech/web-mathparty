import { NextResponse } from "next/server";
import { getRoom } from "@/lib/game-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const state = getRoom(code);

  if (!state) {
    return NextResponse.json({ type: "not_found", code }, { status: 404 });
  }

  return NextResponse.json({ type: "state", state });
}
