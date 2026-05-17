import { NextRequest } from "next/server";
import { getActorFromHeaders } from "@/lib/actor";
import {
  ensureRoom,
  markAbsent,
  markPresent,
  subscribe,
} from "@/lib/game-engine";
import { RoomState } from "@/lib/game-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const encoder = new TextEncoder();

  // Identify the connecting user (best-effort).
  let userId: string | null = null;
  try {
    const actor = await getActorFromHeaders(req.headers);
    userId = actor?.id ?? null;
  } catch {
    userId = null;
  }

  let unsub: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let presenceMarked = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const initial = await ensureRoom(code);
      if (!initial) {
        send({ type: "not_found", code });
        setTimeout(() => {
          if (!closed) {
            closed = true;
            try { controller.close(); } catch {}
          }
        }, 50);
        return;
      }

      if (userId) {
        markPresent(code, userId);
        presenceMarked = true;
      }

      unsub = subscribe(code, (state: RoomState) => {
        send({ type: "state", state });
      });
      // Push the initial snapshot we already loaded so the SSE client gets
      // state even on a Lambda that just rehydrated from the durable store.
      send({ type: "state", state: initial });

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        if (closed) return;
        closed = true;
        unsub();
        if (heartbeat) clearInterval(heartbeat);
        if (presenceMarked && userId) markAbsent(code, userId);
        try { controller.close(); } catch {}
      });
    },
    cancel() {
      closed = true;
      unsub();
      if (heartbeat) clearInterval(heartbeat);
      if (presenceMarked && userId) markAbsent(code, userId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
