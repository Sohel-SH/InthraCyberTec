"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "en-US" | "en-GB" | "es-ES" | "fr-FR";

type Messages = Record<string, string>;

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function loadMessages(lang: Lang): Messages {
  switch (lang) {
    case "en-US":
      return require("@/i18n/en.json");
    case "en-GB":
      return require("@/i18n/en.json");
    case "es-ES":
      return require("@/i18n/es.json");
    case "fr-FR":
      return require("@/i18n/fr.json");
    default:
      return require("@/i18n/en.json");
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as Lang) || "en-US";
    }
    return "en-US";
  });

  const [messages, setMessages] = useState<Messages>(() => loadMessages(lang));

  useEffect(() => {
    setMessages(loadMessages(lang));
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang);
      document.documentElement.setAttribute("lang", lang.startsWith("en") ? "en" : lang.split("-")[0]);
    }
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = useMemo(() => {
    return (key: string) => messages[key] ?? key;
  }, [messages]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}