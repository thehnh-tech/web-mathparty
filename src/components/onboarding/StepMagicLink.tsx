"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import OnbHeader from "./OnbHeader";
import OnbCTA from "./OnbCTA";
import EnvelopeIllustration from "@/components/ui/EnvelopeIllustration";
import Squiggle from "@/components/ui/Squiggle";
import Annotation from "@/components/login/Annotation";
import { sendMagicLinkAction } from "@/actions/auth";

interface StepMagicLinkProps {
  email: string;
}

export default function StepMagicLink({ email }: StepMagicLinkProps) {
  const router = useRouter();
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (resending) return;
    setResending(true);
    await sendMagicLinkAction(email);
    setResending(false);
  }

  return (
    <>
      <OnbHeader currentStep={1} />

      <EnvelopeIllustration />

      <h1
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "36px",
          fontWeight: 700,
          lineHeight: 1,
          textAlign: "center",
          marginTop: "36px",
        }}
      >
        Check your inbox
      </h1>

      <Squiggle width={120} style={{ margin: "8px auto 0" }} />

      <div style={{ textAlign: "center", marginTop: "14px" }}>
        <p
          style={{
            fontSize: "14px",
            color: "var(--ink-soft)",
            lineHeight: 1.4,
            fontFamily: "var(--font-kalam), cursive",
          }}
        >
          we sent a magic link to
        </p>
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--ink)",
            marginTop: "4px",
          }}
        >
          {email}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--ink-soft)",
            marginTop: "14px",
            lineHeight: 1.4,
            fontFamily: "var(--font-kalam), cursive",
          }}
        >
          tap the link on this device.
          <br />
          we&apos;ll bounce you right back here.
        </p>
      </div>

      {/* Annotation */}
      <Annotation
        style={{
          top: "260px",
          right: "10px",
          transform: "rotate(6deg)",
        }}
      >
        no password
        <br />
        ever ✓
      </Annotation>

      <OnbCTA
        label={resending ? "Sending…" : "Resend ↻"}
        variant="primary"
        onClick={handleResend}
        secondaryLabel="change email"
        onSecondary={() => router.push("/login")}
      />
    </>
  );
}
