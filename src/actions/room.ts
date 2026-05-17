"use server";

import { requireCurrentActor } from "@/lib/actor";
import {
  createRoomForActor,
  joinRoomForActor,
  leaveRoomForActor,
  resetRoomForActor,
  startGameForActor,
  submitChoiceForActor,
  submitTextForActor,
} from "@/lib/room-service";

export async function createRoomAction(
  chapterId: string,
  roomType: "public" | "private" = "public"
): Promise<{ code: string } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return createRoomForActor(actor, chapterId, roomType);
  } catch (e) {
    console.error("[createRoomAction]", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function joinRoomAction(
  code: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return await joinRoomForActor(actor, code);
  } catch (e) {
    console.error("[joinRoomAction]", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function leaveRoomAction(
  code: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return await leaveRoomForActor(actor, code);
  } catch (e) {
    console.error("[leaveRoomAction]", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function startGameAction(
  code: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return await startGameForActor(actor, code);
  } catch (e) {
    console.error("[startGameAction]", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function submitChoiceAction(
  code: string,
  choiceIdx: number
): Promise<{ ok: true; correct: boolean } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return await submitChoiceForActor(actor, code, choiceIdx);
  } catch (e) {
    console.error("[submitChoiceAction]", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function submitTextAction(
  code: string,
  value: string
): Promise<{ ok: true; correct: boolean } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return await submitTextForActor(actor, code, value);
  } catch (e) {
    console.error("[submitTextAction]", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function resetRoomAction(
  code: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return await resetRoomForActor(actor, code);
  } catch (e) {
    console.error("[resetRoomAction]", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getMyIdAction(): Promise<{ id: string } | { error: string }> {
  try {
    const actor = await requireCurrentActor();
    return { id: actor.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
