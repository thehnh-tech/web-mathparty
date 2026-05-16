export const HEATMAP_COLORS = [
  "var(--paper-2)",        // 0 — empty
  "#e8d5d4",               // 1 — very light
  "#f0a09e",               // 2 — light red
  "#E57373",               // 3 — medium red
  "var(--accent)",         // 4 — full red
];

export function formatTimeAgo(isoDate: string, now: Date = new Date()): string {
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return "—";
  const seconds = Math.max(0, Math.round((now.getTime() - t) / 1000));
  const min = Math.round(seconds / 60);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 4) return `${wk}w ago`;
  const mo = Math.round(day / 30);
  return `${mo}mo ago`;
}
