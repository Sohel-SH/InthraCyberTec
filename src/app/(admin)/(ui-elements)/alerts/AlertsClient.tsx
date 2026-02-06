 "use client";
 import React, { useState } from "react";
 import { CheckCircleIcon, CloseLineIcon } from "@/icons";
 
 export default function AlertsClient() {
   const [isPanelOpen, setIsPanelOpen] = useState(false);
   const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
 
   const alerts = Array.from({ length: 6 }).map(() => ({
     title: "Intel suggestion rule creation",
     desc:
       "Malesuada tellus tincidunt fringilla enim, id mauris. Id etiam nibh suscipit aliquam dolor.",
   }));
 
   const openPanel = (idx: number) => {
     setSelectedIndex(idx);
     setIsPanelOpen(true);
   };
 
   const closePanel = () => {
     setIsPanelOpen(false);
     setSelectedIndex(null);
   };
 
   return (
     <>
      <div className="space-y-5 sm:space-y-6 max-w-[560px]">
         {alerts.map((a, idx) => (
           <button
             key={idx}
             onClick={() => openPanel(idx)}
            className="w-full text-left bg-white rounded-2xl p-4 lg:p-5 transition flex items-center gap-4"
            style={{ boxShadow: "20px 20px 20px 0px #00000014" }}
           >
             <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-warning-50">
               <CheckCircleIcon className="text-warning-500" />
             </span>
             <div className="flex-1">
               <p className="font-semibold text-gray-900">{a.title}</p>
               <p className="mt-1 text-gray-500 text-sm">{a.desc}</p>
             </div>
           </button>
         ))}
       </div>
 
      <div
        className={`fixed top-25 right-0 h-[calc(100vh-6rem)] w-full max-w-[360px] lg:max-w-[420px] bg-white border-l border-gray-200 shadow-xl transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
        aria-hidden={isPanelOpen ? "false" : "true"}
        style={{borderTopLeftRadius: "10px", borderTopWidth: "1px"}}
      >
        <div className="relative h-full p-5">
           <button
             aria-label="Close"
             onClick={closePanel}
             className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
           >
             <CloseLineIcon />
           </button>
           <div className="space-y-4 mt-2">
             {alerts.slice(0, 5).map((a, i) => (
               <div key={i} className="pb-3 border-b border-gray-200 last:border-b-0">
                 <p className="text-sm text-gray-900">
                   {i + 1}. {a.title}
                 </p>
               </div>
             ))}
           </div>
         </div>
       </div>
     </>
   );
 }
