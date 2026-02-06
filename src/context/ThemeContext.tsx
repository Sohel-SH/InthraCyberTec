"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect, useRef } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme | null;
      return saved ?? "system";
    }
    return "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const mqlRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("theme", theme);

    const root = document.documentElement;
    const applyDarkClass = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
        setResolvedTheme("dark");
      } else {
        root.classList.remove("dark");
        setResolvedTheme("light");
      }
    };

    // Clean up any previous listener
    if (mqlRef.current) {
      const prev = mqlRef.current;
      const handler = (e: MediaQueryListEvent) => {};
      // remove both possible APIs for safety
      if (typeof prev.removeEventListener === "function") {
        prev.removeEventListener("change", handler);
      } else if (typeof prev.removeListener === "function") {
        prev.removeListener(handler as any);
      }
      mqlRef.current = null;
    }

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mqlRef.current = mql;
      applyDarkClass(mql.matches);
      const onChange = (e: MediaQueryListEvent) => applyDarkClass(e.matches);
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
      } else if (typeof mql.addListener === "function") {
        mql.addListener(onChange);
      }
      return () => {
        if (typeof mql.removeEventListener === "function") {
          mql.removeEventListener("change", onChange);
        } else if (typeof mql.removeListener === "function") {
          mql.removeListener(onChange);
        }
      };
    } else {
      applyDarkClass(theme === "dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setThemePref = (next: Theme) => setTheme(next);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemePref, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
