"use client";

import React, { useEffect } from "react";
import { CHAPTERS, ChapterId } from "@/lib/chapters";

interface Props {
  open: boolean;
  selected: ChapterId;
  onPick: (id: ChapterId) => void;
  onClose: () => void;
}

const CHAPTER_META: Record<ChapterId, { emoji: string; description: string }> =
  {
    all: {
      emoji: "🎯",
      description: "random questions from the whole pool",
    },
    algebre: {
      emoji: "🧮",
      description: "equations, inequalities, matrices, complex numbers",
    },
    analyse: {
      emoji: "📈",
      description: "derivatives, limits, primitives, diff eqs",
    },
    trigo_explog: {
      emoji: "🔁",
      description: "trig, logarithms, powers",
    },
    denombrement: {
      emoji: "🎲",
      description: "combinatorics, sums, products, binomial",
    },
  };

export default function ChapterPickerModal({
  open,
  selected,
  onPick,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const ACCENT = "var(--accent, #d34b3a)";

  function cardStyle(isSel: boolean) {
    return {
      position: "relative" as const,
      padding: "16px 12px 14px",
      border: `2px solid ${isSel ? ACCENT : "var(--ink)"}`,
      borderRadius: 14,
      background: isSel ? "rgba(211,75,58,0.08)" : "var(--paper)",
      boxShadow: isSel ? `3px 3px 0 ${ACCENT}` : "2px 2px 0 var(--ink)",
      cursor: "pointer",
      textAlign: "left" as const,
      display: "flex",
      flexDirection: "column" as const,
      gap: 6,
      minHeight: 110,
      transition: "border-color 150ms, background 150ms, box-shadow 150ms",
    };
  }

  const isAllSel = selected === "all";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 12,
        animation: "chapter-modal-fade 180ms ease",
      }}
    >
      <style>{`
        @keyframes chapter-modal-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chapter-modal-slide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--paper)",
          border: "2.5px solid var(--ink)",
          borderRadius: 18,
          boxShadow: "5px 5px 0 var(--ink)",
          padding: "18px 16px 20px",
          animation: "chapter-modal-slide 220ms ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-caveat), cursive",
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Pick a chapter
            </h2>
            <p
              style={{
                fontFamily: "var(--font-kalam), cursive",
                fontSize: 12,
                color: "var(--ink-soft)",
                marginTop: 4,
              }}
            >
              questions are pulled from this chapter only
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--paper-2, #f5f5f5)",
              border: "2px solid var(--ink)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {/* All chapters — full-width, recommended */}
          <button
            onClick={() => {
              onPick("all");
              onClose();
            }}
            style={{
              ...cardStyle(isAllSel),
              gridColumn: "1 / -1",
              flexDirection: "row",
              alignItems: "center",
              minHeight: "auto",
              padding: "14px 16px",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
              {CHAPTER_META.all.emoji}
            </span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1.05,
                }}
              >
                All chapters
              </div>
              <div
                style={{
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: 11,
                  color: "var(--ink-soft)",
                  lineHeight: 1.3,
                }}
              >
                {CHAPTER_META.all.description}
              </div>
            </div>
            <span
              style={{
                padding: "3px 9px",
                background: ACCENT,
                color: "#fff",
                borderRadius: 999,
                fontFamily: "var(--font-kalam), cursive",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.3,
                flexShrink: 0,
              }}
            >
              recommended
            </span>
            {isAllSel && (
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: ACCENT,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
            )}
          </button>

          {/* Individual chapters */}
          {CHAPTERS.map((c) => {
            const meta = CHAPTER_META[c.id];
            const isSel = c.id === selected;
            return (
              <button
                key={c.id}
                onClick={() => {
                  onPick(c.id);
                  onClose();
                }}
                style={cardStyle(isSel)}
              >
                <div style={{ fontSize: 26, lineHeight: 1 }}>{meta.emoji}</div>
                <div
                  style={{
                    fontFamily: "var(--font-caveat), cursive",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--ink)",
                    lineHeight: 1.05,
                  }}
                >
                  {c.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-kalam), cursive",
                    fontSize: 11,
                    color: "var(--ink-soft)",
                    lineHeight: 1.3,
                  }}
                >
                  {meta.description}
                </div>
                {isSel && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: ACCENT,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
