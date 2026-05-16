import raw from "@/data/questions.json";
import { Question } from "./game-types";
import { chapterById, ChapterId } from "./chapters";

const ALL = raw as Question[];
export const QUESTIONS: Question[] = ALL.filter(
  (q) => q.active && q.type !== "sign_table"
);

export function pickRandomQuestion(excludeId?: number): Question {
  const pool = excludeId
    ? QUESTIONS.filter((q) => q.id !== excludeId)
    : QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRandomQuestionForChapter(
  chapterId: ChapterId,
  excludeId?: number
): Question {
  const ch = chapterById(chapterId);
  const topics = new Set<string>(ch.topics);
  const inChapter = QUESTIONS.filter((q) => topics.has(q.topic));
  const pool =
    excludeId && inChapter.length > 1
      ? inChapter.filter((q) => q.id !== excludeId)
      : inChapter;
  if (pool.length === 0) {
    // chapter has no active questions — fall back to global pool to keep
    // gameplay alive rather than crash.
    return pickRandomQuestion(excludeId);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalize(s: string): string {
  return s
    .replace(/\s+/g, "")
    .replace(/\\,/g, "")
    .replace(/[{}]/g, "")
    .toLowerCase();
}

export function isAnswerCorrect(q: Question, raw: string): boolean {
  if (q.type === "qcm") {
    return raw === q.answer;
  }
  const candidates = q.acceptedAnswers ?? [q.answer];
  const target = normalize(raw);

  if (candidates.some((c) => normalize(c) === target)) return true;

  if (q.type === "numeric") {
    const n = Number(raw.replace(",", "."));
    if (!Number.isNaN(n)) {
      return candidates.some((c) => {
        const cn = Number(c.replace(",", "."));
        return !Number.isNaN(cn) && cn === n;
      });
    }
  }
  return false;
}
