// ---dashboard
import type { Metadata } from "next"; import React from "react";
 import DashboardCard from "./(ui-elements)/dashboardCards/page"; 
 import {dashboardCards} from "@/app/data/dashboard";
 import LatestThreat from "./(ui-elements)/dashboardCards/latestThreatComp";



export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};


// export default function Ecommerce() {
//   return (
//     <div className="grid grid-cols-12 gap-4 md:gap-6">
//       <div className="col-span-12 space-y-6 xl:col-span-7">
//        efrhtyh
//       </div>

//       <div className="col-span-12 xl:col-span-5">
 
//       </div>

//       <div className="col-span-12">

//       </div>

//       <div className="col-span-12 xl:col-span-5">
    
//       </div>

//       <div className="col-span-12 xl:col-span-7">
       
//       </div>
//     </div>
//   );
// }


export default function Ecommerce() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        Dashboard
      </h1>
  {/* Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <DashboardCard key={card.id} card={card} />
        ))}
      </div>

       {/* Latest Threat */}
      <LatestThreat />
    </div>
  );
}