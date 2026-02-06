// ---dashboard
import type { Metadata } from "next"; import React from "react";
import DashboardClient from "./dashboardClient";



export const metadata: Metadata = {
  title: {
    default: 'Inthra - Advanced Insider Threat Detection and Monitoring',
    template: '%s | Inthra'
  },
  description: 'Inthra offers an advanced platform for comprehensive insider threat detection and monitoring. Leveraging cutting-edge Graph Analytics and custom rules, Inthra provides real-time security insights to protect your organization from internal risks and data breaches. Stay ahead of threats with intelligent anomaly detection and proactive risk management.',
  keywords: ['insider threat detection', 'security', 'AI', 'Graph Analytics', 'threat monitoring', 'cybersecurity', 'insider risk management', 'advanced threat detection', 'threat intelligence', 'risk assessment', 'data protection', 'fraud detection', 'anomaly detection', 'security analytics', 'threat prevention', 'compliance monitoring'],
  authors: [{ name: 'Inthra Team' }],
  creator: 'Inthra',
  publisher: 'Inthra',
};


export default function Ecommerce() {
  return (
    <div>
      
      <DashboardClient />
  {/* Cards */}

    </div>
  );
}

// "use client";

// import { useState } from "react";


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

// import DashboardCard from "./(ui-elements)/dashboardCards/page";
// import { dashboardCards as initialCards } from "@/app/data/dashboard";
// import LatestThreat from "./(ui-elements)/dashboardCards/latestThreatComp";

// // ❗ metadata must be removed in client component
// // Move metadata to layout.tsx if needed

// export default function Ecommerce() {
//   const [cards, setCards] = useState(initialCards);

//   function handleDragEnd(event: DragEndEvent) {
//     const { active, over } = event;

//     if (!over || active.id === over.id) return;

//     setCards((items) => {
//       const oldIndex = items.findIndex(
//         (item) => item.id === active.id
//       );

//       const newIndex = items.findIndex(
//         (item) => item.id === over.id
//       );

//       return arrayMove(items, oldIndex, newIndex);
//     });
//   }

//   return (
//     <div className="p-6">
//       <h1 className="mb-6 text-xl font-semibold text-gray-900">
//         Dashboard
//       </h1>

//       {/* DND Wrapper */}
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
//               <DashboardCard
//                 key={card.id}
//                 card={card}
//               />
//             ))}
//           </div>
//         </SortableContext>
//       </DndContext>

//       {/* Latest Threat */}
//       <LatestThreat />
//     </div>
//   );
// }
