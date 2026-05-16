import mongoose, { Schema, model, models } from "mongoose";

export interface IGameResultPlayer {
  userId: mongoose.Types.ObjectId;
  handle: string;
  position: number;
  correct: number;
  asked: number;
  avgSolveMs: number;
  eliminated: boolean;
  won: boolean;
}

export interface IGameResultHistoryEntry {
  userId: mongoose.Types.ObjectId;
  questionId: number;
  topic: string;
  chapterId: string;
  correct: boolean;
  solveMs: number;
}

export interface IGameResult {
  code: string;
  chapterId: string;
  finishedAt: Date;
  durationMs: number;
  players: IGameResultPlayer[];
  history: IGameResultHistoryEntry[];
}

const PlayerSchema = new Schema<IGameResultPlayer>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    handle: { type: String, required: true },
    position: { type: Number, required: true },
    correct: { type: Number, default: 0 },
    asked: { type: Number, default: 0 },
    avgSolveMs: { type: Number, default: 0 },
    eliminated: { type: Boolean, default: false },
    won: { type: Boolean, default: false },
  },
  { _id: false }
);

const HistorySchema = new Schema<IGameResultHistoryEntry>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    questionId: { type: Number, required: true },
    topic: { type: String, required: true },
    chapterId: { type: String, required: true },
    correct: { type: Boolean, required: true },
    solveMs: { type: Number, required: true },
  },
  { _id: false }
);

const GameResultSchema = new Schema<IGameResult>(
  {
    code: { type: String, required: true, uppercase: true },
    chapterId: { type: String, required: true },
    finishedAt: { type: Date, required: true, default: Date.now },
    durationMs: { type: Number, required: true, default: 0 },
    players: { type: [PlayerSchema], required: true },
    history: { type: [HistorySchema], required: true, default: [] },
  },
  { timestamps: true, strict: true }
);

GameResultSchema.index({ "players.userId": 1, finishedAt: -1 });
GameResultSchema.index({ chapterId: 1, finishedAt: -1 });

export const GameResult =
  models.GameResult ?? model<IGameResult>("GameResult", GameResultSchema);
