export type YearId = "L1" | "L2" | "L3" | "M1" | "M2" | "PhD";

export type SubjectId =
  | "mental-math"
  | "algebra"
  | "linear-algebra"
  | "analysis"
  | "probability"
  | "statistics"
  | "logic"
  | "number-theory"
  | "geometry"
  | "combinatorics";

export interface OnboardingState {
  email: string;
  year: YearId | null;
  subjects: SubjectId[];
  handle: string;
  notificationsEnabled: boolean;
  school: string;
  schoolInitial: string;
}
