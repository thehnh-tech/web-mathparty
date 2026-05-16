"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OnbHeader from "./OnbHeader";
import OnbCTA from "./OnbCTA";
import Annotation from "@/components/login/Annotation";
import { LEADERBOARD } from "@/lib/onboarding-config";
import { useOnboarding } from "@/lib/onboarding-context";

export default function StepWelcome() {
  const router = useRouter();
  const { state } = useOnboarding();
  const school = state.school || "your school";

  return (
    <>
      <OnbHeader currentStep={2} />

      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-kalam), cursive",
            fontSize: "12px",
            color: "var(--ink-soft)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginTop: "6px",
          }}
        >
          WELCOME ABOARD
        </p>
        <h1
          style={{
            fontFamily: "var(--font-caveat), cursive",
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1,
            marginTop: "6px",
          }}
        >
          You&apos;re now repping
        </h1>
        <h2
          style={{
            fontFamily: "var(--font-caveat), cursive",
            fontSize: "46px",
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--accent)",
            marginTop: "4px",
          }}
        >
          {school}
        </h2>
      </div>

      {/* Live leaderboard card */}
      <div
        style={{
          marginTop: "22px",
          border: "3px solid var(--ink)",
          borderRadius: "12px",
          backgroundColor: "var(--paper)",
          boxShadow: "5px 5px 0 var(--ink)",
          padding: "12px",
        }}
      >
        {/* Card header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              color: "var(--ink-muted)",
              letterSpacing: "1px",
            }}
          >
            ● LIVE THIS WEEK
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              color: "var(--ink-soft)",
            }}
          >
            resets sun
          </span>
        </div>

        {/* Leaderboard rows */}
        {LEADERBOARD.map((school, idx) => (
          <div
            key={school.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 6px",
              backgroundColor: school.mine ? "var(--accent-soft)" : "transparent",
              borderRadius: "6px",
              borderBottom:
                idx < LEADERBOARD.length - 1
                  ? "1px dashed var(--ink-muted)"
                  : "none",
            }}
          >
            {/* Rank */}
            <span
              style={{
                fontFamily: "var(--font-caveat), cursive",
                fontSize: "24px",
                fontWeight: 700,
                width: "24px",
                textAlign: "center",
                lineHeight: 1,
              }}
            >
              {school.rank}
            </span>

            {/* Avatar */}
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "2px solid var(--ink)",
                backgroundColor: school.mine ? "var(--ink)" : "var(--paper)",
                color: school.mine ? "var(--paper)" : "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-caveat), cursive",
                fontSize: "14px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {school.initial}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: "14px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {school.name}
                {school.mine && (
                  <span
                    style={{
                      fontFamily: "var(--font-caveat), cursive",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--accent)",
                      marginLeft: "6px",
                    }}
                  >
                    ← that&apos;s you
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  color: "var(--ink-soft)",
                }}
              >
                {school.points.toLocaleString()} pts
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-text */}
      <p
        style={{
          fontFamily: "var(--font-kalam), cursive",
          fontSize: "14px",
          color: "var(--ink-soft)",
          textAlign: "center",
          marginTop: "16px",
          lineHeight: 1.45,
        }}
      >
        every right answer = points for {school}.
        <br />
        keep them on top.
      </p>

      {/* Annotation */}
      <Annotation
        style={{
          top: "190px",
          right: "4px",
          transform: "rotate(5deg)",
        }}
      >
        social proof
        <br />= sticky 🪝
      </Annotation>

      <OnbCTA label="I'm in →" onClick={() => router.push("/onboarding/3")} />
    </>
  );
}
