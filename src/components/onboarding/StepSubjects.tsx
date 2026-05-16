"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OnbHeader from "./OnbHeader";
import OnbCTA from "./OnbCTA";
import Squiggle from "@/components/ui/Squiggle";
import Annotation from "@/components/login/Annotation";
import { useOnboarding } from "@/lib/onboarding-context";
import { SUBJECTS } from "@/lib/onboarding-config";
import { SubjectId } from "@/types/onboarding";

export default function StepSubjects() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  function toggleSubject(id: SubjectId) {
    const current = state.subjects;
    const next = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    update({ subjects: next });
  }

  const selected = state.subjects;
  const canContinue = selected.length >= 2;

  return (
    <>
      <OnbHeader currentStep={4} />

      <h1
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "36px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        Your subjects
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
        pick your favorite subjects · at least 2
      </p>

      {/* Tag pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "18px",
        }}
      >
        {SUBJECTS.map(({ id, label }) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleSubject(id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                border: "2px solid var(--ink)",
                borderRadius: "999px",
                padding: "8px 14px",
                backgroundColor: isSelected ? "var(--ink)" : "var(--paper)",
                color: isSelected ? "var(--paper)" : "var(--ink)",
                fontFamily: "var(--font-kalam), cursive",
                fontSize: "14px",
                fontWeight: 700,
                boxShadow: isSelected ? "3px 3px 0 var(--ink-soft)" : "none",
                cursor: "pointer",
                transition: "background-color 120ms, color 120ms",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isSelected && (
                <span style={{ fontSize: "12px" }}>✓</span>
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <p
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "11px",
          color: "var(--ink-soft)",
          marginTop: "18px",
        }}
      >
        {selected.length} selected · you can change later in profile
      </p>

      {/* Annotation */}
      <Annotation
        style={{
          top: "120px",
          right: "6px",
          transform: "rotate(-5deg)",
        }}
      >
        tap to toggle
        <br />
        multi-select
      </Annotation>

      <OnbCTA
        label="Continue →"
        onClick={() => router.push("/onboarding/5")}
        disabled={!canContinue}
      />
    </>
  );
}
