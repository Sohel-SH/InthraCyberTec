"use client";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function T({ k }: { k: string }) {
  const { t } = useLanguage();
  return <>{t(k)}</>;
}