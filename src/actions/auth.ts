"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { lookupSchoolByDomain, searchSchools, University } from "@/lib/universities";
import { setPendingSchool } from "@/lib/pending-school";
import { clearGuestSession } from "@/lib/guest";
import { mongoClient } from "@/lib/db";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findExistingUser(email: string) {
  const user = await mongoClient
    .db("bombatique")
    .collection("user")
    .findOne({ email });
  return user as { email: string; onboardingComplete?: boolean } | null;
}

async function dispatchMagicLink(email: string, callbackURL: string) {
  await auth.api.signInMagicLink({
    headers: await headers(),
    body: { email, callbackURL },
  });
}

export async function sendMagicLinkAction(
  email: string
): Promise<
  | { success: true; existing: boolean }
  | { schoolNotFound: true; email: string }
  | { error: string }
> {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    return { error: "Invalid email address." };
  }

  // Existing user: skip school lookup + onboarding entirely
  const existing = await findExistingUser(trimmed);
  if (existing) {
    try {
      const callbackURL = existing.onboardingComplete ? "/lobby" : "/onboarding/2";
      await dispatchMagicLink(trimmed, callbackURL);
      return { success: true, existing: true };
    } catch (err) {
      console.error("[sendMagicLinkAction:existing]", err);
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  // New user: try to resolve school from email domain
  const school = await lookupSchoolByDomain(trimmed);
  if (!school) {
    return { schoolNotFound: true, email: trimmed };
  }

  try {
    await setPendingSchool(school.name, school.initial);
    await dispatchMagicLink(trimmed, "/api/onboarding/bootstrap");
    return { success: true, existing: false };
  } catch (err) {
    console.error("[sendMagicLinkAction]", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendMagicLinkWithSchoolAction(
  email: string,
  schoolName: string,
  schoolInitial: string
): Promise<{ success: true; existing: boolean } | { error: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    return { error: "Invalid email address." };
  }
  if (!schoolName.trim()) {
    return { error: "Pick a school." };
  }

  // Existing user with manually-picked school = no point in re-saving school, just log them in.
  const existing = await findExistingUser(trimmed);
  if (existing) {
    try {
      const callbackURL = existing.onboardingComplete ? "/lobby" : "/onboarding/2";
      await dispatchMagicLink(trimmed, callbackURL);
      return { success: true, existing: true };
    } catch (err) {
      console.error("[sendMagicLinkWithSchoolAction:existing]", err);
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  try {
    await setPendingSchool(schoolName.trim(), schoolInitial.trim());
    await dispatchMagicLink(trimmed, "/api/onboarding/bootstrap");
    return { success: true, existing: false };
  } catch (err) {
    console.error("[sendMagicLinkWithSchoolAction]", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function searchSchoolsAction(query: string): Promise<University[]> {
  return searchSchools(query);
}

export async function getSessionAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session;
  } catch {
    return null;
  }
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
}

export async function signOutGuestAction() {
  await clearGuestSession();
}
