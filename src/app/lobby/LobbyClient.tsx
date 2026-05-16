"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SkAvatar from "@/components/ui/SkAvatar";
import Annotation from "@/components/login/Annotation";
import { CHAPTERS, ChapterId, chapterById } from "@/lib/chapters";
import { createRoomAction } from "@/actions/room";
import { signOutAction, signOutGuestAction } from "@/actions/auth";
import {
  listPublicRoomsAction,
  PublicRoomSummary,
} from "@/actions/lobby";
import ChapterPickerModal from "@/components/lobby/ChapterPickerModal";

gsap.registerPlugin(useGSAP);

const CODE_LENGTH = 6;
const POINTER_DISMISS_KEY = "bomba_profile_pointer_seen";
const ROOMS_POLL_MS = 4000;

export interface LobbyUser {
  displayName: string;
  initials: string;
  subtitle: string;
  isGuest: boolean;
}

interface Props {
  user: LobbyUser;
}

type ChapterFilter = ChapterId;

export default function LobbyClient({ user }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [roomType, setRoomType] = useState<"public" | "private">("public");
  const [filter, setFilter] = useState<ChapterFilter>("all");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterId>("all");
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPointer, setShowPointer] = useState(false);

  // Profile pointer hint — show only first time
  useEffect(() => {
    if (user.isGuest) return;
    try {
      if (!localStorage.getItem(POINTER_DISMISS_KEY)) {
        setShowPointer(true);
      }
    } catch {}
  }, [user.isGuest]);

  function dismissPointer() {
    setShowPointer(false);
    try {
      localStorage.setItem(POINTER_DISMISS_KEY, "1");
    } catch {}
  }

  // Poll public rooms
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const rooms = await listPublicRoomsAction();
        if (!cancelled) setPublicRooms(rooms);
      } catch {
        // silently ignore — next tick will retry
      }
      if (!cancelled) timer = setTimeout(tick, ROOMS_POLL_MS);
    }
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleCreate = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    const res = await createRoomAction(selectedChapter, roomType);
    setCreating(false);
    if ("error" in res) {
      setCreateError(res.error);
      return;
    }
    const label = chapterById(selectedChapter).label;
    router.push(`/room?code=${res.code}&subject=${encodeURIComponent(label)}`);
  }, [creating, router, selectedChapter, roomType]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (user.isGuest) {
        await signOutGuestAction();
      } else {
        await signOutAction();
      }
    } catch {}
    router.push("/login");
  }, [loggingOut, router, user.isGuest]);

  // — Entrance animation
  useGSAP(
    () => {
      gsap.from(".lobby-section", {
        y: 14,
        opacity: 0,
        duration: 0.45,
        stagger: 0.1,
        ease: "power2.out",
      });
      gsap.from(".room-card", {
        y: 10,
        opacity: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: "power2.out",
        delay: 0.35,
      });
    },
    { scope: containerRef }
  );

  // — Code input logic
  const handleCodeKey = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (code[idx]) {
          const next = [...code];
          next[idx] = "";
          setCode(next);
        } else if (idx > 0) {
          inputRefs.current[idx - 1]?.focus();
        }
      }
    },
    [code]
  );

  const handleCodeChange = useCallback(
    (idx: number, char: string) => {
      const next = [...code];
      next[idx] = char;
      setCode(next);
      if (char && idx < CODE_LENGTH - 1) {
        inputRefs.current[idx + 1]?.focus();
      }
    },
    [code]
  );

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((c, i) => (next[i] = c));
    setCode(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    e.preventDefault();
  }

  const codeComplete = code.every(Boolean);

  function joinWithCode() {
    if (codeComplete) {
      router.push(`/room?code=${code.join("")}`);
    }
  }

  function joinPublicRoom(r: PublicRoomSummary) {
    if (r.players >= r.maxSlots) return;
    if (r.status !== "waiting") return;
    router.push(`/room?code=${r.code}&subject=${encodeURIComponent(r.subject)}`);
  }

  const visibleRooms =
    filter === "all"
      ? publicRooms
      : publicRooms.filter((r) => r.chapterId === filter);

  const openCount = visibleRooms.filter(
    (r) => r.status === "waiting" && r.players < r.maxSlots
  ).length;

  const filterPills: { id: ChapterFilter; label: string }[] = [
    { id: "all", label: "all" },
    ...CHAPTERS.map((c) => ({ id: c.id as ChapterFilter, label: c.label })),
  ];

  return (
    <div
      className="lobby-page"
      ref={containerRef}
      style={{
        padding: "56px 20px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        className="lobby-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "32px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            hey, {user.displayName} 👋
          </h1>
          <p
            style={{
              fontFamily: "var(--font-kalam), cursive",
              fontSize: "14px",
              color: "var(--ink-soft)",
              marginTop: "4px",
            }}
          >
            {user.subtitle}
          </p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              marginTop: 8,
              background: "transparent",
              border: "none",
              padding: 0,
              color: "var(--ink-soft)",
              fontFamily: "var(--font-kalam), cursive",
              fontSize: 12,
              textDecoration: "underline",
              cursor: loggingOut ? "default" : "pointer",
              opacity: loggingOut ? 0.4 : 1,
            }}
          >
            {loggingOut ? "logging out…" : "logout"}
          </button>
        </div>

        <div style={{ position: "relative" }}>
          {user.isGuest ? (
            <SkAvatar initials={user.initials} size={44} dark />
          ) : (
            <button
              onClick={() => {
                dismissPointer();
                router.push("/profile");
              }}
              style={{
                background: "none",
                border: "2px dashed var(--ink)",
                borderRadius: "50%",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SkAvatar initials={user.initials} size={44} dark />
            </button>
          )}
          {showPointer && (
            <>
              <Annotation
                style={{
                  top: 56,
                  right: 0,
                  width: 130,
                  textAlign: "right",
                }}
              >
                ↗ your profile
                <br />& stats
              </Annotation>
            </>
          )}
        </div>
      </div>

      {/* Join with code */}
      <div className="lobby-section">
        <p
          style={{
            fontFamily: "var(--font-caveat), cursive",
            fontSize: "22px",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          Join with code
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "8px",
            width: "100%",
          }}
          onPaste={handleCodePaste}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={code[i]}
              onChange={(e) => {
                const raw = e.target.value
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .toUpperCase();
                const char =
                  raw.replace(code[i], "").slice(-1) || raw.slice(-1);
                handleCodeChange(i, char);
              }}
              onKeyDown={(e) => handleCodeKey(i, e)}
              onFocus={(e) => {
                e.currentTarget.select();
                gsap.to(e.currentTarget, {
                  scale: 1.06,
                  duration: 0.15,
                  ease: "power1.out",
                });
              }}
              onBlur={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1,
                  duration: 0.15,
                  ease: "power1.out",
                });
              }}
              style={{
                width: "100%",
                height: "52px",
                border: `2px solid ${code[i] ? "var(--ink)" : "var(--ink-muted)"}`,
                borderRadius: "10px",
                backgroundColor: code[i] ? "var(--paper)" : "var(--paper-2)",
                textAlign: "center",
                fontFamily: "var(--font-caveat), cursive",
                fontSize: "26px",
                fontWeight: 700,
                color: "var(--ink)",
                outline: "none",
                caretColor: "transparent",
                boxShadow: code[i] ? "2px 2px 0 var(--ink)" : "none",
                transition:
                  "border-color 150ms, background-color 150ms, box-shadow 150ms",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            />
          ))}
        </div>

        <div
          style={{
            overflow: "hidden",
            maxHeight: codeComplete ? "56px" : "0px",
            opacity: codeComplete ? 1 : 0,
            transition: "max-height 200ms ease, opacity 200ms ease",
            marginTop: codeComplete ? "10px" : "0",
          }}
        >
          <button
            onClick={joinWithCode}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "var(--ink)",
              color: "var(--paper)",
              border: "2px solid var(--ink)",
              borderRadius: "8px",
              fontFamily: "var(--font-kalam), cursive",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "3px 3px 0 var(--ink-soft)",
            }}
          >
            Join room →
          </button>
        </div>
      </div>

      {/* Create a room */}
      <div className="lobby-section">
        <div
          style={{
            border: "2px solid var(--ink)",
            borderRadius: "14px",
            padding: "16px",
            backgroundColor: "var(--paper)",
            boxShadow: "4px 4px 0 var(--ink)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-caveat), cursive",
                fontSize: "22px",
                fontWeight: 600,
              }}
            >
              Create a room
            </span>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                color: "var(--ink-soft)",
              }}
            >
              you = host
            </span>
          </div>

          {/* Chapter selector — opens modal */}
          <button
            onClick={() => setChapterModalOpen(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              border: "2px solid var(--ink)",
              borderRadius: 10,
              background: "var(--paper-2, #f7f4ee)",
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 10,
                  color: "var(--ink-soft)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                chapter
              </div>
              <div
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1.05,
                }}
              >
                {chapterById(selectedChapter).label}
              </div>
            </div>
            <span
              style={{
                fontFamily: "var(--font-kalam), cursive",
                fontSize: 13,
                color: "var(--ink-soft)",
              }}
            >
              change ▾
            </span>
          </button>

          {/* Public/private toggle */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {(["public", "private"] as const).map((type) => {
              const selected = roomType === type;
              return (
                <div key={type}>
                  <button
                    onClick={() => setRoomType(type)}
                    style={{
                      width: "100%",
                      padding: "12px 8px",
                      border: "2px solid var(--ink)",
                      borderRadius: "8px",
                      backgroundColor: selected
                        ? "var(--accent)"
                        : "var(--paper)",
                      color: selected ? "#fff" : "var(--ink)",
                      fontFamily: "var(--font-kalam), cursive",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: selected ? "3px 3px 0 var(--ink)" : "none",
                      transition:
                        "background-color 150ms, color 150ms, box-shadow 150ms",
                    }}
                  >
                    {type === "public" ? "🌐 Public" : "🔒 Private"}
                  </button>
                  <p
                    style={{
                      fontFamily: "var(--font-kalam), cursive",
                      fontSize: "11px",
                      color: "var(--ink-soft)",
                      textAlign: "center",
                      marginTop: "4px",
                    }}
                  >
                    {type === "public"
                      ? "listed · anyone joins"
                      : "code only · invite friends"}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              width: "100%",
              marginTop: "14px",
              padding: "11px",
              backgroundColor: creating ? "var(--ink-muted)" : "var(--ink)",
              color: "var(--paper)",
              border: "2px solid var(--ink)",
              borderRadius: "8px",
              fontFamily: "var(--font-kalam), cursive",
              fontSize: "15px",
              fontWeight: 700,
              cursor: creating ? "not-allowed" : "pointer",
              boxShadow: creating ? "none" : "3px 3px 0 var(--ink-soft)",
            }}
          >
            {creating ? "Creating…" : "Create →"}
          </button>
          {createError && (
            <p
              style={{
                marginTop: "8px",
                fontFamily: "var(--font-kalam), cursive",
                fontSize: "12px",
                color: "#a00",
              }}
            >
              {createError}
            </p>
          )}
        </div>
      </div>

      {/* Browse rooms — live public rooms */}
      <div className="lobby-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "22px",
              fontWeight: 600,
            }}
          >
            Browse rooms
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              color: "var(--ink-soft)",
            }}
          >
            {openCount} open
          </span>
        </div>

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            overflowY: "visible",
            paddingBottom: "4px",
            marginBottom: "12px",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            marginLeft: "-20px",
            marginRight: "-20px",
            paddingLeft: "20px",
            paddingRight: "20px",
          }}
        >
          {filterPills.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  border: "2px solid var(--ink)",
                  borderRadius: "999px",
                  backgroundColor: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--paper)" : "var(--ink)",
                  fontFamily: "var(--font-kalam), cursive",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background-color 120ms, color 120ms",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {visibleRooms.length === 0 ? (
          <div
            style={{
              border: "2px dashed var(--ink-muted, #ccc)",
              borderRadius: 12,
              padding: "20px 16px",
              textAlign: "center",
              fontFamily: "var(--font-kalam), cursive",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            no public rooms yet — be the first to create one!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {visibleRooms.map((room) => {
              const full = room.players >= room.maxSlots;
              const live = room.status === "playing";
              const disabled = live || full;
              const initial = room.subject.slice(0, 1).toUpperCase();
              return (
                <div
                  key={room.code}
                  className="room-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    border: `2px solid ${disabled ? "var(--ink-muted)" : "var(--ink)"}`,
                    borderRadius: "12px",
                    padding: "12px 14px",
                    backgroundColor: "var(--paper)",
                    boxShadow: disabled ? "none" : "3px 3px 0 var(--ink)",
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? "default" : "pointer",
                  }}
                  onClick={() => !disabled && joinPublicRoom(room)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: `2px solid ${disabled ? "var(--ink-muted)" : "var(--ink)"}`,
                      borderRadius: "8px",
                      backgroundColor: disabled ? "var(--paper-2)" : "var(--paper)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-caveat), cursive",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: disabled ? "var(--ink-muted)" : "var(--ink)",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-kalam), cursive",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: disabled ? "var(--ink-muted)" : "var(--ink)",
                      }}
                    >
                      {room.subject}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-kalam), cursive",
                        fontSize: "12px",
                        color: "var(--ink-soft)",
                        marginTop: "1px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {room.hostHandle} · {room.players}/{room.maxSlots}
                    </div>
                  </div>

                  {live ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        border: "1px solid var(--ink-muted)",
                        borderRadius: "999px",
                        padding: "4px 10px",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: "var(--accent, #d34b3a)",
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "11px",
                          color: "var(--ink-muted)",
                        }}
                      >
                        live
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        joinPublicRoom(room);
                      }}
                      disabled={full}
                      style={{
                        padding: "7px 14px",
                        backgroundColor: full ? "var(--ink-muted)" : "var(--accent)",
                        color: "#fff",
                        border: "2px solid var(--ink)",
                        borderRadius: "8px",
                        fontFamily: "var(--font-kalam), cursive",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: full ? "not-allowed" : "pointer",
                        boxShadow: full ? "none" : "2px 2px 0 var(--ink)",
                        flexShrink: 0,
                      }}
                    >
                      join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChapterPickerModal
        open={chapterModalOpen}
        selected={selectedChapter}
        onPick={setSelectedChapter}
        onClose={() => setChapterModalOpen(false)}
      />
    </div>
  );
}
