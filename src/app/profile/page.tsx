import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import ProfileClient, { ProfileHeader } from "./ProfileClient";
import { getProfileData } from "@/lib/profile-data.server";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  handle?: string | null;
  school?: string | null;
  schoolInitial?: string | null;
  year?: string | null;
  elo?: number | null;
  streak?: number | null;
  onboardingComplete?: boolean;
  createdAt?: string | Date;
}

function initialsFromName(s: string): string {
  const cleaned = s.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s_]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatJoinedDate(d: string | Date | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    .toLowerCase();
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const u = session.user as ExtendedUser;
  if (!u.onboardingComplete) redirect("/onboarding/2");

  const displayName = u.handle || u.name || u.email?.split("@")[0] || "you";
  const initials = initialsFromName(u.name || u.handle || u.email || "you");

  const subtitleParts: string[] = [];
  if (u.schoolInitial || u.school) subtitleParts.push(u.schoolInitial || u.school || "");
  if (u.year) subtitleParts.push(u.year);
  const joined = formatJoinedDate(u.createdAt);
  if (joined) subtitleParts.push(`joined ${joined}`);
  const subtitle = subtitleParts.filter(Boolean).join(" · ") || "—";

  const header: ProfileHeader = {
    displayName,
    initials,
    subtitle,
    elo: typeof u.elo === "number" ? u.elo : 1000,
    streak: typeof u.streak === "number" ? u.streak : 0,
  };

  // Server-side fetch of stats. Returns zeroed shape for users with no games yet.
  const data = await getProfileData(u.id);

  return <ProfileClient header={header} data={data} />;
}
