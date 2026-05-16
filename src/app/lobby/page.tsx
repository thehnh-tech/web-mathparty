import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getGuestSession } from "@/lib/guest";
import LobbyClient, { type LobbyUser } from "./LobbyClient";

function initialsFromName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s_]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function LobbyPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    const u = session.user as typeof session.user & {
      handle?: string;
      school?: string;
      schoolInitial?: string;
      year?: string;
      onboardingComplete?: boolean;
    };

    if (!u.onboardingComplete) {
      redirect("/onboarding/2");
    }

    const displayName = u.handle || u.name || u.email.split("@")[0];
    const lobbyUser: LobbyUser = {
      displayName,
      initials: initialsFromName(u.name || u.handle || u.email),
      subtitle: [u.schoolInitial, u.school, u.year].filter(Boolean).join(" · ") || "—",
      isGuest: false,
    };
    return <LobbyClient user={lobbyUser} />;
  }

  const guest = await getGuestSession();
  if (guest) {
    const lobbyUser: LobbyUser = {
      displayName: guest.username,
      initials: initialsFromName(guest.username),
      subtitle: "guest · limited mode",
      isGuest: true,
    };
    return <LobbyClient user={lobbyUser} />;
  }

  redirect("/login");
}
