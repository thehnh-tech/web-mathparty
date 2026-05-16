"use server";

import { getCurrentActor } from "@/lib/actor";
import * as engine from "@/lib/game-engine";

export interface PublicRoomSummary {
  code: string;
  subject: string;
  chapterId: string;
  hostHandle: string;
  status: string;
  players: number;
  maxSlots: number;
}

export async function listPublicRoomsAction(): Promise<PublicRoomSummary[]> {
  const actor = await getCurrentActor();
  if (!actor) return [];
  return engine.listPublicRooms();
}
