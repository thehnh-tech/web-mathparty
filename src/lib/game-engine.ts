import { AnswerPayload, Player, RoomState, RoomType } from "./game-types";
import {
  isAnswerCorrect,
  pickRandomQuestionForChapter,
} from "./questions";
import { ChapterId, chapterById } from "./chapters";
import { schedulePersist } from "./persistence";

const MAX_LIVES = 3;
const MAX_SLOTS = 8;
const REVEAL_MS = 1800;
const ABSENCE_GRACE_MS = 12000;
const BOMB_LOWER_MS = 7000;
const BOMB_UPPER_MS = 15000;

declare global {
  var _bombRooms: Map<string, RoomState> | undefined;
  var _bombListeners: Map<string, Set<(s: RoomState) => void>> | undefined;
  var _bombTimers: Map<string, NodeJS.Timeout> | undefined;
  var _bombPresence: Map<string, Map<string, number>> | undefined;
  var _bombAbsenceTimers: Map<string, NodeJS.Timeout> | undefined;
  var _bombFuseTimers: Map<string, NodeJS.Timeout> | undefined;
}

const rooms = global._bombRooms ?? new Map<string, RoomState>();
const listeners =
  global._bombListeners ?? new Map<string, Set<(s: RoomState) => void>>();
const timers = global._bombTimers ?? new Map<string, NodeJS.Timeout>();
const presence =
  global._bombPresence ?? new Map<string, Map<string, number>>();
const absenceTimers =
  global._bombAbsenceTimers ?? new Map<string, NodeJS.Timeout>();
const fuseTimers =
  global._bombFuseTimers ?? new Map<string, NodeJS.Timeout>();

// Pin to globalThis so server actions, route handlers, and SSE share one Map
// (Next.js prod bundles can otherwise duplicate this module per chunk).
global._bombRooms = rooms;
global._bombListeners = listeners;
global._bombTimers = timers;
global._bombPresence = presence;
global._bombAbsenceTimers = absenceTimers;
global._bombFuseTimers = fuseTimers;

function emit(code: string) {
  const state = rooms.get(code);
  if (!state) return;
  const set = listeners.get(code);
  if (!set) return;
  for (const l of set) {
    try {
      l(state);
    } catch {
      // listener error — ignore, the SSE side handles cleanup on cancel
    }
  }
}

export function subscribe(
  code: string,
  listener: (s: RoomState) => void
): () => void {
  let set = listeners.get(code);
  if (!set) {
    set = new Set();
    listeners.set(code, set);
  }
  set.add(listener);

  const state = rooms.get(code);
  if (state) {
    try {
      listener(state);
    } catch {}
  }

  return () => {
    const s = listeners.get(code);
    if (!s) return;
    s.delete(listener);
    if (s.size === 0) listeners.delete(code);
  };
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code);
}

export function markPresent(code: string, userId: string): void {
  let m = presence.get(code);
  if (!m) {
    m = new Map();
    presence.set(code, m);
  }
  m.set(userId, (m.get(userId) ?? 0) + 1);

  const key = `${code}:${userId}`;
  const t = absenceTimers.get(key);
  if (t) {
    clearTimeout(t);
    absenceTimers.delete(key);
  }
}

export function markAbsent(code: string, userId: string): void {
  const m = presence.get(code);
  if (!m) return;
  const cur = m.get(userId) ?? 0;
  if (cur > 1) {
    m.set(userId, cur - 1);
    return;
  }
  m.delete(userId);
  if (m.size === 0) presence.delete(code);

  const key = `${code}:${userId}`;
  const existing = absenceTimers.get(key);
  if (existing) clearTimeout(existing);

  const t = setTimeout(() => {
    absenceTimers.delete(key);
    const stillPresent = (presence.get(code)?.get(userId) ?? 0) > 0;
    if (stillPresent) return;
    leaveRoom(code, userId);
  }, ABSENCE_GRACE_MS);
  absenceTimers.set(key, t);
}

function clearFuse(code: string): void {
  const t = fuseTimers.get(code);
  if (t) {
    clearTimeout(t);
    fuseTimers.delete(code);
  }
}

function lightFuse(state: RoomState): void {
  clearFuse(state.code);
  const delay = BOMB_LOWER_MS + Math.random() * (BOMB_UPPER_MS - BOMB_LOWER_MS);
  state.bombExplodeAt = Date.now() + delay;
  const t = setTimeout(() => {
    fuseTimers.delete(state.code);
    triggerExplosion(state.code);
  }, delay);
  fuseTimers.set(state.code, t);
}

