import { Metadata } from "next";
import React from "react";
import T from "@/components/i18n/T";
import QueryClient from "@/components/query/QueryClient";

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

export default function QueryPage() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          <T k="query.title" />
        </h3>
        <div className="space-y-6">
          <QueryClient />
        </div>
      </div>
    </div>
  );
}
