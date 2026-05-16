import React from "react";

export default function BombIllustration() {
  return (
    <div style={{ position: "relative", width: 120, height: 140, margin: "0 auto" }}>
      {/* Bomb body */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: "3px solid var(--ink)",
          backgroundColor: "var(--paper)",
          boxShadow: "4px 4px 0 var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-caveat), cursive",
            fontSize: "32px",
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1,
          }}
        >
          7×8?
        </span>
      </div>

      {/* Fuse */}
      <div
        style={{
          position: "absolute",
          top: 4,
          left: "calc(50% + 20px)",
          width: "3px",
          height: "24px",
          backgroundColor: "var(--ink)",
          transform: "rotate(20deg)",
          transformOrigin: "bottom center",
          borderRadius: "2px",
        }}
      />

      {/* Sparkle */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: "calc(50% + 30px)",
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--accent)",
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        ✦
      </span>
    </div>
  );
}
