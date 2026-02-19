"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import DashboardCard, {
  DashboardCardView,
} from "./(ui-elements)/dashboardCards/Card";

import { dashboardCards as initialCards } from "@/app/data/dashboard";
import LatestThreat from "./(ui-elements)/dashboardCards/latestThreatComp";

export default function DashboardClient() {
  const [cards, setCards] = useState(initialCards);
  const [activeId, setActiveId] = useState<string | number | null>(null);

  // ⭐ NEW — expanded state per card
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  const toggleExpand = (id: string | number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  }

  const activeCard = activeId
    ? cards.find((card) => card.id === activeId)
    : null;

  return (
    <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white/90">Dashboard</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={rectSortingStrategy}
        >
          {/* ⭐ IMPORTANT — grid auto rows allow expansion */}
          <div className="grid grid-cols-1 gap-6 auto-rows-[160px] sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <DashboardCard
                key={card.id}
                card={card}
                isExpanded={!!expandedCards[card.id]}
                onToggleExpand={() => toggleExpand(card.id)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCard ? <DashboardCardView card={activeCard} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <LatestThreat />
    </div>
  );
}
