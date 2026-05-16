import mongoose, { Schema, model, models } from "mongoose";

export interface IChapterCounters {
  asked: number;
  correct: number;
  games: number;
  wins: number;
}

export interface IRecentGame {
  gameId: mongoose.Types.ObjectId;
  chapterId: string;
  result: "W" | "L";
  position: number;
  totalPlayers: number;
  finishedAt: Date;
}

export interface IUserStats {
  _id: mongoose.Types.ObjectId;
  totalGames: number;
  totalWins: number;
  totalCorrect: number;
  totalAsked: number;
  totalSolveMs: number;
  byChapter: Record<string, IChapterCounters>;
  activity: Record<string, number>;
  recentGames: IRecentGame[];
  updatedAt: Date;
}

const RecentGameSchema = new Schema<IRecentGame>(
  {
    gameId: { type: Schema.Types.ObjectId, required: true },
    chapterId: { type: String, required: true },
    result: { type: String, enum: ["W", "L"], required: true },
    position: { type: Number, required: true },
    totalPlayers: { type: Number, required: true },
    finishedAt: { type: Date, required: true },
  },
  { _id: false }
);

// We use Mixed for the keyed maps because `byChapter` and `activity` have
// dynamic keys (chapter ids and date strings). Strict-mode safety on the
// outer doc prevents arbitrary unknown top-level keys; for these inner
// objects we whitelist keys at the application layer (chapter id validated
// against CHAPTER_IDS, activity keys produced by todayKey()).
const UserStatsSchema = new Schema<IUserStats>(
  {
    _id: { type: Schema.Types.ObjectId },
    totalGames: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalAsked: { type: Number, default: 0 },
    totalSolveMs: { type: Number, default: 0 },
    byChapter: { type: Schema.Types.Mixed, default: {} },
    activity: { type: Schema.Types.Mixed, default: {} },
    recentGames: { type: [RecentGameSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { strict: true, _id: false }
);

export const UserStats =
  models.UserStats ?? model<IUserStats>("UserStats", UserStatsSchema);
