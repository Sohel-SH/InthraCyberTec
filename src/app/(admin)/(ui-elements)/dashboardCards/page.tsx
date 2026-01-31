// components/DashboardCard.tsx
"use client";
import { DashboardCard as CardType } from "@/app/data/dashboard";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  card: CardType;
};

export default function DashboardCard({ card }: Props) {
  const { t } = useLanguage();
  const isUp = card.trend === "up";
  const titleTranslated =
    card.title === "Total User"
      ? t("dashboard.card.totalUser")
      : card.title === "Total History"
      ? t("dashboard.card.totalHistory")
      : card.title === "Total Research"
      ? t("dashboard.card.totalResearch")
      : card.title === "Total Users Data"
      ? t("dashboard.card.totalUsersData")
      : card.title;
  const changeTextTranslated =
    card.changeText === "Up from yesterday"
      ? t("dashboard.change.upYesterday")
      : card.changeText === "Up from past week"
      ? t("dashboard.change.upPastWeek")
      : card.changeText === "Down from yesterday"
      ? t("dashboard.change.downYesterday")
      : card.changeText;

  return (
    <div className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-gray-500">{titleTranslated}</p>

        <h3 className="mt-1 text-2xl font-semibold text-gray-900">
          {card.value}
        </h3>

        <p
          className={`mt-2 flex items-center gap-1 text-xs font-medium ${
            isUp ? "text-green-600" : "text-red-600"
          }`}
        >
          {isUp ? "▲" : "▼"} {card.change}%
          <span className="text-gray-400 font-normal">{changeTextTranslated}</span>
        </p>
      </div>

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
      >
        {card.icon}
      </div>
    </div>
  );
}
