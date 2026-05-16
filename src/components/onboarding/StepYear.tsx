"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OnbHeader from "./OnbHeader";
import OnbCTA from "./OnbCTA";
import Squiggle from "@/components/ui/Squiggle";
import Annotation from "@/components/login/Annotation";
import { useOnboarding } from "@/lib/onboarding-context";
import { YEARS } from "@/lib/onboarding-config";
import { YearId } from "@/types/onboarding";

export default function StepYear() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  function selectYear(year: YearId) {
    update({ year });
  }

  return (
    <>
      <OnbHeader currentStep={3} />

      <h1
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "36px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        What year are you in?
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
        we&apos;ll calibrate problems to your level
      </p>

      {/* Year grid — 3 columns, variant 3A */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginTop: "18px",
        }}
      >
        {YEARS.map((year) => {
          const selected = state.year === year;
          return (
            <button
              key={year}
              onClick={() => selectYear(year)}
              style={{
                border: "2px solid var(--ink)",
                borderRadius: "10px",
                padding: "26px 0",
                textAlign: "center",
                fontFamily: "var(--font-caveat), cursive",
                fontSize: "36px",
                fontWeight: 700,
                lineHeight: 1,
                backgroundColor: selected ? "var(--ink)" : "var(--paper)",
                color: selected ? "var(--paper)" : "var(--ink)",
                boxShadow: selected
                  ? "4px 4px 0 var(--ink-soft)"
                  : "2px 2px 0 var(--ink)",
                cursor: "pointer",
                transition: "background-color 120ms, color 120ms",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {year}
            </button>
          );
        })}
      </div>

      {/* Annotation */}
      <Annotation
        style={{
          top: "130px",
          right: "4px",
          transform: "rotate(6deg)",
        }}
      >
        tap a year
        <br />
        tap continue ↓
      </Annotation>

      <OnbCTA
        label="Continue →"
        onClick={() => router.push("/onboarding/4")}
        disabled={!state.year}
      />
    </>
  );
}
