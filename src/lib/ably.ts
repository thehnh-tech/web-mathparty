import "server-only";

import * as Ably from "ably";
import { RoomState } from "@/lib/game-types";

export const ROOM_EVENT_NAME = "state";
const ROOM_CHANNEL_PREFIX = "room:";
const TOKEN_TTL_MS = 60 * 60 * 1000;

let restClient: Ably.Rest | null = null;

function getApiKey(): string | null {
  return process.env.ABLY_API_KEY?.trim() || null;
}

function getRestClient(): Ably.Rest {
  const key = getApiKey();
  if (!key) throw new Error("ABLY_API_KEY is not configured");
  if (!restClient) {
    restClient = new Ably.Rest({ key });
  }
  return restClient;
}

export function isAblyConfigured(): boolean {
  return Boolean(getApiKey());
}

export function roomChannelName(code: string): string {
  return `${ROOM_CHANNEL_PREFIX}${code.trim().toUpperCase()}`;
}

export async function createRealtimeTokenRequest(actor: {
  id: string;
}): Promise<Ably.TokenRequest> {
  return getRestClient().auth.createTokenRequest({
    clientId: actor.id,
    ttl: TOKEN_TTL_MS,
    capability: JSON.stringify({
      [`${ROOM_CHANNEL_PREFIX}*`]: ["subscribe", "presence", "history"],
    }),
  });
}

let warnedAblyMissing = false;

export async function publishRoomState(
  code: string,
  state: RoomState
): Promise<void> {
  if (!isAblyConfigured()) {
    if (!warnedAblyMissing) {
      warnedAblyMissing = true;
      console.error(
        "[ably] ABLY_API_KEY is not set on this runtime. Room state updates " +
          "will NOT be pushed to clients. Set the env var on Vercel and redeploy."
      );
    }
    return;
  }
  try {
    const snapshot = JSON.parse(JSON.stringify(state)) as RoomState;
    const channel = getRestClient().channels.get(roomChannelName(code));
    await channel.publish(ROOM_EVENT_NAME, {
      type: ROOM_EVENT_NAME,
      state: snapshot,
    });
  } catch (err) {
    // Surface publish failures so they show up in Vercel logs instead of
    // being silently swallowed by the .catch in emit().
    console.error("[ably:publish]", code, err);
    throw err;
  }
}
