import React from "react";
import { TOTAL_STEPS } from "@/lib/onboarding-config";

interface OnbHeaderProps {
  currentStep: number;
}

export default function OnbHeader({ currentStep }: OnbHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        alignItems: "center",
        marginBottom: "28px",
      }}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => {
        const isCurrent = step === currentStep;
        const isPast = step < currentStep;
        return (
          <div
            key={step}
            style={{
              height: "10px",
              width: isCurrent ? "22px" : "10px",
              borderRadius: "999px",
              border: "2px solid var(--ink)",
              backgroundColor: isCurrent || isPast ? "var(--ink)" : "transparent",
              transition: "width 200ms ease",
            }}
          />
        );
      })}
    </div>
  );
}
