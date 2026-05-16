"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface OnboardingData {
  handle: string;
  year: string;
  subjects: string[];
  notificationsEnabled: boolean;
}

export async function completeOnboardingAction(data: OnboardingData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Not authenticated." };

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        handle: data.handle,
        year: data.year,
        subjects: data.subjects,
        notificationsEnabled: data.notificationsEnabled,
        onboardingComplete: true,
      },
    });
    return { success: true };
  } catch (err) {
    console.error("[completeOnboardingAction]", err);
    return { error: "Failed to save profile." };
  }
}

export async function getUserProfileAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return session.user;
}
