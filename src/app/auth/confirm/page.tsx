import Squiggle from "@/components/ui/Squiggle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PageProps {
  searchParams: Promise<{ to?: string | string[] }>;
}

function pickFirst(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function safeVerifyUrl(raw: string): string | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  // Only allow our own auth verify endpoint to avoid open-redirect.
  const base = process.env.BETTER_AUTH_URL;
  if (!base) {
    // In dev there's no BETTER_AUTH_URL; accept localhost only.
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return null;
    }
  } else {
    let allowed: URL;
    try {
      allowed = new URL(base);
    } catch {
      return null;
    }
    if (parsed.host !== allowed.host) return null;
  }
  if (!parsed.pathname.startsWith("/api/auth/")) return null;
  return parsed.toString();
}

export default async function AuthConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const target = safeVerifyUrl(pickFirst(params.to));

  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "60px 22px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "44px",
          fontWeight: 700,
          color: "var(--ink)",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        Confirm sign-in
      </h1>

      <Squiggle width={120} style={{ margin: "8px auto 16px" }} />

      <p
        style={{
          fontFamily: "var(--font-kalam), cursive",
          fontSize: 14,
          color: "var(--ink-soft)",
          maxWidth: 320,
          lineHeight: 1.4,
          marginBottom: 24,
        }}
      >
        tap the button to finish signing in.
        <br />
        we ask for a tap so link-preview bots can&apos;t use your magic link.
      </p>

      {target ? (
        // GET form so the browser navigates with all the original query
        // params; bots that crawl <a href> or fire HEAD requests won't trip
        // a real form submission.
        <form
          action={new URL(target).pathname + new URL(target).search}
          method="GET"
        >
          <button
            type="submit"
            style={{
              padding: "12px 22px",
              background: "var(--ink)",
              color: "white",
              border: "none",
              borderRadius: 999,
              fontFamily: "var(--font-kalam), cursive",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "2px 2px 0 var(--ink-soft)",
            }}
          >
            Confirm sign-in →
          </button>
        </form>
      ) : (
        <p
          style={{
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 14,
            color: "var(--accent, #c33)",
            maxWidth: 320,
          }}
        >
          this link looks invalid or expired. try requesting a new magic link.
        </p>
      )}
    </main>
  );
}
