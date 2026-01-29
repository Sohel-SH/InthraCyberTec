// "use client";

// import React, { useState } from "react";
// import {
//   DndContext,
//   closestCenter,
//   DragEndEvent,
// } from "@dnd-kit/core";
// import {
//   SortableContext,
//   rectSortingStrategy,
//   arrayMove,
// } from "@dnd-kit/sortable";

// import { dashboardCards as initialCards } from "@/app/data/dashboard";
// import { DashboardCard as CardType } from "@/app/data/dashboard";
// import SortableDashboardCard from "./(ui-elements)/dashboardCards/SortableDashboardCard";
// import LatestThreat from "./(ui-elements)/dashboardCards/latestThreatComp";

// export default function DashboardClient() {
//   const [cards, setCards] = useState<CardType[]>(initialCards);

//   function handleDragEnd(event: DragEndEvent) {
//     const { active, over } = event;

//     if (!over || active.id === over.id) return;

//     setCards((items) => {
//       const oldIndex = items.findIndex((i) => i.id === active.id);
//       const newIndex = items.findIndex((i) => i.id === over.id);
//       return arrayMove(items, oldIndex, newIndex);
//     });
//   }

//   return (
//     <div className="p-6">
//       <h1 className="mb-6 text-xl font-semibold text-gray-900">
//         Dashboard
//       </h1>

//       {/* DRAG & DROP */}
//       <DndContext
//         collisionDetection={closestCenter}
//         onDragEnd={handleDragEnd}
//       >
//         <SortableContext
//           items={cards.map((c) => c.id)}
//           strategy={rectSortingStrategy}
//         >
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//             {cards.map((card) => (
//               <SortableDashboardCard key={card.id} card={card} />
//             ))}
//           </div>
//         </SortableContext>
//       </DndContext>

//       <LatestThreat />
//     </div>
//   );
// }