function triggerExplosion(code: string): void {
  const state = rooms.get(code);
  if (!state) return;
  if (state.status !== "playing") return;
  if (state.lastAnswer) return;
  if (!state.currentQuestion || !state.currentPlayerId) return;

  const userId = state.currentPlayerId;
  const q = state.currentQuestion;
  const now = Date.now();
  const solveMs =
    state.currentQuestionStartedAt != null
      ? Math.max(0, now - state.currentQuestionStartedAt)
      : 0;

  state.lastAnswer = {
    userId,
    raw: "",
    correct: false,
    cause: "explosion",
    ts: now,
  };
  state.revealUntilTs = now + REVEAL_MS;
  state.bombExplodeAt = null;
  state.history.push({
    playerId: userId,
    questionId: q.id,
    topic: q.topic,
    raw: "",
    correct: false,
    solveMs,
    ts: now,
  });

  const player = state.players.find((p) => p.userId === userId);
  if (player) {
    player.lives = Math.max(0, player.lives - 1);
    if (player.lives === 0) player.eliminated = true;
  }

  emit(code);

  const prevTimer = timers.get(code);
  if (prevTimer) clearTimeout(prevTimer);
  const t = setTimeout(() => {
    timers.delete(code);
    const cur = rooms.get(code);
    if (!cur || cur.status !== "playing") return;
    advanceTurn(cur);
    emit(code);
  }, REVEAL_MS);
  timers.set(code, t);
}

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(opts: {
  hostId: string;
  hostHandle: string;
  hostInitial: string;
  chapterId: ChapterId;
  roomType: RoomType;
}): RoomState {
  const code = generateCode();
  const host: Player = {
    userId: opts.hostId,
    handle: opts.hostHandle,
    initial: opts.hostInitial,
    lives: MAX_LIVES,
    eliminated: false,
    isHost: true,
  };
  const chapter = chapterById(opts.chapterId);
  const state: RoomState = {
    code,
    hostId: opts.hostId,
    hostHandle: opts.hostHandle,
    subject: chapter.label,
    chapterId: opts.chapterId,
    roomType: opts.roomType,
    status: "waiting",
    players: [host],
    currentPlayerId: null,
    currentQuestion: null,
    lastAnswer: null,
    winnerId: null,
    round: 0,
    maxLives: MAX_LIVES,
    maxSlots: MAX_SLOTS,
    revealUntilTs: null,
    startedAt: null,
    currentQuestionStartedAt: null,
    bombExplodeAt: null,
    history: [],
  };
  rooms.set(code, state);
  return state;
}

export function listPublicRooms(): Array<{
  code: string;
  subject: string;
  chapterId: string;
  hostHandle: string;
  status: string;
  players: number;
  maxSlots: number;
}> {
  const out: Array<{
    code: string;
    subject: string;
    chapterId: string;
    hostHandle: string;
    status: string;
    players: number;
    maxSlots: number;
  }> = [];
  for (const r of rooms.values()) {
    if (r.roomType !== "public") continue;
    if (r.status === "finished") continue;
    out.push({
      code: r.code,
      subject: r.subject,
      chapterId: r.chapterId,
      hostHandle: r.hostHandle,
      status: r.status,
      players: r.players.length,
      maxSlots: r.maxSlots,
    });
  }
  return out;
}

export function joinRoom(
  code: string,
  player: { userId: string; handle: string; initial: string }
): { state: RoomState } | { error: string } {
  const state = rooms.get(code);
  if (!state) return { error: "Room not found" };
  const existing = state.players.find((p) => p.userId === player.userId);
  if (existing) return { state };
  if (state.status !== "waiting") return { error: "Game already started" };
  if (state.players.length >= state.maxSlots) return { error: "Room full" };

  state.players.push({
    userId: player.userId,
    handle: player.handle,
    initial: player.initial,
    lives: state.maxLives,
    eliminated: false,
    isHost: false,
  });
  emit(code);
  return { state };
}

export function leaveRoom(code: string, userId: string): void {
  const state = rooms.get(code);
  if (!state) return;
  const idx = state.players.findIndex((p) => p.userId === userId);
  if (idx === -1) return;

  const wasCurrent = state.currentPlayerId === userId;
  state.players.splice(idx, 1);

  if (state.players.length === 0) {
    const t = timers.get(code);
    if (t) clearTimeout(t);
    timers.delete(code);
    clearFuse(code);
    rooms.delete(code);
    emit(code);
    return;
  }

  if (state.hostId === userId) {
    state.hostId = state.players[0].userId;
    state.players[0].isHost = true;
  }

  if (state.status === "playing" && wasCurrent) {
    advanceTurn(state);
  } else if (state.status === "playing") {
    const stillActive = state.players.filter((p) => !p.eliminated);
    if (stillActive.length <= 1) {
      state.status = "finished";
      state.winnerId = stillActive[0]?.userId ?? null;
      state.currentPlayerId = null;
      state.currentQuestion = null;
      state.currentQuestionStartedAt = null;
      state.bombExplodeAt = null;
      clearFuse(code);
      schedulePersist(state);
    }
  }

  emit(code);
}

