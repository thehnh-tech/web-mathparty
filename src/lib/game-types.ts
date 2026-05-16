import type { ChapterId } from "./chapters";

export type QuestionType = "numeric" | "math_input" | "qcm" | "sign_table";

export interface Question {
  id: number;
  question: string;
  type: QuestionType;
  answer: string;
  acceptedAnswers?: string[];
  choices?: string[];
  difficulty: number;
  topic: string;
  active: boolean;
  reason?: string;
}

export interface Player {
  userId: string;
  handle: string;
  initial: string;
  lives: number;
  eliminated: boolean;
  isHost: boolean;
}

export interface LastAnswer {
  userId: string;
  raw: string;
  correct: boolean;
  cause: AnswerCause;
  ts: number;
}

export type RoomStatus = "waiting" | "playing" | "finished";

export type RoomType = "public" | "private";

export type AnswerCause = "answer" | "explosion";

export interface AnswerEvent {
  playerId: string;
  questionId: number;
  topic: string;
  raw: string;
  correct: boolean;
  solveMs: number;
  ts: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  hostHandle: string;
  subject: string;
  chapterId: ChapterId;
  roomType: RoomType;
  status: RoomStatus;
  players: Player[];
  currentPlayerId: string | null;
  currentQuestion: Question | null;
  lastAnswer: LastAnswer | null;
  winnerId: string | null;
  round: number;
  maxLives: number;
  maxSlots: number;
  revealUntilTs: number | null;
  startedAt: number | null;
  currentQuestionStartedAt: number | null;
  bombExplodeAt: number | null;
  history: AnswerEvent[];
  persisted?: boolean;
}

export type AnswerPayload =
  | { kind: "choice"; idx: number }
  | { kind: "text"; value: string };
