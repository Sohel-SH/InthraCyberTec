import { Metadata } from "next";
import React from "react";
import { BoxIcon, DocsIcon, HistoryIcon, ArrowRightIcon } from "@/icons";

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

export default function LLM() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold text-gray-800 dark:text-white/90">LLM</h1>

      <div
        className="relative min-h-[70vh] rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12"
        style={{ boxShadow: "20px 20px 20px 0px #00000014" }}
      >
        <div className="absolute right-6 top-6 text-sm text-gray-500 dark:text-gray-400">
          History
        </div>

        <div className="mx-auto flex max-w-[900px] flex-row items-start justify-center gap-10 px-4">
          {/* Left toolbar (compact) */}
          <div className="mt-2 flex flex-col items-center gap-4 text-gray-400">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <BoxIcon />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <DocsIcon />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <HistoryIcon />
            </span>
          </div>

          {/* Center hero */}
          <div className="flex-1">
            <div className="flex flex-col items-center text-center">
              {/* Faint shield with lock */}
              <div className="mb-6 text-gray-300">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" className="opacity-40">
                  <path d="M12 2l6 2v6c0 4.5-2.7 8.7-6 10.5C8.7 18.7 6 14.5 6 10V4l6-2z" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="9" y="11" width="6" height="5" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="12" cy="13.5" r="0.8" fill="currentColor" />
                </svg>
              </div>
              <p className="mx-auto max-w-[720px] text-lg font-semibold text-gray-700 dark:text-gray-300">
                Security is essential and Hard, We are at “&lt;Company_name&gt;”
                had made it fun for you. Lets dive to details
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-[720px]">
              <div
                className="rounded-[40px] p-[2px]"
                style={{
                  background:
                    "linear-gradient(90deg, #A7F3D0 0%, #06B6D4 100%)",
                }}
              >
                <div className="flex items-center justify-between rounded-[40px] bg-white px-7 py-4 dark:bg-gray-900">
                  <input
                    type="text"
                    placeholder="Your Message"
                    className="flex-1 bg-transparent text-gray-700 outline-none placeholder:text-gray-400 dark:text-white/90"
                  />
                  <button
                    className="ml-3 inline-flex h-11 w-11 items-center justify-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #A7F3D0 0%, #06B6D4 100%)",
                      boxShadow: "0 10px 24px #06B6D433",
                    }}
                    aria-label="Send"
                  >
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                This is a beta release. We appreciate your input as we work to make it even better.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
