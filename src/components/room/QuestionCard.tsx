"use client";

import React from "react";
import Latex from "@/components/Latex";
import { humanizeTopic } from "@/lib/chapters";

interface Props {
  latex: string;
  topic?: string;
}

export default function QuestionCard({ latex, topic }: Props) {
  return (
    <div
      style={{
        position: "relative",
        border: "2.5px solid var(--ink)",
        borderRadius: 18,
        background: "var(--paper)",
        padding: "26px 18px 22px",
        boxShadow: "3px 3px 0 var(--ink)",
        minHeight: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {/* Pink tape */}
      <div
        style={{
          position: "absolute",
          top: -10,
          left: "50%",
          transform: "translateX(-50%) rotate(-2deg)",
          width: 64,
          height: 18,
          background:
            "linear-gradient(180deg, rgba(244,180,170,0.95), rgba(232,158,148,0.95))",
          border: "1px solid rgba(0,0,0,0.18)",
          borderRadius: 3,
          boxShadow: "1px 1px 0 rgba(0,0,0,0.12)",
        }}
      />

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {topic && (
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              color: "var(--ink-soft)",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              padding: "2px 10px",
              border: "1px dashed var(--ink-muted, #999)",
              borderRadius: 999,
            }}
          >
            {humanizeTopic(topic)}
          </span>
        )}
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.45,
            color: "var(--ink)",
            width: "100%",
            overflowX: "auto",
          }}
        >
          <Latex display>{latex}</Latex>
        </div>
      </div>
    </div>
  );
}
