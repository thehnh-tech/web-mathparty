"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  bombExplodeAt: number | null;
  exploding: boolean;
}

export default function BombCenter({ bombExplodeAt, exploding }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [showBoom, setShowBoom] = useState(false);
  const [fragments, setFragments] = useState<Array<{ fx: number; fy: number }>>(
    []
  );

  // Trigger explosion FX when `exploding` flips to true.
  useEffect(() => {
    if (exploding) {
      setFragments(
        Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const dist = 60 + Math.random() * 40;
          return {
            fx: Math.cos(angle) * dist,
            fy: Math.sin(angle) * dist,
          };
        })
      );
      setShowBoom(true);
      const t = setTimeout(() => setShowBoom(false), 900);
      return () => clearTimeout(t);
    }
  }, [exploding]);

  // Shake the bomb with intensity ramping up as time runs out.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    if (!bombExplodeAt || exploding) {
      el.style.transform = "";
      return;
    }

    let raf = 0;
    function tick() {
      if (!el) return;
      const now = Date.now();
      const timeLeft = (bombExplodeAt as number) - now;

      if (timeLeft <= 0) {
        el.style.transform = "";
        return;
      }

      // Intensity: 0 when > 6s left, ramps to 1 at 0s.
      const intensity = Math.max(0, Math.min(1, 1 - timeLeft / 6000));
      // Soft floor so it always trembles a bit.
      const amp = 0.4 + intensity * intensity * 5.5;
      const rotAmp = intensity * intensity * 3.2;

      const dx = (Math.random() - 0.5) * amp;
      const dy = (Math.random() - 0.5) * amp;
      const r = (Math.random() - 0.5) * rotAmp;
      el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${r.toFixed(2)}deg)`;

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (el) el.style.transform = "";
    };
  }, [bombExplodeAt, exploding]);

  const armed = bombExplodeAt !== null && !exploding;

  return (
    <div
      style={{
        position: "relative",
        width: 96,
        height: 96,
      }}
    >
      <style>{`
        @keyframes bomb-flash {
          0%   { opacity: 0; transform: scale(0.4); }
          25%  { opacity: 1; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(2.2); }
        }
        @keyframes bomb-shockwave {
          0%   { opacity: 0.9; transform: scale(0.2); }
          100% { opacity: 0;   transform: scale(2.6); }
        }
        @keyframes bomb-fragment {
          0%   { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--fx), var(--fy)) scale(0.4); }
        }
        @keyframes bomb-emoji-pop {
          0%   { opacity: 0; transform: scale(0.4); }
          30%  { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes bomb-idle-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
      `}</style>

      <div
        ref={wrapRef}
        style={{
          position: "absolute",
          inset: 0,
          willChange: "transform",
          transition: "transform 40ms linear",
          animation:
            !armed && !exploding ? "bomb-idle-pulse 1.6s ease-in-out infinite" : undefined,
        }}
      >
        {/* body */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 30%, #4a4a4a 0%, #1a1a1a 55%, #000 100%)",
            boxShadow:
              "inset -8px -10px 18px rgba(0,0,0,0.6), inset 6px 6px 12px rgba(255,255,255,0.08), 0 4px 0 rgba(0,0,0,0.2)",
            border: "2px solid var(--ink)",
          }}
        />
        {/* highlight (eye) */}
        <div
          style={{
            position: "absolute",
            top: "44%",
            left: "44%",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "var(--paper)",
            border: "2px solid var(--ink)",
            boxShadow: "inset 1px 1px 0 rgba(0,0,0,0.4)",
          }}
        />
        {/* fuse */}
        <div
          style={{
            position: "absolute",
            top: -8,
            left: "62%",
            width: 3,
            height: 18,
            background: "#3a2010",
            transform: "rotate(20deg)",
            transformOrigin: "bottom center",
            borderRadius: 2,
          }}
        />
        {/* sparkle on the fuse — animate when armed */}
        <span
          style={{
            position: "absolute",
            top: -16,
            left: "70%",
            fontSize: 18,
            color: "var(--accent, #d34b3a)",
            textShadow: "0 0 6px rgba(255,160,80,0.85)",
            animation: armed
              ? "bomb-idle-pulse 0.4s ease-in-out infinite"
              : undefined,
          }}
        >
          ✦
        </span>
      </div>

      {/* Explosion overlay */}
      {showBoom && (
        <div
          style={{
            position: "absolute",
            inset: -40,
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          {/* Flash */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,220,120,1) 0%, rgba(255,140,60,0.85) 35%, rgba(211,75,58,0) 70%)",
              animation: "bomb-flash 700ms ease-out forwards",
            }}
          />
          {/* Shockwave ring */}
          <div
            style={{
              position: "absolute",
              inset: 12,
              border: "3px solid rgba(255,160,80,0.8)",
              borderRadius: "50%",
              animation: "bomb-shockwave 700ms ease-out forwards",
            }}
          />
          {/* Fragments */}
          {fragments.map(({ fx, fy }, i) => {
            return (
              <span
                key={i}
                style={
                  {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 8,
                    height: 8,
                    background:
                      i % 2 === 0
                        ? "var(--accent, #d34b3a)"
                        : "#ffae5a",
                    borderRadius: "50%",
                    border: "1.5px solid var(--ink)",
                    "--fx": `${fx.toFixed(0)}px`,
                    "--fy": `${fy.toFixed(0)}px`,
                    animation: "bomb-fragment 700ms ease-out forwards",
                    transformOrigin: "center",
                  } as React.CSSProperties
                }
              />
            );
          })}
          {/* Boom emoji */}
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 48,
              animation: "bomb-emoji-pop 700ms ease-out forwards",
            }}
          >
            💥
          </span>
        </div>
      )}
    </div>
  );
}
