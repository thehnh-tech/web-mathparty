"use client";

import * as Ably from "ably";
import { useEffect, useState } from "react";
import { RoomState } from "./game-types";

type Status = "connecting" | "open" | "not_found" | "error";

const ROOM_EVENT_NAME = "state";

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

export function useRoomEvents(code: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    if (!code) return;
    const normalizedCode = code.toUpperCase();
    const abortController = new AbortController();
    let closed = false;
    let realtime: Ably.Realtime | null = null;
    let channel: Ably.RealtimeChannel | null = null;

    setStatus("connecting");
    setState(null);

    const handleMessage = (message: Ably.InboundMessage) => {
      if (closed) return;
      if (isRoomStatePayload(message.data)) {
        setState(message.data.state);
        setStatus("open");
      }
    };

    async function fetchInitialState() {
      const response = await fetch(`/api/rooms/${normalizedCode}/state`, {
        credentials: "include",
        signal: abortController.signal,
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (closed) return;

      if (response.status === 404 || isRoomNotFoundPayload(payload)) {
        setStatus("not_found");
        realtime?.close();
        return;
      }

      if (!response.ok) throw new Error("Could not load room state");
      if (isRoomStatePayload(payload)) {
        setState(payload.state);
        setStatus("open");
      }
    }

    async function start() {
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

      realtime.connection.on("connected", () => {
        if (!closed) setStatus("open");
      });
      realtime.connection.on("connecting", () => {
        if (!closed) setStatus("connecting");
      });
      realtime.connection.on("disconnected", () => {
        if (!closed) setStatus("connecting");
      });
      realtime.connection.on("suspended", () => {
        if (!closed) setStatus("error");
      });
      realtime.connection.on("failed", () => {
        if (!closed) setStatus("error");
      });

      channel = realtime.channels.get(roomChannelName(normalizedCode));
      await channel.subscribe(ROOM_EVENT_NAME, handleMessage);
      await channel.presence.enter({ status: "online" }).catch(() => {});
      if (closed) return;
      setStatus("open");
      await fetchInitialState();
    }

    void start().catch(() => {
      if (!closed) setStatus((s) => (s === "not_found" ? s : "error"));
    });

    return () => {
      closed = true;
      abortController.abort();
      void channel?.presence.leave().catch(() => {});
      channel?.unsubscribe(ROOM_EVENT_NAME, handleMessage);
      realtime?.close();
    };
  }, [code]);

  return { state, status };
}
