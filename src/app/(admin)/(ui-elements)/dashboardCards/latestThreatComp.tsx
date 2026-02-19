// components/LatestThreat.tsx
"use client"
import LineChart from "./lineChart";
import { latestThreatData } from "@/app/data/latestThreat";
import { useLanguage } from "@/context/LanguageContext";

export default function LatestThreat() {
  const { t } = useLanguage();
  return (
    <div className="mt-8 rounded-xl bg-white dark:bg-white/[0.03] p-6 shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
          {t("dashboard.latestThreat")}
        </h2>

        <select className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] px-3 py-1 text-sm text-gray-500 dark:text-gray-400 focus:outline-none">
          <option>{t("months.october")}</option>
          <option>{t("months.september")}</option>
          <option>{t("months.august")}</option>
        </select>
      </div>

      {/* Chart */}
      <LineChart data={latestThreatData.map((d) => d.value)} />

      {/* X-axis labels */}
      <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-gray-500">
        {latestThreatData.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}
