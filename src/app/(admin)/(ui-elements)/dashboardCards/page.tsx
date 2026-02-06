"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { BoxIcon } from "@/icons";
import { UpwordIcon } from "@/icons";
import { DownwardIcon } from "@/icons";

import { DashboardCard as CardType } from "@/app/data/dashboard";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  card: CardType;
};

// Export the presentational component for use in DragOverlay
export function DashboardCardView({
  card,
  style,
  setNodeRef,
  attributes,
  listeners,
  isDragging,
  isOverlay,
}: {
  card: CardType;
  style?: React.CSSProperties;
  setNodeRef?: (node: HTMLElement | null) => void;
  attributes?: any;
  listeners?: any;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const Icon = card.icon;
  const isUp = card.trend === "up";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        rounded-2xl
        bg-white
        p-3
        shadow-sm
        cursor-grab
        active:cursor-grabbing
        hover:shadow-md
        transition
        ${isDragging ? "opacity-30" : "opacity-100"}
        ${isOverlay ? "shadow-xl cursor-grabbing scale-105 opacity-100" : ""}
      `}
    >
      {/* Top Section */}
      <div>
        <p className="text-sm text-gray-500 font-medium">{card.title}</p>
        <div className="flex justify-between">
          {/* Left */}

          <h3 className="mt-1 text-3xl font-bold text-gray-900">
            {card.value}
          </h3>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}
          >
            <Icon />
          </div>
        </div>

        {/* Right Icon */}
      </div>

      {/* Bottom Section */}
      <div className="mt-4 w-full">
        <p
          className={`flex items-center  text-sm font-medium ${
            isUp ? "text-green-600" : "text-red-600"
          }`}
        >
          {isUp ? (
            <UpwordIcon className="h-9 w-8 pt-4" />
          ) : (
            <DownwardIcon className="h-9 w-8 pt-4" />
          )}{" "}
          {card.change}%
          <span
            className="ml-1  
          text-gray-500 font-normal"
          >
            {card.changeText}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function DashboardCard({ card }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    // Use Translate instead of Transform for better performance
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <DashboardCardView
      card={card}
      setNodeRef={setNodeRef}
      style={style}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
}
