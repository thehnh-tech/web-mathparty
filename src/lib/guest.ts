import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const GUEST_COOKIE = "bombatique_guest";

export interface GuestSession {
  id?: string;
  username: string;
  createdAt: number;
}

const baseOpts = {
  httpOnly: false, // readable client-side for display purposes
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year — survives across visits
};

export async function setGuestSession(username: string) {
  const store = await cookies();
  const payload: GuestSession = {
    id: `guest-${randomUUID()}`,
    username,
    createdAt: Date.now(),
  };
  store.set(GUEST_COOKIE, JSON.stringify(payload), {
    ...baseOpts,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getGuestSession(): Promise<GuestSession | null> {
  const store = await cookies();
  const raw = store.get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuestSession;
    if (typeof parsed.username === "string" && parsed.username.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearGuestSession() {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}
