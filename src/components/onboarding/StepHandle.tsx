"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnbHeader from "./OnbHeader";
import OnbCTA from "./OnbCTA";
import SkInput from "@/components/ui/SkInput";
import SkAvatar from "@/components/ui/SkAvatar";
import Squiggle from "@/components/ui/Squiggle";
import Annotation from "@/components/login/Annotation";
import { useOnboarding } from "@/lib/onboarding-context";
import { completeOnboardingAction } from "@/actions/user";

export default function StepHandle() {
  const router = useRouter();
  const { state, update } = useOnboarding();
  const schoolInitial = state.schoolInitial || "?";
  const [showAvailable, setShowAvailable] = useState(false);
  const [saving, setSaving] = useState(false);

  // Debounced availability check (visual only)
  useEffect(() => {
    setShowAvailable(false);
    if (!state.handle) return;
    const t = setTimeout(() => setShowAvailable(true), 400);
    return () => clearTimeout(t);
  }, [state.handle]);

  const initials = state.handle
    ? state.handle.slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <OnbHeader currentStep={5} />

      <h1
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "36px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        Pick a handle
      </h1>

      <Squiggle width={100} style={{ marginTop: "6px" }} />

      <p
        style={{
          fontSize: "14px",
          color: "var(--ink-soft)",
          marginTop: "10px",
          fontFamily: "var(--font-kalam), cursive",
        }}
      >
        this is what others see in the leaderboard
      </p>

      {/* Preview card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          border: "2px solid var(--ink)",
          borderRadius: "12px",
          padding: "14px",
          backgroundColor: "var(--paper)",
          boxShadow: "3px 3px 0 var(--ink)",
          marginTop: "20px",
        }}
      >
        <SkAvatar initials={initials} size={56} dark />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "24px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            @{state.handle || "…"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              color: "var(--ink-soft)",
              marginTop: "2px",
            }}
          >
            {schoolInitial} · 2024 · {state.year ?? "—"}
          </div>
        </div>
        <span
          style={{
            fontFamily: "var(--font-caveat), cursive",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          edit ✎
        </span>
      </div>

      {/* Handle input */}
      <div style={{ marginTop: "16px" }}>
        <SkInput
          label="Handle"
          prefix="@"
          value={state.handle}
          onChange={(v) => update({ handle: v })}
          helper="3–20 chars · letters, numbers, _"
          statusBadge={
            showAvailable && state.handle ? (
              <span
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--accent)",
                  whiteSpace: "nowrap",
                }}
              >
                ✓ available
              </span>
            ) : undefined
          }
        />
      </div>

      {/* Notifications opt-in */}
      <div
        style={{
          marginTop: "18px",
          border: "2px dashed var(--ink)",
          borderRadius: "10px",
          padding: "12px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <button
          onClick={() => update({ notificationsEnabled: !state.notificationsEnabled })}
          style={{
            width: "22px",
            height: "22px",
            flexShrink: 0,
            border: "2px solid var(--ink)",
            borderRadius: "6px",
            backgroundColor: state.notificationsEnabled ? "var(--accent)" : "var(--paper)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {state.notificationsEnabled ? "✓" : ""}
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-kalam), cursive",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Notify me when {schoolInitial} is challenged
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--ink-soft)",
              marginTop: "2px",
              lineHeight: 1.4,
              fontFamily: "var(--font-kalam), cursive",
            }}
          >
            &ldquo;ENS just took #1 from us&rdquo; ·{" "}
            <span style={{ textDecoration: "underline" }}>weekly digest only</span>
          </div>
        </div>
      </div>

      {/* Annotation */}
      <Annotation
        style={{
          top: "110px",
          right: "4px",
          transform: "rotate(-5deg)",
        }}
      >
        auto-suggested
        <br />
        from email
      </Annotation>

      <OnbCTA
        label={saving ? "Saving…" : "You're in · drop the bomb ✦"}
        onClick={async () => {
          setSaving(true);
          await completeOnboardingAction({
            handle: state.handle,
            year: state.year ?? "",
            subjects: state.subjects,
            notificationsEnabled: state.notificationsEnabled,
          });
          setSaving(false);
          router.push("/lobby");
        }}
        disabled={saving || !state.handle || state.handle.length < 3}
      />
    </>
  );
}
