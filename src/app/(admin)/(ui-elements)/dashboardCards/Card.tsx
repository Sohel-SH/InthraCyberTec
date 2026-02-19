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
          dark:bg-white/[0.03]
          p-3
          shadow-sm
          cursor-grab
          hover:shadow-md
          transition
          ${isDragging ? "opacity-30" : ""}
          ${isOverlay ? "shadow-xl scale-105" : ""}
        `}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.title}</p>

      <div className="flex justify-between">
        <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white/90">
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
            isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {isUp ? <UpwordIcon /> : <DownwardIcon />}
          {card.change}%
          <span className="ml-1 text-gray-500 dark:text-gray-400">{card.changeText}</span>
        </p>
      </div>

      {/* ⭐ SHOW EXTRA CONTENT WHEN EXPANDED */}
      {isExpanded && (
        <div className="mt-4 h-32 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
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
          className="absolute bottom-2 right-2 rounded bg-gray-100 dark:bg-gray-700 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-colors"
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
