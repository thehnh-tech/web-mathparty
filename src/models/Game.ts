import mongoose, { Schema, model, models } from "mongoose";

interface PlayerResult {
  userId: mongoose.Types.ObjectId;
  score: number;
  position: number;
  avgSolveMs: number;
}

export interface IGame {
  roomId: mongoose.Types.ObjectId;
  subject: string;
  players: PlayerResult[];
  status: "playing" | "finished";
  startedAt: Date;
  finishedAt?: Date;
}

const GameSchema = new Schema<IGame>(
  {
    roomId: { type: Schema.Types.ObjectId, required: true, ref: "Room" },
    subject: { type: String, required: true },
    players: [
      {
        userId: { type: Schema.Types.ObjectId, required: true },
        score: { type: Number, default: 0 },
        position: { type: Number, default: 0 },
        avgSolveMs: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ["playing", "finished"], default: "playing" },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

export const Game = models.Game ?? model<IGame>("Game", GameSchema);
