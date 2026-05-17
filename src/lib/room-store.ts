import "server-only";

import { mongoClient } from "./db";
import { RoomState } from "./game-types";

interface RoomDoc {
  _id: string;
  state: RoomState;
  updatedAt: Date;
}

const COLLECTION = "active_rooms";

function col() {
  return mongoClient.db("bombatique").collection<RoomDoc>(COLLECTION);
}

export async function saveRoomSnapshot(state: RoomState): Promise<void> {
  try {
    await col().updateOne(
      { _id: state.code },
      { $set: { state, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error("[room-store:save]", err);
  }
}

export async function loadRoomSnapshot(code: string): Promise<RoomState | null> {
  try {
    const doc = await col().findOne({ _id: code });
    return doc?.state ?? null;
  } catch (err) {
    console.error("[room-store:load]", err);
    return null;
  }
}

export async function deleteRoomSnapshot(code: string): Promise<void> {
  try {
    await col().deleteOne({ _id: code });
  } catch (err) {
    console.error("[room-store:delete]", err);
  }
}

export async function listPublicRoomSnapshots(): Promise<RoomState[]> {
  try {
    const docs = await col()
      .find({
        "state.roomType": "public",
        "state.status": { $ne: "finished" },
      })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
    return docs.map((d) => d.state);
  } catch (err) {
    console.error("[room-store:listPublic]", err);
    return [];
  }
}
