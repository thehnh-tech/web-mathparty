import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { consumePendingSchool } from "@/lib/pending-school";
import { lookupSchoolByDomain, initialFromName } from "@/lib/universities";

async function resolveSchool(email: string): Promise<{ name: string; initial: string }> {
  const pending = await consumePendingSchool();
  if (pending?.name) return pending;

  const fromApi = await lookupSchoolByDomain(email);
  if (fromApi) return { name: fromApi.name, initial: fromApi.initial };

  const domain = email.split("@")[1] ?? "";
  const name = domain.split(".")[0] || "Unknown";
  return { name, initial: initialFromName(name) };
}

function publicOrigin(req: NextRequest, reqHeaders: Headers): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  const host = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host");
  const proto = reqHeaders.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  const origin = publicOrigin(req, reqHeaders);

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const user = session.user as typeof session.user & { school?: string | null };

  if (!user.school) {
    const resolved = await resolveSchool(user.email);
    try {
      await auth.api.updateUser({
        headers: reqHeaders,
        body: { school: resolved.name, schoolInitial: resolved.initial },
      });
    } catch (err) {
      console.error("[bootstrap] failed to persist school:", err);
    }
  }

  const done = (session.user as { onboardingComplete?: boolean }).onboardingComplete;
  return NextResponse.redirect(new URL(done ? "/lobby" : "/onboarding/2", origin));
}
