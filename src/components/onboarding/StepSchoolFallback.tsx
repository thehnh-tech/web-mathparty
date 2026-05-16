"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import OnbHeader from "./OnbHeader";
import OnbCTA from "./OnbCTA";
import SkInput from "@/components/ui/SkInput";
import EnvelopeIllustration from "@/components/ui/EnvelopeIllustration";
import Squiggle from "@/components/ui/Squiggle";
import Annotation from "@/components/login/Annotation";
import {
  searchSchoolsAction,
  sendMagicLinkWithSchoolAction,
} from "@/actions/auth";
import type { University } from "@/lib/universities";

interface StepSchoolFallbackProps {
  email: string;
}

export default function StepSchoolFallback({ email }: StepSchoolFallbackProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<University[]>([]);
  const [selected, setSelected] = useState<University | null>(null);
  const [searching, startSearch] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      startSearch(async () => {
        const data = await searchSchoolsAction(trimmed);
        setResults(data);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const domain = email.split("@")[1] ?? "";

  async function handleContinue() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    const result = await sendMagicLinkWithSchoolAction(
      email,
      selected.name,
      selected.initial
    );
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/onboarding/1?email=${encodeURIComponent(email)}`);
  }

  return (
    <>
      <OnbHeader currentStep={1} />

      <EnvelopeIllustration />

      <h1
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "32px",
          fontWeight: 700,
          lineHeight: 1.05,
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        oups — we didn&apos;t
        <br />
        find your school
      </h1>

      <Squiggle width={120} style={{ margin: "8px auto 0" }} />

      <p
        style={{
          textAlign: "center",
          marginTop: "12px",
          fontSize: "14px",
          color: "var(--ink-soft)",
          fontFamily: "var(--font-kalam), cursive",
          lineHeight: 1.45,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            color: "var(--ink)",
          }}
        >
          @{domain}
        </span>{" "}
        isn&apos;t in our list yet.
        <br />
        pick your school manually below.
      </p>

      <div style={{ marginTop: "16px" }}>
        <SkInput
          placeholder="🔍  search schools…"
          value={query}
          onChange={setQuery}
        />
      </div>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxHeight: "320px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        {searching && results.length === 0 && (
          <p
            style={{
              fontFamily: "var(--font-kalam), cursive",
              fontSize: "13px",
              color: "var(--ink-soft)",
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            searching…
          </p>
        )}
        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <p
            style={{
              fontFamily: "var(--font-kalam), cursive",
              fontSize: "13px",
              color: "var(--ink-soft)",
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            no school matches that query
          </p>
        )}
        {results.map((s) => {
          const isSelected = selected?.name === s.name && selected?.domain === s.domain;
          return (
            <button
              key={`${s.name}-${s.domain}`}
              onClick={() => setSelected(s)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                border: "2px solid var(--ink)",
                borderRadius: "10px",
                padding: "12px 14px",
                backgroundColor: isSelected ? "var(--accent-soft)" : "var(--paper)",
                boxShadow: isSelected ? "3px 3px 0 var(--ink)" : "none",
                cursor: "pointer",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-kalam), cursive",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.name}
                </div>
                {s.domain && (
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "11px",
                      color: "var(--ink-soft)",
                      marginTop: "2px",
                    }}
                  >
                    @{s.domain}
                  </div>
                )}
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  border: "2px solid var(--ink)",
                  borderRadius: "50%",
                  backgroundColor: isSelected ? "var(--ink)" : "var(--paper)",
                  color: isSelected ? "var(--paper)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                ✓
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--accent)",
            textAlign: "center",
            marginTop: "10px",
            fontFamily: "var(--font-kalam), cursive",
          }}
        >
          {error}
        </p>
      )}

      <Annotation
        style={{
          top: "70px",
          right: "10px",
          transform: "rotate(6deg)",
        }}
      >
        domain not in
        <br />
        our DB ?
      </Annotation>

      <OnbCTA
        label={submitting ? "Sending…" : "Continue with selected →"}
        variant="primary"
        onClick={handleContinue}
        disabled={!selected || submitting}
        secondaryLabel="change email"
        onSecondary={() => router.push("/login")}
      />
    </>
  );
}
