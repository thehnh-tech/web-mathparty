import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import StepMagicLink from "@/components/onboarding/StepMagicLink";
import StepSchoolFallback from "@/components/onboarding/StepSchoolFallback";
import StepWelcome from "@/components/onboarding/StepWelcome";
import StepYear from "@/components/onboarding/StepYear";
import StepSubjects from "@/components/onboarding/StepSubjects";
import StepHandle from "@/components/onboarding/StepHandle";

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  "2": StepWelcome,
  "3": StepYear,
  "4": StepSubjects,
  "5": StepHandle,
};

interface Props {
  params: Promise<{ step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OnboardingStepPage({ params, searchParams }: Props) {
  const { step } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const done = (session?.user as { onboardingComplete?: boolean } | undefined)?.onboardingComplete;

  if (step === "1" || step === "1b") {
    if (session?.user) {
      redirect(done ? "/lobby" : "/onboarding/2");
    }
    const sp = await searchParams;
    const queryEmail = typeof sp.email === "string" ? sp.email : null;
    if (!queryEmail) redirect("/login");
    return step === "1b" ? (
      <StepSchoolFallback email={queryEmail} />
    ) : (
      <StepMagicLink email={queryEmail} />
    );
  }

  if (!session?.user) {
    redirect("/login");
  }

  if (done) {
    redirect("/lobby");
  }

  const StepComponent = STEP_COMPONENTS[step];
  if (!StepComponent) {
    redirect("/onboarding/2");
  }

  return <StepComponent />;
}
