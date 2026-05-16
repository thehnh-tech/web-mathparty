"use client";

import React from "react";
import Latex from "@/components/Latex";

interface Props {
  choices: string[];
  correctChoice?: string | null;
  myChoice?: string | null;
  reveal: boolean;
  disabled: boolean;
  onPick: (idx: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function QcmAnswers({
  choices,
  correctChoice,
  myChoice,
  reveal,
  disabled,
  onPick,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridAutoRows: "minmax(72px, auto)",
        gap: 10,
      }}
    >
      {choices.map((c, idx) => {
        const isCorrect = reveal && correctChoice === c;
        const isMyChoice = reveal && myChoice === c;
        const isMyWrong = isMyChoice && !isCorrect;

        const border = isCorrect
          ? "2.5px solid #0a8a0a"
          : isMyWrong
          ? "2.5px solid #c33"
          : "2px solid var(--ink)";
        const bg = isCorrect
          ? "rgba(10,138,10,0.10)"
          : isMyWrong
          ? "rgba(204,51,51,0.10)"
          : "var(--paper)";

        return (
          <button
            key={idx}
            disabled={disabled || reveal}
            onClick={() => onPick(idx)}
            style={{
              position: "relative",
              padding: "14px 12px 12px",
              border,
              borderRadius: 12,
              background: bg,
              boxShadow: disabled || reveal ? "none" : "2px 2px 0 var(--ink)",
              cursor: disabled || reveal ? "default" : "pointer",
              textAlign: "center",
              minHeight: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 200ms, border-color 200ms",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 4,
                left: 8,
                fontFamily: "var(--font-caveat), cursive",
                fontSize: 14,
                color: "var(--ink-soft)",
                fontStyle: "italic",
              }}
            >
              {LETTERS[idx]}
            </span>
            <span style={{ fontSize: 16, color: "var(--ink)" }}>
              <Latex>{c}</Latex>
            </span>
          </button>
        );
      })}
    </div>
  );
}
