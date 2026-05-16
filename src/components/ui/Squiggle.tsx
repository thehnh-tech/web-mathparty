import React from "react";

interface SquiggleProps {
  width?: number;
  style?: React.CSSProperties;
}

export default function Squiggle({ width = 120, style }: SquiggleProps) {
  return (
    <svg
      width={width}
      height={12}
      viewBox={`0 0 ${width} 12`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", ...style }}
    >
      <path
        d={generateSquigglePath(width)}
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="240"
        style={{
          animation: "squiggle-travel 2.5s ease-in-out infinite",
        }}
      />
    </svg>
  );
}

function generateSquigglePath(width: number): string {
  const segments = Math.floor(width / 12);
  let d = `M 0 6`;
  for (let i = 0; i < segments; i++) {
    const x1 = i * 12 + 3;
    const x2 = i * 12 + 9;
    const x3 = i * 12 + 12;
    const y1 = i % 2 === 0 ? 2 : 10;
    const y2 = i % 2 === 0 ? 10 : 2;
    d += ` C ${x1} ${y1}, ${x2} ${y2}, ${x3} 6`;
  }
  return d;
}
