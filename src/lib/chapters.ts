export const CHAPTERS = [
  {
    id: "algebre",
    label: "Algebra",
    topics: [
      "equations",
      "inequalities",
      "absolute_value",
      "matrices",
      "complex_numbers",
      "arithmetic",
      "integer_part",
      "linear_algebra",
      "polynomials",
      "determinants",
    ],
  },
  {
    id: "analyse",
    label: "Analysis",
    topics: [
      "derivatives",
      "limits",
      "primitives",
      "differential_equations",
      "functions_composition",
      "inverse_functions",
      "analytic_geometry",
      "integrals",
      "functions_graphs",
      "equivalents",
      "integrals_derivatives",
    ],
  },
  {
    id: "trigo_explog",
    label: "Trig & Exp/Log",
    topics: ["trigonometry", "logarithms", "powers", "powers_roots", "exponentials_logarithms"],
  },
  {
    id: "denombrement",
    label: "Combinatorics",
    topics: ["combinatorics", "binomial_coefficients", "sums", "products", "probability"],
  },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"] | "all";
export type Chapter = (typeof CHAPTERS)[number];

export const CHAPTER_IDS: ChapterId[] = CHAPTERS.map((c) => c.id);

export function isValidChapterId(id: string): id is ChapterId {
  return id === "all" || (CHAPTER_IDS as string[]).includes(id);
}

export function chapterById(id: ChapterId): { id: string; label: string; topics: readonly string[] } {
  if (id === "all") return { id: "all", label: "All chapters", topics: [] };
  const c = CHAPTERS.find((ch) => ch.id === id);
  if (!c) throw new Error(`Unknown chapter id: ${id}`);
  return c;
}

const TOPIC_TO_CHAPTER_MAP: Record<string, ChapterId> = (() => {
  const m: Record<string, ChapterId> = {};
  for (const ch of CHAPTERS) {
    for (const t of ch.topics) m[t] = ch.id;
  }
  return m;
})();

export function chapterOfTopic(topic: string): ChapterId | null {
  return TOPIC_TO_CHAPTER_MAP[topic] ?? null;
}

export function humanizeTopic(topic: string): string {
  return topic.replace(/_/g, " ");
}
