import mongoose from "mongoose";
import { connectMongoose } from "./mongoose";
import { mongoClient } from "./db";
import { GameResult } from "@/models/GameResult";
import { UserStats } from "@/models/UserStats";
import { isValidChapterId } from "./chapters";
import { RoomState, AnswerEvent, Player } from "./game-types";

const ELO_DELTA = 25;
const ACTIVITY_TTL_DAYS = 84;
const ALLOWED_USER_FIELDS = new Set([
  "gamesPlayed",
  "gamesWon",
  "elo",
  "streak",
]);

interface FrozenSnapshot {
  code: string;
  chapterId: string;
  startedAt: number;
  finishedAt: number;
  winnerId: string | null;
  players: Player[];
  history: AnswerEvent[];
}

function freezeForPersist(state: RoomState): FrozenSnapshot {
  return {
    code: state.code,
    chapterId: state.chapterId,
    startedAt: state.startedAt ?? Date.now(),
    finishedAt: Date.now(),
    winnerId: state.winnerId,
    players: state.players.map((p) => ({ ...p })),
    history: state.history.map((h) => ({ ...h })),
  };
}

export function schedulePersist(state: RoomState): void {
  if (state.persisted) return;
  // Refuse to persist empty / no-history "games" — prevents stat-grinding
  // by start/end loops with no real answers.
  if (state.history.length === 0) return;
  if (!isValidChapterId(state.chapterId)) return;

  state.persisted = true;
  const snapshot = freezeForPersist(state);
  setImmediate(() => {
    persistGameResult(snapshot).catch((err) => {
      console.error("[persistence] failed to persist game", err);
    });
  });
}

