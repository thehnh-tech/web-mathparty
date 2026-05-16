import { NextRequest, NextResponse } from "next/server";
import { getActorFromHeaders } from "@/lib/actor";
import {
  submitChoiceForActor,
  submitTextForActor,
} from "@/lib/room-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const actor = await getActorFromHeaders(req.headers);
  if (!actor) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { code } = await params;
  const body = (await req.json().catch(() => null)) as
    | { kind: "choice"; idx?: number }
    | { kind: "text"; value?: string }
    | null;

  if (body?.kind === "choice") {
    if (typeof body.idx !== "number") {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }
    const result = submitChoiceForActor(actor, code, body.idx);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  if (body?.kind === "text") {
    const value = typeof body.value === "string" ? body.value : "";
    const result = submitTextForActor(actor, code, value);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid answer payload" }, { status: 400 });
}
