import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { suggestHandleFromEmail } from "@/lib/schools";
import { OnboardingState, YearId, SubjectId } from "@/types/onboarding";

interface UserShape {
  email: string;
  handle?: string | null;
  year?: string | null;
  subjects?: string[] | null;
  notificationsEnabled?: boolean | null;
  school?: string | null;
  schoolInitial?: string | null;
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  let initial: Partial<OnboardingState> | undefined;
  if (session?.user) {
    const user = session.user as typeof session.user & UserShape;

    initial = {
      email: user.email,
      handle: user.handle || suggestHandleFromEmail(user.email),
      year: (user.year as YearId | null) ?? null,
      subjects: (user.subjects as SubjectId[] | null) ?? [],
      notificationsEnabled: user.notificationsEnabled ?? true,
      school: user.school ?? "",
      schoolInitial: user.schoolInitial ?? "",
    };
  }

  return (
    <OnboardingProvider initial={initial}>
      <div
        className="onboarding-shell"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: "60px 22px 30px",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {children}
      </div>
    </OnboardingProvider>
  );
}
