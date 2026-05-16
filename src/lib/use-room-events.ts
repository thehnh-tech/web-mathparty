"use client";

import { useEffect, useState } from "react";
import { RoomState } from "./game-types";

type Status = "connecting" | "open" | "not_found" | "error";

export function useRoomEvents(code: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    if (!code) return;
    setStatus("connecting");
    setState(null);

    const es = new EventSource(`/api/rooms/${code}/events`);

    es.onopen = () => setStatus("open");

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "not_found") {
          setStatus("not_found");
          es.close();
        } else if (data.type === "state") {
          setState(data.state as RoomState);
          setStatus("open");
        }
      } catch {
        // ignore malformed payloads
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects; only flip to error if not_found already set isn't the case
      setStatus((s) => (s === "not_found" ? s : "error"));
    };

    return () => es.close();
  }, [code]);

  return { state, status };
}
