import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import T from "@/components/i18n/T";
import AlertsClient from "./AlertsClient";

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
  // other metadata
};

export default function Alerts() {
  return (
    <div className="relative">
      {/* <PageBreadcrumb pageTitle={<T k="nav.alerts" />} /> */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2
          className="text-3xl font-semibold text-gray-800 dark:text-white/90"
          x-text="pageName"
        >
          Alerts
        </h2>
      </div>
      <AlertsClient />
    </div>
  );
}
