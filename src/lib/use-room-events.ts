"use client";

import * as Ably from "ably";
import { useEffect, useRef, useState } from "react";
import { RoomState } from "./game-types";

type Status = "connecting" | "open" | "not_found" | "error";

const ROOM_EVENT_NAME = "state";
// /state polling drives the turn-by-turn progression: on Vercel the
// server can't keep setTimeouts alive past a response, so the next-turn
// advance only happens when someone reads the state. The intervals are
// tuned for "tour à tour" responsiveness, not just realtime backstop.
const ACTIVE_POLL_MS = 500;
const IDLE_POLL_MS = 1000;
const TRANSITION_BUFFER_MS = 80;

// Minimum time a reveal must remain on-screen locally so the player can
// actually read the answer/explosion feedback. Matches the server's reveal
// window — if the server lazily-advances and returns a fresher state in
// the same poll, we hold the next state in a queue until this window has
// elapsed locally so the transition stays smooth.
const LOCAL_REVEAL_HOLD_MS = 1800;

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

// Monotonic ordering: a state with a larger stamp strictly supersedes a
// smaller one. Lets us drop a stale poll response that arrives after we've
// already moved on. Reveal frames sort between adjacent rounds.
function monoStamp(state: RoomState): number {
  return state.round * 2 + (state.lastAnswer ? 1 : 0);
}

// Does applying `next` after `cur` look like a "transition" — a new question
// or moving past a reveal? Those are the changes we may need to hold off on
// to keep the reveal visible long enough for the player.
function isTransition(cur: RoomState, next: RoomState): boolean {
  if (!cur.lastAnswer) return false;
  if (!next.lastAnswer) return true;
  const curQid = cur.currentQuestion?.id ?? null;
  const nextQid = next.currentQuestion?.id ?? null;
  return curQid !== nextQid;
}

export function useRoomEvents(code: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const signatureRef = useRef<string | null>(null);
  const closedRef = useRef(false);
  const stateRef = useRef<RoomState | null>(null);
  const stampRef = useRef<number>(-1);
  const holdUntilRef = useRef<number>(0);
  const pendingRef = useRef<RoomState | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply a state from anywhere (Ably push, /state poll, post-action response)
  // through the same gate so we (a) drop stale updates that lost a race,
  // (b) hold transitions until the local reveal window has played out, and
  // (c) only re-render on meaningful changes.
  const applyState = (next: RoomState) => {
    if (closedRef.current) return;

    const stamp = monoStamp(next);
    if (stamp < stampRef.current) {
      // A poll that started before a newer state landed — drop it so we
      // don't go backwards through a reveal we already left.
      return;
    }

    const now = Date.now();
    const cur = stateRef.current;

    if (cur && isTransition(cur, next) && holdUntilRef.current > now) {
      // Defer applying the post-reveal state until the reveal has had its
      // full local window. Replace any older buffered candidate.
      pendingRef.current = next;
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          const buffered = pendingRef.current;
          pendingRef.current = null;
          if (buffered) doApply(buffered);
        }, Math.max(0, holdUntilRef.current - now) + 30);
      }
      return;
    }

    doApply(next);
  };

  function doApply(next: RoomState) {
    if (closedRef.current) return;
    const sig = stateSignature(next);
    if (sig === signatureRef.current) return;
    signatureRef.current = sig;

    const cur = stateRef.current;
    const enteringReveal = !!(
      next.lastAnswer &&
      (!cur?.lastAnswer || cur.lastAnswer.ts !== next.lastAnswer.ts)
    );
    if (enteringReveal) {
      // Start the local reveal hold using the wall clock, not the server's
      // revealUntilTs — that way clock skew between server and client can't
      // shorten the reveal animation.
      holdUntilRef.current = Date.now() + LOCAL_REVEAL_HOLD_MS;
    } else if (!next.lastAnswer) {
      holdUntilRef.current = 0;
    }

    stateRef.current = next;
    stampRef.current = monoStamp(next);
    setState(next);
    setStatus("open");
  }

  useEffect(() => {
    if (!code) return;
    const normalizedCode = code.toUpperCase();
    closedRef.current = false;
    signatureRef.current = null;
    stateRef.current = null;
    stampRef.current = -1;
    holdUntilRef.current = 0;
    pendingRef.current = null;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
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

    function computeDelay(): number {
      const cur = stateRef.current;
      if (!cur || cur.status !== "playing") return IDLE_POLL_MS;
      const now = Date.now();
      // Race the deadline: if a transition is due, fetch right after it
      // so the tour-by-tour change is visible within ~100 ms.
      const deadlines: number[] = [];
      if (cur.lastAnswer && cur.revealUntilTs !== null) {
        deadlines.push(cur.revealUntilTs - now);
      }
      if (!cur.lastAnswer && cur.bombExplodeAt !== null) {
        deadlines.push(cur.bombExplodeAt - now);
      }
      const soonest = deadlines.filter((d) => d > -2000).sort((a, b) => a - b)[0];
      if (soonest !== undefined) {
        if (soonest <= 0) return TRANSITION_BUFFER_MS;
        if (soonest < ACTIVE_POLL_MS) return soonest + TRANSITION_BUFFER_MS;
      }
      return ACTIVE_POLL_MS;
    }

    function schedulePoll() {
      if (closedRef.current) return;
      pollTimer = setTimeout(async () => {
        const result = await fetchSnapshot();
        if (closedRef.current) return;
        if (result === "not_found") {
          setStatus("not_found");
          return;
        }
        schedulePoll();
      }, computeDelay());
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
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      pendingRef.current = null;
      void channel?.presence.leave().catch(() => {});
      channel?.unsubscribe(ROOM_EVENT_NAME, handleMessage);
      realtime?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return { state, status, applyState };
}
