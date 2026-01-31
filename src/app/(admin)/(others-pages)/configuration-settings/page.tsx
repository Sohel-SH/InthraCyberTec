"use client";
import React, { useState } from "react";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { ChevronDownIcon } from "@/icons";
import { useLanguage } from "@/context/LanguageContext";
import ThemeSegmented from "@/components/common/ThemeSegmented";

export default function ConfigurationSettings() {
  const [showCode, setShowCode] = useState(false);
  const [followSuggestions, setFollowSuggestions] = useState(true);
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white/90">{t("settings.title")}</h1>

      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {/* Theme */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.theme")}</h2>
          </div>
          <ThemeSegmented />
        </section>

        {/* Always show code when using data analyst */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.alwaysShowCode")}</h2>
          </div>
          <div className="w-28 flex justify-end">
            <Switch
              label=""
              defaultChecked={showCode}
              color="gray"
              onChange={(checked) => setShowCode(checked)}
            />
          </div>
        </section>

        {/* Show follow up suggestions in chats */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.followSuggestions")}</h2>
          </div>
          <div className="w-28 flex justify-end">
            <Switch
              label=""
              defaultChecked={followSuggestions}
              color="blue"
              onChange={(checked) => setFollowSuggestions(checked)}
            />
          </div>
        </section>

        {/* Language */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.language")}</h2>
          </div>
          <div className="relative w-48">
            <Select
              options={[
                { value: "en-US", label: t("lang.enUS") },
                { value: "en-GB", label: t("lang.enGB") },
                { value: "es-ES", label: t("lang.esES") },
                { value: "fr-FR", label: t("lang.frFR") },
              ]}
              defaultValue={lang}
              onChange={(v) => setLang(v as any)}
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </section>

        {/* Archived chats */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.archived")}</h2>
          </div>
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            {t("actions.manage")}
          </button>
        </section>

        {/* Archive all chats */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.archiveAll")}</h2>
          </div>
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            {t("actions.archiveAll")}
          </button>
        </section>

        {/* Delete all chats */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.deleteAll")}</h2>
          </div>
          <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-red-600">
            {t("actions.deleteAll")}
          </button>
        </section>

        {/* Log out on this device */}
        <section className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-white/90">{t("settings.logoutDevice")}</h2>
          </div>
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            {t("actions.logout")}
          </button>
        </section>
      </div>
    </div>
  );
}

