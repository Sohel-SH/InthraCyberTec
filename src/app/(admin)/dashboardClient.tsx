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

import DashboardCard, { DashboardCardView } from "./(ui-elements)/dashboardCards/page";
import { dashboardCards as initialCards } from "@/app/data/dashboard";
import LatestThreat from "./(ui-elements)/dashboardCards/latestThreatComp";

// ❗ metadata must be removed in client component
// Move metadata to layout.tsx if needed

export default function DashboardClient() {
  const [cards, setCards] = useState(initialCards);
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
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

  function handleDragCancel() {
    setActiveId(null);
  }

  const activeCard = activeId
    ? cards.find((card) => card.id === activeId)
    : null;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* DND Wrapper */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <DashboardCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeCard ? (
            <DashboardCardView card={activeCard} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Latest Threat */}
      <LatestThreat />
    </div>
  );
}
