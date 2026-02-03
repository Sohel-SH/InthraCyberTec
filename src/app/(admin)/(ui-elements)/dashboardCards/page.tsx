// // // /app/admin/(ui-elements)/ dashboardCards/page.tsx
// // import { DashboardCard as CardType } from "@/app/data/dashboard";

// // type Props = {
// //   card: CardType;
// // };

// // export default function DashboardCard({ card }: Props) {
// //   const isUp = card.trend === "up";

// //   return (
// //     <div className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm">
// //       <div>
// //         <p className="text-sm text-gray-500">{card.title}</p>

// //         <h3 className="mt-1 text-2xl font-semibold text-gray-900">
// //           {card.value}
// //         </h3>

// //         <p
// //           className={`mt-2 flex items-center gap-1 text-xs font-medium ${
// //             isUp ? "text-green-600" : "text-red-600"
// //           }`}
// //         >
// //           {isUp ? "▲" : "▼"} {card.change}%
// //           <span className="text-gray-400 font-normal">
// //             {card.changeText}
// //           </span>
// //         </p>
// //       </div>

// //       <div
// //         className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
// //       >
// //         {card.icon}
// //       </div>
// //     </div>
// //   );
// // }


// "use client";

// import { CSS } from "@dnd-kit/utilities";
// import { useSortable } from "@dnd-kit/sortable";

// import { DashboardCard as CardType } from "@/app/data/dashboard";

// type Props = {
//   card: CardType;
// };

// export default function DashboardCard({ card }: Props) {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({
//     id: card.id,
//   });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.6 : 1,
//   };

//   const isUp = card.trend === "up";
//   const Icon = card.icon;

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm cursor-grab active:cursor-grabbing"
//     >
//       <div>
//         <p className="text-sm text-gray-500">{card.title}</p>

//         <h3 className="mt-1 text-2xl font-semibold text-gray-900">
//           {card.value}
//         </h3>

//         <p
//           className={`mt-2 flex items-center gap-1 text-xs font-medium ${
//             isUp ? "text-green-600" : "text-red-600"
//           }`}
//         >
//           {isUp ? "▲" : "▼"} {card.change}%
//           <span className="text-gray-400 font-normal">
//             {card.changeText}
//           </span>
//         </p>
//       </div>

//       <div
//         className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
//       > 
//       </div>
//     </div>
//   );
// }


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
   const Icon = card.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const isUp = card.trend === "up";


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="
        rounded-2xl
        bg-white
        p-3
        shadow-sm
        cursor-grab
        active:cursor-grabbing
        hover:shadow-md
        transition
      "
    >
      {/* Top Section */}
      <div>
          <p className="text-sm text-gray-500 font-medium">
            {card.title}
          </p>
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
         
          {isUp ? <UpwordIcon className="h-9 w-8 pt-4"/> : <DownwardIcon className="h-9 w-8 pt-4"/>} {card.change}%

          <span className="ml-1  
          text-gray-500 font-normal">
            {card.changeText}
          </span>
         
        </p>
      </div>
    </div>
  );
}
