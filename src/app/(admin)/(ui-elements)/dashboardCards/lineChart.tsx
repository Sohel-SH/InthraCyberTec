// components/LineChart.tsx
"use client"

type Props = {
  data: number[];
};

export default function LineChart({ data }: Props) {
  const max = Math.max(...data);

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-40 w-full">
      {/* Grid */}
      {[20, 40, 60, 80].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="100"
          y2={y}
          stroke="#E5E7EB"
          strokeWidth="0.5"
        />
      ))}

      {/* Line */}
      <polyline
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}
