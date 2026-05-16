import "server-only";
import { connectMongoose } from "./mongoose";
import { UserStats, IUserStats, IRecentGame } from "@/models/UserStats";
import { CHAPTERS, ChapterId } from "./chapters";

export interface ProfileChapterScore {
  id: ChapterId;
  label: string;
  score: number;
  asked: number;
}

export interface ProfileRecentGame {
  gameId: string;
  chapterId: string;
  chapterLabel: string;
  result: "W" | "L";
  position: number;
  totalPlayers: number;
  finishedAt: string;
}

export interface ProfileData {
  cards: {
    games: number;
    winRate: number;
    avgSolveSeconds: number | null;
  };
  chapters: ProfileChapterScore[];
  // 7 days × N weeks, level 0–4 per cell, ordered oldest → newest column.
  heatmap: number[];
  heatmapWeeks: number;
  recentGames: ProfileRecentGame[];
}

const HEATMAP_WEEKS = 12;

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}_${m}_${day}`;
}

function levelFromCount(c: number): number {
  if (c <= 0) return 0;
  if (c === 1) return 1;
  if (c <= 3) return 2;
  if (c <= 6) return 3;
  return 4;
}

function buildHeatmap(activity: Record<string, number> | undefined): number[] {
  const cells: number[] = [];
  const today = todayUTC();
  // Anchor so today is the bottom-right cell of the rightmost column.
  const todayDow = today.getUTCDay(); // 0=Sun..6=Sat
  // We render rows = day of week 0..6 (Sun..Sat) × cols = HEATMAP_WEEKS.
  // Last column ends at today; first column starts (HEATMAP_WEEKS-1)*7 + todayDow days ago.
  const totalDays = HEATMAP_WEEKS * 7;
  const startOffsetDays = totalDays - 1 - todayDow; // days before today
  // We'll generate 7 rows × 12 cols laid out row-major like the existing UI:
  // grid is rows=days(0..6), cols=weeks(0..11); UI iterates day×week.
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < HEATMAP_WEEKS; col++) {
      const offset = startOffsetDays - (col * 7 + row);
      // offset = days before today; if negative, future date — empty.
      const cellDate = new Date(today);
      cellDate.setUTCDate(today.getUTCDate() - offset);
      if (offset < 0) {
        cells.push(0);
        continue;
      }
      const k = dateKey(cellDate);
      const count = activity?.[k] ?? 0;
      cells.push(levelFromCount(count));
    }
  }
  return cells;
}

function chapterLabel(id: string): string {
  const c = CHAPTERS.find((ch) => ch.id === id);
  return c ? c.label : id;
}

export async function getProfileData(userId: string): Promise<ProfileData> {
  await connectMongoose();
  const stats = (await UserStats.findById(userId).lean()) as IUserStats | null;

  const totals = {
    games: stats?.totalGames ?? 0,
    wins: stats?.totalWins ?? 0,
    correct: stats?.totalCorrect ?? 0,
    asked: stats?.totalAsked ?? 0,
    solveMs: stats?.totalSolveMs ?? 0,
  };

  const winRate =
    totals.games > 0 ? Math.round((totals.wins / totals.games) * 100) : 0;
  const avgSolveSeconds =
    totals.asked > 0
      ? Math.round((totals.solveMs / totals.asked) / 100) / 10 // 1 decimal
      : null;

  const byChapter = stats?.byChapter ?? {};
  const chapters: ProfileChapterScore[] = CHAPTERS.map((c) => {
    const row = byChapter[c.id] ?? { asked: 0, correct: 0 };
    const score =
      row.asked > 0 ? Math.round((row.correct / row.asked) * 100) : 0;
    return { id: c.id, label: c.label, score, asked: row.asked };
  });

  const heatmap = buildHeatmap(stats?.activity);

  const recentRaw = (stats?.recentGames ?? []) as IRecentGame[];
  const recentGames: ProfileRecentGame[] = recentRaw
    .slice()
    .reverse()
    .map((g) => ({
      gameId: String(g.gameId),
      chapterId: g.chapterId,
      chapterLabel: chapterLabel(g.chapterId),
      result: g.result,
      position: g.position,
      totalPlayers: g.totalPlayers,
      finishedAt: new Date(g.finishedAt).toISOString(),
    }));

  return {
    cards: { games: totals.games, winRate, avgSolveSeconds },
    chapters,
    heatmap,
    heatmapWeeks: HEATMAP_WEEKS,
    recentGames,
  };
}
