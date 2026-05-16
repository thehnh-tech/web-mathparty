import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { mongoClient } from "@/lib/db";
import { createMobileAccountSession } from "@/lib/actor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_BETA_EMAIL = "beta@mathparty.tech";

function betaEmail() {
  return (process.env.MOBILE_BETA_EMAIL || DEFAULT_BETA_EMAIL).trim().toLowerCase();
}

function dayKey(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}_${m}_${d}`;
}

async function ensureBetaUser() {
  const db = mongoClient.db("bombatique");
  const users = db.collection("user");
  const email = betaEmail();
  const now = new Date();
  const profile = {
    email,
    name: "Beta Mathparty",
    handle: "beta",
    school: "Mathparty",
    schoolInitial: "MP",
    year: "M1",
    subjects: ["mental-math", "algebra", "analysis", "probability"],
    notificationsEnabled: true,
    isGuest: false,
    onboardingComplete: true,
    emailVerified: true,
    elo: 1325,
    streak: 7,
    gamesPlayed: 18,
    gamesWon: 12,
    updatedAt: now,
  };

  const existing = await users.findOne({ email });
  let id: ObjectId;

  if (existing?._id instanceof ObjectId) {
    id = existing._id;
    await users.updateOne(
      { _id: id },
      {
        $set: profile,
        $setOnInsert: { createdAt: now },
      }
    );
  } else {
    id = new ObjectId();
    await users.insertOne({
      _id: id,
      ...profile,
      createdAt: now,
    });
  }

  await db.collection("userstats").updateOne(
    { _id: id },
    {
      $setOnInsert: {
        _id: id,
        totalGames: 18,
        totalWins: 12,
        totalCorrect: 84,
        totalAsked: 116,
        totalSolveMs: 392000,
        byChapter: {
          algebre: { asked: 38, correct: 31, games: 6, wins: 5 },
          analyse: { asked: 30, correct: 20, games: 5, wins: 3 },
          trigo_explog: { asked: 22, correct: 17, games: 3, wins: 2 },
          denombrement: { asked: 26, correct: 16, games: 4, wins: 2 },
        },
        activity: {
          [dayKey(0)]: 2,
          [dayKey(1)]: 1,
          [dayKey(3)]: 3,
          [dayKey(6)]: 2,
          [dayKey(9)]: 1,
          [dayKey(12)]: 2,
        },
        recentGames: [
          {
            gameId: new ObjectId(),
            chapterId: "algebre",
            result: "W",
            position: 1,
            totalPlayers: 4,
            finishedAt: new Date(Date.now() - 1000 * 60 * 45),
          },
          {
            gameId: new ObjectId(),
            chapterId: "analyse",
            result: "L",
            position: 2,
            totalPlayers: 5,
            finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
          },
          {
            gameId: new ObjectId(),
            chapterId: "denombrement",
            result: "W",
            position: 1,
            totalPlayers: 3,
            finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          },
        ],
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  return {
    id: String(id),
    handle: profile.handle,
    email,
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";

  if (email !== betaEmail()) {
    return NextResponse.json(
      { error: "This beta access is only available for the review email." },
      { status: 403 }
    );
  }

  try {
    const user = await ensureBetaUser();
    return NextResponse.json(createMobileAccountSession(user));
  } catch (err) {
    console.error("[mobileBetaLogin]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
