// components/LatestThreat.tsx
"use client"
import LineChart from "./lineChart";
import { latestThreatData } from "@/app/data/latestThreat";

export default function LatestThreat() {
  return (
    <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Latest Threat
        </h2>

        <select className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-500 focus:outline-none">
          <option>October</option>
          <option>September</option>
          <option>August</option>
        </select>
      </div>

      {/* Chart */}
      <LineChart data={latestThreatData.map((d) => d.value)} />

      {/* X-axis labels */}
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        {latestThreatData.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}
