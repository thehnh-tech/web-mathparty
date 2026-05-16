"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SkBtn from "@/components/ui/SkBtn";
import SkInput from "@/components/ui/SkInput";
import Squiggle from "@/components/ui/Squiggle";
import BombIllustration from "@/components/ui/BombIllustration";
import Annotation from "@/components/login/Annotation";
import { sendMagicLinkAction } from "@/actions/auth";
import { createGuestSessionAction } from "@/actions/guest";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();

  async function handleMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const trimmed = email.trim();
    const result = await sendMagicLinkAction(trimmed);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if ("schoolNotFound" in result) {
      router.push(`/onboarding/1b?email=${encodeURIComponent(trimmed)}`);
      return;
    }
    if (result.existing) {
      router.push(`/onboarding/1?email=${encodeURIComponent(trimmed)}&existing=1`);
      return;
    }
    router.push(`/onboarding/1?email=${encodeURIComponent(trimmed)}`);
  }

  async function submitGuest() {
    setGuestError("");
    setGuestLoading(true);
    const result = await createGuestSessionAction(guestName);
    setGuestLoading(false);
    if ("error" in result) {
      setGuestError(result.error);
      return;
    }
    router.push("/lobby");
  }

  return (
    <main
      className="login-page"
      style={{
        position: "relative",
        minHeight: "100dvh",
        padding: "70px 22px 100px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="login-brand">
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "56px",
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1,
              marginBottom: "4px",
            }}
          >
            Bombatique
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "var(--ink-soft)",
              marginTop: "6px",
              fontFamily: "var(--font-kalam), cursive",
            }}
          >
            mental math · live · multiplayer
          </p>

          <Squiggle width={120} style={{ margin: "8px auto 0" }} />
        </div>

        {/* Bomb illustration */}
        <div style={{ marginTop: "28px" }}>
          <BombIllustration />
        </div>
      </div>

      <div className="login-panel">
        {/* Email input */}
        <div style={{ marginTop: "32px" }}>
          <SkInput
            label="University email"
            placeholder="you@polytechnique.edu"
            fontMono
            value={email}
            onChange={setEmail}
            type="email"
          />
        </div>

        {/* Send magic link button */}
        <div style={{ marginTop: "16px" }}>
          <SkBtn variant="primary" fullWidth onClick={handleMagicLink} disabled={loading}>
            {loading ? "Sending…" : "Send magic link  →"}
          </SkBtn>
        </div>

        {/* Error / helper text */}
        <p
          style={{
            fontSize: "13px",
            color: error ? "var(--accent)" : "var(--ink-soft)",
            textAlign: "center",
            marginTop: "14px",
            fontFamily: "var(--font-kalam), cursive",
            minHeight: "20px",
          }}
        >
          {error || "we verify your school by email domain"}
        </p>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "20px 0 14px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "var(--ink-muted)",
              opacity: 0.5,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-kalam), cursive",
              fontSize: "12px",
              color: "var(--ink-soft)",
            }}
          >
            or
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "var(--ink-muted)",
              opacity: 0.5,
            }}
          />
        </div>

        {/* Guest option */}
        {!guestMode ? (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => setGuestMode(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-kalam), cursive",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--ink)",
                textDecoration: "underline wavy",
                textDecorationColor: "var(--ink-soft)",
                textUnderlineOffset: "4px",
              }}
            >
              Play as guest
            </button>
            <p
              style={{
                fontSize: "11px",
                color: "var(--ink-soft)",
                marginTop: "4px",
                fontFamily: "var(--font-kalam), cursive",
              }}
            >
              no rankings · no team · just play
            </p>
          </div>
        ) : (
          <div>
            <SkInput
              label="Pick a username"
              placeholder="bombasterX"
              fontMono
              value={guestName}
              onChange={setGuestName}
            />
            <div style={{ marginTop: "12px" }}>
              <SkBtn
                variant="primary"
                fullWidth
                onClick={submitGuest}
                disabled={guestLoading || guestName.trim().length < 2}
              >
                {guestLoading ? "Setting up…" : "Continue as guest  →"}
              </SkBtn>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: guestError ? "var(--accent)" : "var(--ink-soft)",
                textAlign: "center",
                marginTop: "10px",
                fontFamily: "var(--font-kalam), cursive",
                minHeight: "20px",
              }}
            >
              {guestError || "letters, numbers, _ · 2–20 chars"}
            </p>
            <button
              onClick={() => {
                setGuestMode(false);
                setGuestError("");
                setGuestName("");
              }}
              style={{
                display: "block",
                margin: "0 auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-kalam), cursive",
                fontSize: "12px",
                color: "var(--ink-soft)",
                textDecoration: "underline",
              }}
            >
              ← back
            </button>
          </div>
        )}
      </div>

      {/* Annotation top-right */}
      <Annotation
        style={{
          top: "340px",
          right: "4px",
          transform: "rotate(6deg)",
        }}
      >
        only .edu / .fr
        <br />
        school emails ✓
      </Annotation>

      {/* Annotation bottom-left */}
      <Annotation
        style={{
          bottom: "130px",
          left: "6px",
          transform: "rotate(-4deg)",
        }}
      >
        guest =<br />
        limited mode
      </Annotation>
    </main>
  );
}