function todayKey(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}_${m}_${day}`;
}

function dayKeysOlderThan(activity: Record<string, number>, days: number): string[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const keys: string[] = [];
  for (const k of Object.keys(activity)) {
    const m = /^(\d{4})_(\d{2})_(\d{2})$/.exec(k);
    if (!m) {
      keys.push(k);
      continue;
    }
    const [, y, mo, d] = m;
    const t = Date.UTC(Number(y), Number(mo) - 1, Number(d));
    if (t < cutoff) keys.push(k);
  }
  return keys;
}

function toObjectId(id: string): mongoose.Types.ObjectId | null {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

async function persistGameResult(s: FrozenSnapshot): Promise<void> {
  await connectMongoose();

  // Aggregate per-player stats from history
  type PerPlayer = {
    userId: mongoose.Types.ObjectId;
    handle: string;
    asked: number;
    correct: number;
    totalSolveMs: number;
    eliminated: boolean;
    won: boolean;
    position: number;
  };

  const byUser = new Map<string, PerPlayer>();
  for (const p of s.players) {
    const oid = toObjectId(p.userId);
    if (!oid) continue;
    byUser.set(p.userId, {
      userId: oid,
      handle: p.handle,
      asked: 0,
      correct: 0,
      totalSolveMs: 0,
      eliminated: p.eliminated,
      won: p.userId === s.winnerId,
      position: 0,
    });
  }

  for (const h of s.history) {
    const acc = byUser.get(h.playerId);
    if (!acc) continue;
    acc.asked += 1;
    if (h.correct) acc.correct += 1;
    acc.totalSolveMs += h.solveMs;
  }

  // Position: winner = 1, eliminated players ranked by "asked" descending
  // (longer survival = higher rank).
  const playersArr = Array.from(byUser.values());
  playersArr.sort((a, b) => {
    if (a.won !== b.won) return a.won ? -1 : 1;
    return b.asked - a.asked;
  });
  playersArr.forEach((p, i) => {
    p.position = i + 1;
  });

  if (playersArr.length === 0) return;

  // 1) Insert GameResult
  const game = await GameResult.create({
    code: s.code,
    chapterId: s.chapterId,
    finishedAt: new Date(s.finishedAt),
    durationMs: Math.max(0, s.finishedAt - s.startedAt),
    players: playersArr.map((p) => ({
      userId: p.userId,
      handle: p.handle,
      position: p.position,
      correct: p.correct,
      asked: p.asked,
      avgSolveMs: p.asked > 0 ? Math.round(p.totalSolveMs / p.asked) : 0,
      eliminated: p.eliminated,
      won: p.won,
    })),
    history: s.history.map((h) => {
      const oid = toObjectId(h.playerId);
      return {
        userId: oid!,
        questionId: h.questionId,
        topic: h.topic,
        chapterId: s.chapterId,
        correct: h.correct,
        solveMs: h.solveMs,
      };
    }).filter((h) => h.userId != null),
  });

  // 2) UserStats upserts (one per player)
  const today = todayKey();
  const totalPlayers = playersArr.length;

  await Promise.all(
    playersArr.map(async (p) => {
      const inc: Record<string, number> = {
        totalGames: 1,
        totalWins: p.won ? 1 : 0,
        totalCorrect: p.correct,
        totalAsked: p.asked,
        totalSolveMs: p.totalSolveMs,
        [`byChapter.${s.chapterId}.asked`]: p.asked,
        [`byChapter.${s.chapterId}.correct`]: p.correct,
        [`byChapter.${s.chapterId}.games`]: 1,
        [`byChapter.${s.chapterId}.wins`]: p.won ? 1 : 0,
        [`activity.${today}`]: 1,
      };

      await UserStats.updateOne(
        { _id: p.userId },
        {
          $inc: inc,
          $push: {
            recentGames: {
              $each: [
                {
                  gameId: game._id,
                  chapterId: s.chapterId,
                  result: p.won ? "W" : "L",
                  position: p.position,
                  totalPlayers,
                  finishedAt: new Date(s.finishedAt),
                },
              ],
              $slice: -10,
            },
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );

      // Best-effort prune of activity keys older than 84 days. Cheap (small
      // map) and only runs once per user per game finish.
      const cur = await UserStats.findById(p.userId).lean();
      if (cur && cur.activity) {
        const stale = dayKeysOlderThan(cur.activity, ACTIVITY_TTL_DAYS);
        if (stale.length > 0) {
          const unset: Record<string, "" | 1> = {};
          for (const k of stale) unset[`activity.${k}`] = "";
          await UserStats.updateOne(
            { _id: p.userId },
            { $unset: unset }
          );
        }
      }
    })
  );

  // 3) Dual-write better-auth user counters (allowlist of stats fields only)
  const losers = playersArr.filter((p) => !p.won);
  const loserDelta =
    losers.length > 0 ? Math.round(ELO_DELTA / losers.length) : 0;

  const userOps = playersArr.map((p) => {
    const eloDelta = p.won ? ELO_DELTA : -loserDelta;
    const updateInc: Record<string, number> = {
      gamesPlayed: 1,
      gamesWon: p.won ? 1 : 0,
      elo: eloDelta,
      streak: p.won ? 1 : 0,
    };
    // Filter via allowlist (defense in depth — keys are static here but we
    // refuse anything outside the whitelist so future edits can't drift).
    const safe: Record<string, number> = {};
    for (const k of Object.keys(updateInc)) {
      if (ALLOWED_USER_FIELDS.has(k)) safe[k] = updateInc[k];
    }

    const op = {
      updateOne: {
        filter: { _id: p.userId },
        update: { $inc: safe },
      },
    };
    return op;
  });

  // For losers, reset streak to 0 explicitly via a second pass.
  const losersResetOps = playersArr
    .filter((p) => !p.won)
    .map((p) => ({
      updateOne: {
        filter: { _id: p.userId },
        update: { $set: { streak: 0 } },
      },
    }));

  try {
    if (userOps.length > 0) {
      await mongoClient
        .db("bombatique")
        .collection("user")
        .bulkWrite([...userOps, ...losersResetOps], { ordered: false });
    }
  } catch (err) {
    console.error("[persistence] user counters dual-write failed", err);
  }
}
