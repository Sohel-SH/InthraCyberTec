// components/DashboardCard.tsx
import { DashboardCard as CardType } from "@/app/data/dashboard";

type Props = {
  card: CardType;
};

export default function DashboardCard({ card }: Props) {
  const isUp = card.trend === "up";

  return (
    <div className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-gray-500">{card.title}</p>

        <h3 className="mt-1 text-2xl font-semibold text-gray-900">
          {card.value}
        </h3>

        <p
          className={`mt-2 flex items-center gap-1 text-xs font-medium ${
            isUp ? "text-green-600" : "text-red-600"
          }`}
        >
          {isUp ? "▲" : "▼"} {card.change}%
          <span className="text-gray-400 font-normal">
            {card.changeText}
          </span>
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
