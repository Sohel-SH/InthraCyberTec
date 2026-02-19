"use client";

import type React from "react";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// On the server, useLayoutEffect causes a warning and is a no-op anyway.
// So we fall back to useEffect on the server, and use useLayoutEffect on the client.
// This means on the client the localStorage restore runs synchronously before
// the browser paints — eliminating the flash of "System" selected.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Always start with "system" to match SSR.
  // The real saved value is restored from localStorage in the layout effect below.
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const mqlRef = useRef<MediaQueryList | null>(null);
  const onChangeRef = useRef<((e: MediaQueryListEvent) => void) | null>(null);

  // ── Step 1: Restore saved theme from localStorage BEFORE the browser paints.
  //    useLayoutEffect fires synchronously after DOM mutations but before paint,
  //    so the segmented control will never visually flash "System".
  useIsomorphicLayoutEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      setThemeState(saved);
    }
  }, []); // runs once on mount

  // ── Step 2: Whenever theme changes, apply/remove the "dark" class on <html>
  //    and manage the system media-query listener.
  useEffect(() => {
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

    // Remove any previously registered media-query listener
    if (mqlRef.current && onChangeRef.current) {
      const prev = mqlRef.current;
      const prevHandler = onChangeRef.current;
      if (typeof prev.removeEventListener === "function") {
        prev.removeEventListener("change", prevHandler);
      } else if (typeof (prev as any).removeListener === "function") {
        (prev as any).removeListener(prevHandler);
      }
      mqlRef.current = null;
      onChangeRef.current = null;
    }

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (e: MediaQueryListEvent) => applyDarkClass(e.matches);

      mqlRef.current = mql;
      onChangeRef.current = onChange;

      applyDarkClass(mql.matches);

      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
      } else if (typeof (mql as any).addListener === "function") {
        (mql as any).addListener(onChange);
      }

      return () => {
        if (typeof mql.removeEventListener === "function") {
          mql.removeEventListener("change", onChange);
        } else if (typeof (mql as any).removeListener === "function") {
          (mql as any).removeListener(onChange);
        }
        mqlRef.current = null;
        onChangeRef.current = null;
      };
    } else {
      applyDarkClass(theme === "dark");
    }
  }, [theme]);

  // ── setTheme: update React state AND persist to localStorage.
  //    localStorage is ONLY written here (explicit user action), never on mount,
  //    so a reload never overwrites the saved preference.
  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("theme", next);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
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
