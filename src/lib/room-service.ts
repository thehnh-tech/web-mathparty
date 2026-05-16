import "server-only";

import * as engine from "@/lib/game-engine";
import { isValidChapterId } from "@/lib/chapters";
import { AnswerPayload, RoomType } from "@/lib/game-types";
import { RequestActor } from "@/lib/actor";

const CREATE_LIMIT = 10;
const CREATE_WINDOW_MS = 60_000;

declare global {
  var _bombCreateBuckets: Map<string, number[]> | undefined;
}

const createBuckets = global._bombCreateBuckets ?? new Map<string, number[]>();
global._bombCreateBuckets = createBuckets;

function rateLimitCreate(userId: string): boolean {
  const now = Date.now();
  const list = createBuckets.get(userId) ?? [];
  const recent = list.filter((t) => now - t < CREATE_WINDOW_MS);
  if (recent.length >= CREATE_LIMIT) {
    createBuckets.set(userId, recent);
    return false;
  }
  recent.push(now);
  createBuckets.set(userId, recent);
  return true;
}

function actorToPlayer(actor: RequestActor) {
  return {
    userId: actor.id,
    handle: actor.handle,
    initial: actor.initial,
  };
}

export function createRoomForActor(
  actor: RequestActor,
  chapterId: string,
  roomType: RoomType = "public"
): { code: string } | { error: string } {
  if (!isValidChapterId(chapterId)) return { error: "Invalid chapter" };
  if (roomType !== "public" && roomType !== "private") return { error: "Invalid room type" };
  if (!rateLimitCreate(actor.id)) return { error: "Too many rooms - slow down a bit." };

  const p = actorToPlayer(actor);
  const state = engine.createRoom({
    hostId: p.userId,
    hostHandle: p.handle,
    hostInitial: p.initial,
    chapterId,
    roomType,
  });
  return { code: state.code };
}

export function joinRoomForActor(
  actor: RequestActor,
  code: string
): { ok: true } | { error: string } {
  const result = engine.joinRoom(code.toUpperCase(), actorToPlayer(actor));
  if ("error" in result) return { error: result.error };
  return { ok: true };
}

export function leaveRoomForActor(
  actor: RequestActor,
  code: string
): { ok: true } {
  engine.leaveRoom(code.toUpperCase(), actor.id);
  return { ok: true };
}

export function startGameForActor(
  actor: RequestActor,
  code: string
): { ok: true } | { error: string } {
  const result = engine.startGame(code.toUpperCase(), actor.id);
  if ("error" in result) return { error: result.error };
  return { ok: true };
}

export function submitChoiceForActor(
  actor: RequestActor,
  code: string,
  choiceIdx: number
): { ok: true; correct: boolean } | { error: string } {
  const payload: AnswerPayload = { kind: "choice", idx: choiceIdx };
  const result = engine.submitAnswer(code.toUpperCase(), actor.id, payload);
  if ("error" in result) return { error: result.error };
  return { ok: true, correct: result.correct };
}

export function submitTextForActor(
  actor: RequestActor,
  code: string,
  value: string
): { ok: true; correct: boolean } | { error: string } {
  const payload: AnswerPayload = { kind: "text", value };
  const result = engine.submitAnswer(code.toUpperCase(), actor.id, payload);
  if ("error" in result) return { error: result.error };
  return { ok: true, correct: result.correct };
}

export function resetRoomForActor(
  actor: RequestActor,
  code: string
): { ok: true } | { error: string } {
  const result = engine.resetRoom(code.toUpperCase(), actor.id);
  if ("error" in result) return { error: result.error };
  return { ok: true };
}
