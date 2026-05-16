import "server-only";

import { headers } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";

export interface RequestActor {
  id: string;
  handle: string;
  initial: string;
  email?: string | null;
  isGuest: boolean;
}

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  handle?: string | null;
}

interface MobileGuestPayload {
  id: string;
  username: string;
  createdAt: number;
}

interface MobileAccountPayload {
  kind: "account";
  id: string;
  handle: string;
  email: string;
  createdAt: number;
}

const MOBILE_AUTH_HEADER = "x-bombatique-mobile-session";

function deriveHandle(user: SessionUser): string {
  if (user.handle && user.handle.trim()) return user.handle.trim();
  if (user.name && user.name.trim()) return user.name.trim();
  if (user.email) return user.email.split("@")[0];
  return "player";
}

function deriveInitial(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "??";
  return trimmed.slice(0, 2).toUpperCase();
}

function guestIdFromName(username: string): string {
  const safe = username.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "-");
  return `guest-${safe || "player"}`;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signingSecret(): string {
  return (
    process.env.MOBILE_SESSION_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.RESEND_API_KEY ||
    "dev-mobile-session-secret"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function signaturesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createMobileGuestToken(payload: MobileGuestPayload | MobileAccountPayload): string {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${signPayload(encoded)}`;
}

export function readMobileGuestToken(token: string | null): RequestActor | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = signPayload(encoded);
  if (!signaturesEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as
      | MobileGuestPayload
      | MobileAccountPayload;
    if ("kind" in payload && payload.kind === "account") {
      if (!payload.id || !payload.handle || !payload.email || !payload.createdAt) return null;
      return {
        id: payload.id,
        handle: payload.handle,
        initial: deriveInitial(payload.handle),
        email: payload.email,
        isGuest: false,
      };
    }

    if (!("username" in payload)) return null;
    if (!payload.id || !payload.username || !payload.createdAt) return null;
    return {
      id: payload.id,
      handle: payload.username,
      initial: deriveInitial(payload.username),
      isGuest: true,
    };
  } catch {
    return null;
  }
}

function mobileTokenFromHeaders(reqHeaders: Headers): string | null {
  const direct = reqHeaders.get(MOBILE_AUTH_HEADER);
  if (direct) return direct;
  const authHeader = reqHeaders.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice("bearer ".length).trim();
}

function userToActor(user: SessionUser): RequestActor {
  const handle = deriveHandle(user);
  return {
    id: user.id,
    handle,
    initial: deriveInitial(handle),
    email: user.email,
    isGuest: false,
  };
}

export function createMobileAccountSession(user: {
  id: string;
  handle: string;
  email: string;
}): {
  token: string;
  actor: RequestActor;
} {
  const payload: MobileAccountPayload = {
    kind: "account",
    id: user.id,
    handle: user.handle,
    email: user.email,
    createdAt: Date.now(),
  };
  const token = createMobileGuestToken(payload);
  return {
    token,
    actor: {
      id: user.id,
      handle: user.handle,
      initial: deriveInitial(user.handle),
      email: user.email,
      isGuest: false,
    },
  };
}

export async function getActorFromHeaders(reqHeaders: Headers): Promise<RequestActor | null> {
  try {
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (session?.user) return userToActor(session.user as SessionUser);
  } catch {
    // Fall through to guest/mobile session lookup.
  }

  const mobileGuest = readMobileGuestToken(mobileTokenFromHeaders(reqHeaders));
  if (mobileGuest) return mobileGuest;

  const webGuest = await getGuestSession();
  if (webGuest) {
    const id = webGuest.id || guestIdFromName(webGuest.username);
    return {
      id,
      handle: webGuest.username,
      initial: deriveInitial(webGuest.username),
      isGuest: true,
    };
  }

  return null;
}

export async function getCurrentActor(): Promise<RequestActor | null> {
  return getActorFromHeaders(await headers());
}

export async function requireCurrentActor(): Promise<RequestActor> {
  const actor = await getCurrentActor();
  if (!actor) throw new Error("Not authenticated");
  return actor;
}

export function validateGuestUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 2) return "Username must be at least 2 characters.";
  if (trimmed.length > 20) return "Username must be 20 characters or less.";
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Letters, numbers, underscore only.";
  return null;
}

export function createMobileGuestSession(username: string): {
  token: string;
  actor: RequestActor;
} {
  const trimmed = username.trim();
  const payload: MobileGuestPayload = {
    id: `guest-${randomUUID()}`,
    username: trimmed,
    createdAt: Date.now(),
  };
  const token = createMobileGuestToken(payload);
  return {
    token,
    actor: {
      id: payload.id,
      handle: trimmed,
      initial: deriveInitial(trimmed),
      isGuest: true,
    },
  };
}
