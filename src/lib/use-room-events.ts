"use client";

import * as Ably from "ably";
import { useEffect, useRef, useState } from "react";
import { RoomState } from "./game-types";

type Status = "connecting" | "open" | "not_found" | "error";

const ROOM_EVENT_NAME = "state";
// How often to fall back to polling /state when Ably hasn't delivered a
// message recently. Stays tight so multiplayer feels live even if the Ably
// push path is misconfigured. Polling is the safety net, not the primary
// mechanism — when Ably is healthy these requests are mostly no-ops.
const ACTIVE_POLL_MS = 800;
const IDLE_POLL_MS = 1500;

interface RoomStatePayload {
  type: "state";
  state: RoomState;
}

interface RoomNotFoundPayload {
  type: "not_found";
  code: string;
}

function roomChannelName(code: string): string {
  return `room:${code.toUpperCase()}`;
}

function isRoomStatePayload(value: unknown): value is RoomStatePayload {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<RoomStatePayload>;
  return data.type === "state" && Boolean(data.state);
}

function isRoomNotFoundPayload(value: unknown): value is RoomNotFoundPayload {
  if (!value || typeof value !== "object") return false;
  return (value as Partial<RoomNotFoundPayload>).type === "not_found";
}

// Lightweight signature so we can tell when the polled snapshot is actually
// different from what we already have. Cheap to compute and avoids React
// re-renders on every poll tick when nothing changed.
function stateSignature(state: RoomState): string {
  return JSON.stringify({
    players: state.players.map((p) => `${p.userId}:${p.lives}:${p.eliminated ? 1 : 0}:${p.isHost ? 1 : 0}`),
    status: state.status,
    round: state.round,
    currentPlayerId: state.currentPlayerId,
    questionId: state.currentQuestion?.id ?? null,
    lastAnswer: state.lastAnswer
      ? `${state.lastAnswer.userId}:${state.lastAnswer.cause}:${state.lastAnswer.ts}`
      : null,
    bombExplodeAt: state.bombExplodeAt,
    revealUntilTs: state.revealUntilTs,
    winnerId: state.winnerId,
  });
}

export function useRoomEvents(code: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const signatureRef = useRef<string | null>(null);
  const closedRef = useRef(false);
  const stateRef = useRef<RoomState | null>(null);

  // Apply a state from anywhere (Ably push, /state poll, post-action response)
  // through the same gate so we only re-render on meaningful changes and we
  // never overwrite a fresh snapshot with a stale one in flight.
  const applyState = (next: RoomState) => {
    if (closedRef.current) return;
    const sig = stateSignature(next);
    if (sig === signatureRef.current) return;
    signatureRef.current = sig;
    stateRef.current = next;
    setState(next);
    setStatus("open");
  };

  useEffect(() => {
    if (!code) return;
    const normalizedCode = code.toUpperCase();
    closedRef.current = false;
    signatureRef.current = null;
    stateRef.current = null;
    setStatus("connecting");
    setState(null);

    const abortController = new AbortController();
    let realtime: Ably.Realtime | null = null;
    let channel: Ably.RealtimeChannel | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMessage = (message: Ably.InboundMessage) => {
      if (closedRef.current) return;
      if (isRoomStatePayload(message.data)) {
        applyState(message.data.state);
      }
    };

    async function fetchSnapshot(): Promise<"ok" | "not_found" | "error"> {
      try {
        const response = await fetch(`/api/rooms/${normalizedCode}/state`, {
          credentials: "include",
          signal: abortController.signal,
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as unknown;
        if (closedRef.current) return "ok";
        if (response.status === 404 || isRoomNotFoundPayload(payload)) {
          return "not_found";
        }
        if (!response.ok) return "error";
        if (isRoomStatePayload(payload)) {
          applyState(payload.state);
          return "ok";
        }
        return "error";
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return "ok";
        return "error";
      }
    }

    function schedulePoll() {
      if (closedRef.current) return;
      const delay =
        stateRef.current?.status === "playing" ? ACTIVE_POLL_MS : IDLE_POLL_MS;
      pollTimer = setTimeout(async () => {
        const result = await fetchSnapshot();
        if (closedRef.current) return;
        if (result === "not_found") {
          setStatus("not_found");
          return;
        }
        schedulePoll();
      }, delay);
    }

    async function start() {
      const initial = await fetchSnapshot();
      if (closedRef.current) return;
      if (initial === "not_found") {
        setStatus("not_found");
        return;
      }

      // Realtime push (Ably) — if it works the snapshot polling below mostly
      // no-ops. If Ably is misconfigured or silent the polling keeps the game
      // live.
      try {
        realtime = new Ably.Realtime({
          authCallback: async (_tokenParams, callback) => {
            try {
              const response = await fetch("/api/realtime/token", {
                credentials: "include",
              });
              const payload = (await response.json().catch(() => null)) as
                | Ably.TokenRequest
                | { error?: string }
                | null;
              if (!response.ok) {
                callback(
                  payload && "error" in payload && payload.error
                    ? payload.error
                    : "Could not authenticate realtime connection",
                  null
                );
                return;
              }
              if (!payload || typeof payload !== "object") {
                callback("Invalid realtime token response", null);
                return;
              }
              callback(null, payload as Ably.TokenRequest);
            } catch (error) {
              callback(error instanceof Error ? error.message : String(error), null);
            }
          },
        });

        realtime.connection.on("failed", (event) => {
          console.warn("[ably] connection failed:", event?.reason?.message);
        });
        realtime.connection.on("suspended", () => {
          console.warn("[ably] connection suspended; relying on polling fallback");
        });

        channel = realtime.channels.get(roomChannelName(normalizedCode));
        await channel.subscribe(ROOM_EVENT_NAME, handleMessage);
        await channel.presence.enter({ status: "online" }).catch(() => {});
      } catch (err) {
        console.warn("[ably] realtime setup failed; polling fallback only:", err);
        realtime = null;
        channel = null;
      }

      schedulePoll();
    }

    void start().catch((err) => {
      console.error("[useRoomEvents] start error:", err);
      if (!closedRef.current) setStatus((s) => (s === "not_found" ? s : "error"));
    });

    return () => {
      closedRef.current = true;
      abortController.abort();
      if (pollTimer) clearTimeout(pollTimer);
      void channel?.presence.leave().catch(() => {});
      channel?.unsubscribe(ROOM_EVENT_NAME, handleMessage);
      realtime?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return { state, status, applyState };
}
