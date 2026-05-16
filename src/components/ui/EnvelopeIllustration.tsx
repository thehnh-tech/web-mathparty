import React from "react";

export default function EnvelopeIllustration() {
  return (
    <div
      style={{
        position: "relative",
        width: 160,
        height: 110,
        margin: "14px auto 0",
      }}
    >
      {/* Motion lines */}
      <svg
        style={{ position: "absolute", top: -8, left: -28 }}
        width="30"
        height="50"
        viewBox="0 0 30 50"
        fill="none"
      >
        <path
          d="M 24 8 Q 10 20 18 35"
          stroke="var(--ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 16 4 Q 4 16 10 30"
          stroke="var(--ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Envelope box */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "3px solid var(--ink)",
          borderRadius: "8px",
          backgroundColor: "var(--paper)",
          boxShadow: "4px 4px 0 var(--ink)",
          overflow: "hidden",
        }}
      >
        {/* Envelope flap SVG */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 160 110"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Flap lines */}
          <path
            d="M 4 8 L 80 66 L 156 8"
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Bottom crease lines */}
          <path
            d="M 4 102 L 60 66"
            stroke="var(--ink)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 156 102 L 100 66"
            stroke="var(--ink)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Sparkle */}
      <span
        style={{
          position: "absolute",
          top: -18,
          right: -10,
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "30px",
          fontWeight: 700,
          color: "var(--accent)",
          transform: "rotate(15deg)",
          display: "block",
          lineHeight: 1,
        }}
      >
        ✦
      </span>
    </div>
  );
}
