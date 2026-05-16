"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import StickyBack from "@/components/ui/StickyBack";
import SkAvatar from "@/components/ui/SkAvatar";
import { HEATMAP_COLORS, formatTimeAgo } from "@/lib/profile-data";
import type { ProfileData } from "@/lib/profile-data.server";

gsap.registerPlugin(useGSAP);

export interface ProfileHeader {
  displayName: string;
  initials: string;
  subtitle: string;
  elo: number;
  streak: number;
}

interface Props {
  header: ProfileHeader;
  data: ProfileData;
}

export default function ProfileClient({ header, data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const WEEKS = data.heatmapWeeks;

  useGSAP(
    () => {
      gsap.from(".prof-header", {
        y: 12,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.from(".stat-card", {
        scale: 0.94,
        opacity: 0,
        duration: 0.35,
        stagger: 0.07,
        ease: "power2.out",
        delay: 0.15,
      });
      gsap.from(".skill-bar-fill", {
        scaleX: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.3,
        transformOrigin: "left center",
      });
      gsap.from(".heat-cell", {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        stagger: { each: 0.004, from: "start" },
        ease: "power1.out",
        delay: 0.5,
      });
      gsap.from(".game-row", {
        x: -10,
        opacity: 0,
        duration: 0.3,
        stagger: 0.07,
        ease: "power2.out",
        delay: 0.55,
      });
    },
    { scope: containerRef }
  );

  const cards = [
    { value: String(data.cards.games), label: "games" },
    {
      value: data.cards.games > 0 ? `${data.cards.winRate}%` : "—",
      label: "win rate",
    },
    {
      value:
        data.cards.avgSolveSeconds != null
          ? `${data.cards.avgSolveSeconds.toFixed(1)}s`
          : "—",
      label: "avg solve",
      highlight: true,
    },
  ];

  const hasAnyChapterData = data.chapters.some((c) => c.asked > 0);
  const hasGames = data.recentGames.length > 0;

  return (
    <>
      <StickyBack href="/lobby" label="lobby" />

      <div
        className="profile-page"
        ref={containerRef}
        style={{
          padding: "20px 20px 48px",
          overflowX: "hidden",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* ── Profile header ── */}
        <div
          className="prof-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <SkAvatar initials={header.initials} size={72} dark />

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: "var(--font-caveat), cursive",
                fontSize: "34px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {header.displayName}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-kalam), cursive",
                fontSize: "13px",
                color: "var(--ink-soft)",
                marginTop: "4px",
              }}
            >
              {header.subtitle}
            </p>

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  border: "2px solid var(--ink)",
                  borderRadius: "999px",
                  padding: "3px 12px",
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: "13px",
                  fontWeight: 700,
                  boxShadow: "2px 2px 0 var(--ink)",
                }}
              >
                {header.elo} elo
              </span>
              <span
                style={{
                  border: "2px solid var(--ink)",
                  borderRadius: "999px",
                  padding: "3px 12px",
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: "13px",
                  fontWeight: 700,
                  boxShadow: "2px 2px 0 var(--ink)",
                }}
              >
                🔥 {header.streak}d
              </span>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {cards.map(({ value, label, highlight }) => (
            <div
              key={label}
              className="stat-card"
              style={{
                border: `${highlight ? "3px" : "2px"} solid var(--ink)`,
                borderRadius: "12px",
                padding: "14px 8px",
                textAlign: "center",
                backgroundColor: "var(--paper)",
                boxShadow: highlight ? "4px 4px 0 var(--ink)" : "2px 2px 0 var(--ink)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontSize: "30px",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: "11px",
                  color: "var(--ink-soft)",
                  marginTop: "4px",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Per-chapter strength ── */}
        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "22px",
              fontWeight: 600,
              marginBottom: "14px",
            }}
          >
            par chapitre
          </h2>

          {!hasAnyChapterData ? (
            <p
              style={{
                fontFamily: "var(--font-kalam), cursive",
                fontSize: "13px",
                color: "var(--ink-soft)",
                fontStyle: "italic",
              }}
            >
              joue ta première partie pour voir tes stats par chapitre.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.chapters.map((c) => {
                const empty = c.asked === 0;
                return (
                  <div key={c.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-kalam), cursive",
                          fontSize: 14,
                          fontWeight: 700,
                          color: empty ? "var(--ink-muted, #999)" : "var(--ink)",
                        }}
                      >
                        {c.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: 11,
                          color: "var(--ink-soft)",
                        }}
                      >
                        {empty ? "—" : `${c.score}%`}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        border: "1.5px solid var(--ink)",
                        borderRadius: 999,
                        background: "var(--paper-2, #f5f5f5)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="skill-bar-fill"
                        style={{
                          height: "100%",
                          width: `${c.score}%`,
                          background: empty
                            ? "var(--ink-muted, #ccc)"
                            : "var(--accent, #d34b3a)",
                          transformOrigin: "left center",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Activity heatmap ── */}
        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "22px",
              fontWeight: 600,
              marginBottom: "14px",
            }}
          >
            activity · last {WEEKS} weeks
          </h2>

          <div
            style={{
              border: "2px solid var(--ink)",
              borderRadius: "12px",
              padding: "12px",
              backgroundColor: "var(--paper)",
              boxShadow: "3px 3px 0 var(--ink)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
                gridTemplateRows: "repeat(7, 1fr)",
                gap: "4px",
              }}
            >
              {Array.from({ length: 7 }, (_, day) =>
                Array.from({ length: WEEKS }, (_, week) => {
                  const idx = day * WEEKS + week;
                  const level = data.heatmap[idx] ?? 0;
                  return (
                    <div
                      key={`${week}-${day}`}
                      className="heat-cell"
                      style={{
                        aspectRatio: "1",
                        borderRadius: "3px",
                        border: "1.5px solid rgba(26,26,26,0.15)",
                        backgroundColor: HEATMAP_COLORS[level],
                      }}
                    />
                  );
                })
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
                marginTop: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: "11px",
                  color: "var(--ink-soft)",
                  marginRight: "4px",
                }}
              >
                less
              </span>
              {HEATMAP_COLORS.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "3px",
                    border: "1.5px solid rgba(26,26,26,0.2)",
                    backgroundColor: color,
                  }}
                />
              ))}
              <span
                style={{
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: "11px",
                  color: "var(--ink-soft)",
                  marginLeft: "4px",
                }}
              >
                more
              </span>
            </div>
          </div>
        </section>

        {/* ── Recent games ── */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "22px",
              fontWeight: 600,
              marginBottom: "14px",
            }}
          >
            recent games
          </h2>

          {!hasGames ? (
            <p
              style={{
                fontFamily: "var(--font-kalam), cursive",
                fontSize: "13px",
                color: "var(--ink-soft)",
                fontStyle: "italic",
              }}
            >
              aucune partie pour l&apos;instant — direction le lobby.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.recentGames.map((game, idx) => {
                const isWin = game.result === "W";
                return (
                  <div
                    key={game.gameId}
                    className="game-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 0",
                      borderBottom:
                        idx < data.recentGames.length - 1
                          ? "1px dashed var(--ink-muted)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "8px",
                        border: "2px solid var(--ink)",
                        backgroundColor: isWin ? "var(--ink)" : "var(--paper)",
                        color: isWin ? "var(--paper)" : "var(--ink)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-caveat), cursive",
                        fontSize: "16px",
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: isWin ? "2px 2px 0 var(--ink-soft)" : "none",
                      }}
                    >
                      {game.result}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-kalam), cursive",
                          fontSize: "15px",
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        {game.chapterLabel}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-kalam), cursive",
                          fontSize: "12px",
                          color: "var(--ink-soft)",
                          marginTop: "2px",
                        }}
                      >
                        finished {game.position}/{game.totalPlayers} ·{" "}
                        {formatTimeAgo(game.finishedAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
