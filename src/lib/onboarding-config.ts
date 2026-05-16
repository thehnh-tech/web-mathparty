import { YearId, SubjectId } from "@/types/onboarding";

export const TOTAL_STEPS = 5;

export const YEARS: YearId[] = ["L1", "L2", "L3", "M1", "M2", "PhD"];

export const SUBJECTS: { id: SubjectId; label: string }[] = [
  { id: "mental-math", label: "Mental math" },
  { id: "algebra", label: "Algebra" },
  { id: "linear-algebra", label: "Linear algebra" },
  { id: "analysis", label: "Analysis" },
  { id: "probability", label: "Probability" },
  { id: "statistics", label: "Statistics" },
  { id: "logic", label: "Logic" },
  { id: "number-theory", label: "Number theory" },
  { id: "geometry", label: "Geometry" },
  { id: "combinatorics", label: "Combinatorics" },
];

export const LEADERBOARD = [
  { rank: 1, name: "Polytechnique", initial: "X", points: 1240, mine: true },
  { rank: 2, name: "ENS Paris", initial: "E", points: 980, mine: false },
  { rank: 3, name: "Centrale", initial: "C", points: 870, mine: false },
];
