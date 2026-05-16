import mongoose, { Schema, model, models } from "mongoose";

export interface IRoom {
  code: string;
  subject: string;
  chapterId: string;
  hostId: mongoose.Types.ObjectId;
  type: "public" | "private";
  level: "all" | "L1+" | "L2+" | "L3";
  maxSlots: number;
  players: mongoose.Types.ObjectId[];
  status: "waiting" | "playing" | "finished";
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, length: 6 },
    subject: { type: String, required: true },
    chapterId: { type: String, required: true },
    hostId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    level: { type: String, enum: ["all", "L1+", "L2+", "L3"], default: "all" },
    maxSlots: { type: Number, default: 8 },
    players: [{ type: Schema.Types.ObjectId }],
    status: { type: String, enum: ["waiting", "playing", "finished"], default: "waiting" },
  },
  { timestamps: true }
);

export const Room = models.Room ?? model<IRoom>("Room", RoomSchema);
