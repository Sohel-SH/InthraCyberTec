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
        <div className="absolute right-6 top-6 text-sm text-gray-400 dark:text-gray-500">
          History
        </div>

        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center px-4 pt-12">
          {/* Left toolbar - moved to absolute positioning */}
          <div className="absolute left-8 top-20 flex flex-col items-center gap-4 text-gray-400">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <BoxIcon />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <DocsIcon />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <HistoryIcon />
            </span>
          </div>

          {/* Center content */}
          <div className="flex w-full max-w-[600px] flex-col items-center">
            {/* Shield icon */}
            <div className="mb-8 text-gray-300 dark:text-gray-700">
              <svg width="140" height="140" viewBox="0 0 24 24" fill="none" className="opacity-30">
                <path d="M12 2l6 2v6c0 4.5-2.7 8.7-6 10.5C8.7 18.7 6 14.5 6 10V4l6-2z" stroke="currentColor" strokeWidth="1" fill="none" />
                <rect x="10" y="10" width="4" height="5" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="12" cy="9.5" r="1.2" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </div>

            {/* Heading text */}
            <p className="mb-12 text-center text-base font-normal leading-relaxed text-gray-800 dark:text-gray-300">
              Security is essential and Hard, We are at "&lt;Company_name&gt;"<br />
              had made it fun for you. Lets dive to details"
            </p>

            {/* Input field */}
            <div className="w-full">
              <div
                className="rounded-full p-[1px]"
                style={{
                  background: "linear-gradient(90deg, #A7F3D0 0%, #06B6D4 100%)",
                }}
              >
                <div className="flex items-center justify-between rounded-full bg-white px-6 py-3 dark:bg-gray-900">
                  <input
                    type="text"
                    placeholder="Your Message"
                    className="flex-1 bg-transparent text-base text-gray-700 outline-none placeholder:text-gray-400 dark:text-white/90 dark:placeholder:text-gray-500"
                  />
                  <button
                    className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #A7F3D0 0%, #06B6D4 100%)",
                      boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
                    }}
                    aria-label="Send"
                  >
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>

              {/* Beta text */}
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