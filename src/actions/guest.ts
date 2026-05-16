"use server";

import { setGuestSession, clearGuestSession, getGuestSession } from "@/lib/guest";

export async function createGuestSessionAction(
  username: string
): Promise<{ success: true } | { error: string }> {
  const trimmed = username.trim();
  if (trimmed.length < 2) {
    return { error: "Username must be at least 2 characters." };
  }
  if (trimmed.length > 20) {
    return { error: "Username must be 20 characters or less." };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { error: "Letters, numbers, underscore only." };
  }
  await setGuestSession(trimmed);
  return { success: true };
}

export async function getGuestSessionAction() {
  return getGuestSession();
}

export async function clearGuestSessionAction() {
  await clearGuestSession();
}
