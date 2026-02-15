"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { DashboardCard as CardType } from "@/app/data/dashboard";
import { UpwordIcon, DownwardIcon } from "@/icons";
import { AiFillCaretDown } from 'react-icons/ai'
import { AiFillCaretUp } from 'react-icons/ai'
import { motion } from "framer-motion";

type Props = {
  card: CardType;
  isExpanded: boolean;
  onToggleExpand: () => void;
};

export function DashboardCardView({
  card,
  style,
  setNodeRef,
  attributes,
  listeners,
  isDragging,
  isOverlay,
  isExpanded,
  onToggleExpand,
}: any) {
  const Icon = card.icon;
  const isUp = card.trend === "up";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative
        rounded-2xl
        bg-white
        p-3
        shadow-sm
        cursor-grab
        hover:shadow-md
        transition
        ${isDragging ? "opacity-30" : ""}
        ${isOverlay ? "shadow-xl scale-105" : ""}
      `}
    >
      <p className="text-sm text-gray-500 font-medium">{card.title}</p>

      <div className="flex justify-between">
        <h3 className="mt-1 text-3xl font-bold text-gray-900">
          {card.value}
        </h3>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}
        >
          <Icon />
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`flex items-center text-sm font-medium ${
            isUp ? "text-green-600" : "text-red-600"
          }`}
        >
          {isUp ? <UpwordIcon /> : <DownwardIcon />}
          {card.change}%
          <span className="ml-1 text-gray-500">{card.changeText}</span>
        </p>
      </div>

      {/* ⭐ SHOW EXTRA CONTENT WHEN EXPANDED */}
      {isExpanded && (
        <div className="mt-4 h-32 rounded bg-gray-100 flex items-center justify-center">
          Chart / extra content
        </div>
      )}

      {/* ⭐ EXPAND BUTTON */}
      {!isOverlay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="absolute bottom-2 right-2 rounded bg-gray-100 p-1 hover:bg-gray-200"
        >
          {isExpanded ? <AiFillCaretUp className="h-3 w-3" /> : <AiFillCaretDown className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}

export default function DashboardCard({
  card,
  isExpanded,
  onToggleExpand,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <motion.div
      layout
      transition={{
        layout: { duration: 0.35, ease: "easeInOut" }, // 👈 smooth expand
      }}
      className={`
        ${isExpanded ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}
        h-full
        w-full
      `}
    >
      <DashboardCardView
        card={card}
        setNodeRef={setNodeRef}
        style={{ ...style, height: "100%" }} // 👈 fill container
        attributes={attributes}
        listeners={listeners}
        isDragging={isDragging}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />
    </motion.div>
  );
}