function advanceTurn(state: RoomState): void {
  const active = state.players.filter((p) => !p.eliminated);
  if (active.length <= 1) {
    state.status = "finished";
    state.winnerId = active[0]?.userId ?? null;
    state.currentPlayerId = null;
    state.currentQuestion = null;
    state.lastAnswer = null;
    state.revealUntilTs = null;
    state.currentQuestionStartedAt = null;
    state.bombExplodeAt = null;
    clearFuse(state.code);
    schedulePersist(state);
    return;
  }

  const startIdx = state.players.findIndex(
    (p) => p.userId === state.currentPlayerId
  );
  const len = state.players.length;
  let nextIdx = startIdx;
  for (let i = 1; i <= len; i++) {
    const candidate = state.players[(startIdx + i + len) % len];
    if (!candidate.eliminated) {
      nextIdx = state.players.indexOf(candidate);
      break;
    }
  }

  state.currentPlayerId = state.players[nextIdx].userId;
  state.currentQuestion = pickRandomQuestionForChapter(
    state.chapterId,
    state.currentQuestion?.id
  );
  state.round += 1;
  state.lastAnswer = null;
  state.revealUntilTs = null;
  state.currentQuestionStartedAt = Date.now();
  lightFuse(state);
}

export function startGame(
  code: string,
  requesterId: string
): { state: RoomState } | { error: string } {
  const state = rooms.get(code);
  if (!state) return { error: "Room not found" };
  if (state.hostId !== requesterId) return { error: "Only host can start" };
  if (state.status !== "waiting") return { error: "Game already started" };
  if (state.players.length < 2) return { error: "Need at least 2 players" };

  state.status = "playing";
  state.currentPlayerId = state.players[0].userId;
  state.currentQuestion = pickRandomQuestionForChapter(state.chapterId);
  state.round = 1;
  state.lastAnswer = null;
  state.revealUntilTs = null;
  state.startedAt = Date.now();
  state.currentQuestionStartedAt = Date.now();
  state.history = [];
  state.persisted = false;
  lightFuse(state);
  emit(code);
  return { state };
}

export function submitAnswer(
  code: string,
  userId: string,
  payload: AnswerPayload
): { correct: boolean } | { error: string } {
  const state = rooms.get(code);
  if (!state) return { error: "Room not found" };
  if (state.status !== "playing") return { error: "Not playing" };
  if (state.currentPlayerId !== userId) return { error: "Not your turn" };
  if (!state.currentQuestion) return { error: "No active question" };
  if (state.lastAnswer) return { error: "Already answered" };

  const q = state.currentQuestion;
  let raw: string;
  if (payload.kind === "choice") {
    if (q.type !== "qcm" || !q.choices) return { error: "Question is not QCM" };
    if (payload.idx < 0 || payload.idx >= q.choices.length) {
      return { error: "Invalid choice" };
    }
    raw = q.choices[payload.idx];
  } else {
    if (q.type === "qcm") return { error: "Question is QCM, send a choice" };
    raw = payload.value;
  }

  const correct = isAnswerCorrect(q, raw);
  const now = Date.now();
  const solveMs =
    state.currentQuestionStartedAt != null
      ? Math.max(0, now - state.currentQuestionStartedAt)
      : 0;
  state.lastAnswer = { userId, raw, correct, cause: "answer", ts: now };
  state.revealUntilTs = now + REVEAL_MS;
  state.bombExplodeAt = null;
  clearFuse(code);
  state.history.push({
    playerId: userId,
    questionId: q.id,
    topic: q.topic,
    raw,
    correct,
    solveMs,
    ts: now,
  });

  if (!correct) {
    const player = state.players.find((p) => p.userId === userId);
    if (player) {
      player.lives = Math.max(0, player.lives - 1);
      if (player.lives === 0) player.eliminated = true;
    }
  }

  emit(code);

  // Schedule turn advance after reveal window
  const prevTimer = timers.get(code);
  if (prevTimer) clearTimeout(prevTimer);
  const t = setTimeout(() => {
    timers.delete(code);
    const cur = rooms.get(code);
    if (!cur || cur.status !== "playing") return;
    advanceTurn(cur);
    emit(code);
  }, REVEAL_MS);
  timers.set(code, t);

  return { correct };
}

export function resetRoom(
  code: string,
  requesterId: string
): { state: RoomState } | { error: string } {
  const state = rooms.get(code);
  if (!state) return { error: "Room not found" };
  if (state.hostId !== requesterId) return { error: "Only host can reset" };

  state.status = "waiting";
  state.currentPlayerId = null;
  state.currentQuestion = null;
  state.lastAnswer = null;
  state.winnerId = null;
  state.round = 0;
  state.revealUntilTs = null;
  state.startedAt = null;
  state.currentQuestionStartedAt = null;
  state.bombExplodeAt = null;
  state.history = [];
  state.persisted = false;
  clearFuse(code);
  for (const p of state.players) {
    p.lives = state.maxLives;
    p.eliminated = false;
  }
  emit(code);
  return { state };
}
