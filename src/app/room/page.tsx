"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRoomEvents } from "@/lib/use-room-events";
import {
  joinRoomAction,
  leaveRoomAction,
  startGameAction,
  submitChoiceAction,
  submitTextAction,
  resetRoomAction,
} from "@/actions/room";
import WaitingRoom from "@/components/room/WaitingRoom";
import GameRoom from "@/components/room/GameRoom";
import FinishedScreen from "@/components/room/FinishedScreen";

function RoomContent() {
  const router = useRouter();
  const params = useSearchParams();
  const code = (params.get("code") ?? "").toUpperCase();

  const session = authClient.useSession();
  const myId = session.data?.user?.id ?? null;

  const { state, status, applyState } = useRoomEvents(code || null);

  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  // Auto-join the room once SSE confirms it exists and we have a session.
  useEffect(() => {
    if (!code || !myId || joinedRef.current) return;
    if (status !== "open" || !state) return;
    if (state.players.some((p) => p.userId === myId)) {
      joinedRef.current = true;
      return;
    }
    if (state.status !== "waiting") {
      setError("Game already started — can't join.");
      return;
    }
    joinedRef.current = true;
    joinRoomAction(code).then((res) => {
      if ("error" in res) {
        setError(res.error);
        joinedRef.current = false;
        return;
      }
      // Don't wait for the Ably broadcast — if the publish path is slow or
      // misconfigured the joiner would otherwise stay stuck on the pre-join
      // snapshot. Applying the server-confirmed state immediately makes the
      // local view consistent with the server in either case.
      applyState(res.state);
    });
  }, [applyState, code, myId, state, status]);

  // Note: we do NOT leave on unmount. Presence is tracked server-side via the
  // SSE connection — closing it triggers a grace timer (~12s) that removes the
  // player only if they don't reconnect (so refresh / navigation hops don't
  // tear the room down).

  const handleStart = useCallback(async () => {
    setError(null);
    const res = await startGameAction(code);
    if ("error" in res) setError(res.error);
  }, [code]);

  const handlePickChoice = useCallback(
    async (idx: number) => {
      setError(null);
      const res = await submitChoiceAction(code, idx);
      if ("error" in res) setError(res.error);
    },
    [code]
  );

  const handleSubmitText = useCallback(
    async (value: string) => {
      setError(null);
      const res = await submitTextAction(code, value);
      if ("error" in res) setError(res.error);
    },
    [code]
  );

  const handleReset = useCallback(async () => {
    setError(null);
    const res = await resetRoomAction(code);
    if ("error" in res) setError(res.error);
  }, [code]);

  const handleClose = useCallback(async () => {
    await leaveRoomAction(code);
    router.push("/lobby");
  }, [code, router]);

  if (!code) return <Centered>No room code.</Centered>;
  if (status === "not_found") {
    return (
      <Centered>
        <p>Room {code} not found.</p>
        <button
          onClick={() => router.push("/lobby")}
          style={ghostBtn}
        >
          back to lobby
        </button>
      </Centered>
    );
  }
  if (status === "connecting" || !state) {
    return <Centered>connecting to {code}…</Centered>;
  }

  const me = state.players.find((p) => p.userId === myId) ?? null;
  const isHost = me?.isHost ?? false;
  const winner = state.winnerId
    ? state.players.find((p) => p.userId === state.winnerId) ?? null
    : null;

  return (
    <>
      {error && (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            border: "2px solid #c33",
            background: "#fee",
            color: "#900",
            padding: "8px 14px",
            borderRadius: 999,
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 13,
            boxShadow: "2px 2px 0 #c33",
            maxWidth: "90%",
          }}
          onClick={() => setError(null)}
        >
          {error} · tap to dismiss
        </div>
      )}

      {state.status === "waiting" && (
        <WaitingRoom
          code={state.code}
          subject={state.subject}
          players={state.players}
          myId={myId}
          maxSlots={state.maxSlots}
          isHost={isHost}
          onStart={handleStart}
          onClose={handleClose}
        />
      )}

      {state.status === "playing" && (
        <GameRoom
          state={state}
          myId={myId}
          onClose={handleClose}
          onPickChoice={handlePickChoice}
          onSubmitText={handleSubmitText}
        />
      )}

      {state.status === "finished" && (
        <FinishedScreen
          winner={winner}
          isHost={isHost}
          onPlayAgain={handleReset}
          onClose={handleClose}
        />
      )}
    </>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "10px 16px",
  background: "transparent",
  color: "var(--ink)",
  border: "2px dashed var(--ink-muted, #999)",
  borderRadius: 8,
  fontFamily: "var(--font-kalam), cursive",
  fontSize: 14,
  cursor: "pointer",
};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        textAlign: "center",
        padding: 20,
        fontFamily: "var(--font-kalam), cursive",
      }}
    >
      {children}
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense>
      <RoomContent />
    </Suspense>
  );
}
