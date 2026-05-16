export type RoomFilter = "all" | "math" | "algebra" | "analysis" | "probas" | "logic";

export interface Room {
  id: string;
  subject: string;
  subjectInitial: string;
  host: string;
  school: string;
  level: string;
  slots: string;
  maxSlots: number;
  currentSlots: number;
  filter: RoomFilter;
  live?: boolean;
}

export const FILTERS: { id: RoomFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "math", label: "math" },
  { id: "algebra", label: "algebra" },
  { id: "analysis", label: "analysis" },
  { id: "probas", label: "probas" },
  { id: "logic", label: "logic" },
];

export const MOCK_ROOMS: Room[] = [
  {
    id: "1",
    subject: "Mental math",
    subjectInitial: "M",
    host: "Léa",
    school: "X",
    level: "all",
    slots: "4/8",
    maxSlots: 8,
    currentSlots: 4,
    filter: "math",
  },
  {
    id: "2",
    subject: "Linear algebra",
    subjectInitial: "L",
    host: "Tom",
    school: "ENS",
    level: "L2+",
    slots: "6/8",
    maxSlots: 8,
    currentSlots: 6,
    filter: "algebra",
  },
  {
    id: "3",
    subject: "Probability",
    subjectInitial: "P",
    host: "Mira",
    school: "X",
    level: "L3",
    slots: "8/8",
    maxSlots: 8,
    currentSlots: 8,
    filter: "probas",
    live: true,
  },
  {
    id: "4",
    subject: "Analysis",
    subjectInitial: "A",
    host: "Hugo",
    school: "Sorb.",
    level: "L1+",
    slots: "2/8",
    maxSlots: 8,
    currentSlots: 2,
    filter: "analysis",
  },
  {
    id: "5",
    subject: "Logic",
    subjectInitial: "L",
    host: "Sara",
    school: "HEC",
    level: "all",
    slots: "5/6",
    maxSlots: 6,
    currentSlots: 5,
    filter: "logic",
  },
];
