"use client";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

type Option = {
  key: "system" | "light" | "dark";
  label: string;
  icon: React.ReactNode;
};

const ComputerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="18" width="6" height="2" rx="1" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2.1 2.1M17.4 17.4l2.1 2.1M19.5 4.5l-2.1 2.1M6.6 17.4l-2.1 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export default function ThemeSegmented() {
  const { theme, setTheme } = useTheme();

  const options: Option[] = [
    { key: "system", label: "System", icon: <ComputerIcon /> },
    { key: "light", label: "Light", icon: <SunIcon /> },
    { key: "dark", label: "Dark", icon: <MoonIcon /> },
  ];

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.key === theme)
  );

  return (
    <div className="relative inline-flex rounded-full bg-gray-100 p-1 dark:bg-white/5">
      {/* Indicator */}
      <div
        className={
          "absolute left-1 top-1 h-8 w-8 rounded-full bg-white shadow-theme-xs transition-transform duration-200 ease-out dark:bg-white/10" +
          (activeIndex === 0
            ? " translate-x-0"
            : activeIndex === 1
            ? " translate-x-10"
            : " translate-x-20")
        }
      />
      <div className="relative grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isActive = opt.key === theme;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              aria-label={opt.label}
              className={
                "flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors dark:text-gray-300 " +
                (isActive ? "" : " hover:text-gray-900 dark:hover:text-white")
              }
            >
              {opt.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}