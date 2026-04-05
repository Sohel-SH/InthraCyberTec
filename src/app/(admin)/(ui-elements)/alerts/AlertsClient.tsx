"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertIcon, CloseLineIcon } from "@/icons";
import { savedQueriesService, type SavedQuery } from "@/services/savedQueriesService";

// ── Types ─────────────────────────────────────────────────────
type MainTab = "alerts" | "custom-queries";
type AlertSeverity = "low" | "mid" | "high";
type AlertFilter = "all" | AlertSeverity;

// ── Mock alert data ───────────────────────────────────────────
const SEVERITIES: AlertSeverity[] = ["low", "mid", "high", "low", "mid", "high"];

const MOCK_ALERTS = Array.from({ length: 6 }).map((_, i) => ({
  title: `Intel suggestion rule creation ${i + 1}`,
  desc: "Malesuada tellus tincidunt fringilla enim, id mauris. Id etiam nibh suscipit aliquam dolor.",
  severity: SEVERITIES[i % SEVERITIES.length],
}));

// ── Helpers ───────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function severityDot(s: AlertSeverity) {
  const cls =
    s === "low" ? "bg-green-500" : s === "mid" ? "bg-yellow-500" : "bg-red-500";
  return <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${cls}`} aria-hidden />;
}

function LanguageBadge({ lang }: { lang: "sql" | "pyspark" }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        lang === "sql"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      }`}
    >
      {lang}
    </span>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────
function DeleteConfirmDialog({
  query,
  onConfirm,
  onCancel,
}: {
  query: SavedQuery;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="max-w-64 relative rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Delete Query</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
          </div>
        </div>
        <p className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Delete <span className="font-semibold">&ldquo;{query.name}&rdquo;</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Query Detail Drawer ───────────────────────────────────────
function QueryDetailDrawer({
  query,
  onClose,
  onDelete,
  onOpenInEditor,
}: {
  query: SavedQuery;
  onClose: () => void;
  onDelete: (q: SavedQuery) => void;
  onOpenInEditor: (q: SavedQuery) => void;
}) {
  return (
    <div
      className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full max-w-[400px] lg:max-w-[460px] border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 transition-transform duration-300 ease-in-out z-40 overflow-y-auto"
      style={{ borderTopLeftRadius: "12px" }}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <LanguageBadge lang={query.language} />
          <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
            {query.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <CloseLineIcon />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Created</p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {formatDate(query.createdAt)}
            </p>
          </div>
          {query.updatedAt && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Last Updated</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatDate(query.updatedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {query.description && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Description
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{query.description}</p>
          </div>
        )}

        {/* Query code */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Query
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-950 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-3 py-1.5">
              <LanguageBadge lang={query.language} />
              <span className="text-[10px] text-gray-500">
                {query.query.split("\n").length} line{query.query.split("\n").length !== 1 ? "s" : ""}
              </span>
            </div>
            <pre className="max-h-64 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-gray-200 whitespace-pre-wrap break-words">
              {query.query}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => onOpenInEditor(query)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Query Editor
          </button>
          <button
            onClick={() => onDelete(query)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Query
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom Queries Tab Content ────────────────────────────────
function CustomQueriesTab() {
  const router = useRouter();
  const [queries, setQueries] = useState<SavedQuery[]>(() => savedQueriesService.getAll());
  const [searchTerm, setSearchTerm] = useState("");
  const [langFilter, setLangFilter] = useState<"all" | "sql" | "pyspark">("all");
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);
  const [queryToDelete, setQueryToDelete] = useState<SavedQuery | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Refresh queries list from the service (called after mutations)
  const refreshQueries = () => setQueries(savedQueriesService.getAll());


  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleDelete = useCallback((q: SavedQuery) => {
    setQueryToDelete(q);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!queryToDelete) return;
    savedQueriesService.remove(queryToDelete.id);
    if (selectedQuery?.id === queryToDelete.id) setSelectedQuery(null);
    setQueryToDelete(null);
    setToast(`Query "${queryToDelete.name}" deleted.`);
    refreshQueries();
  }, [queryToDelete, selectedQuery]);

  const handleOpenInEditor = useCallback(
    (q: SavedQuery) => {
      savedQueriesService.setPendingLoad(q);
      router.push("/query");
    },
    [router]
  );

  // Filtered & searched list
  const displayed = queries.filter((q) => {
    const matchesLang = langFilter === "all" || q.language === langFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      q.name.toLowerCase().includes(term) ||
      (q.description ?? "").toLowerCase().includes(term) ||
      q.query.toLowerCase().includes(term);
    return matchesLang && matchesSearch;
  });

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        {/* Language filter */}
        <div className="flex items-center gap-1.5">
          {(["all", "sql", "pyspark"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setLangFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                langFilter === f
                  ? f === "all"
                    ? "bg-indigo-600 text-white"
                    : f === "sql"
                    ? "bg-blue-600 text-white"
                    : "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              {f === "all" ? "All" : f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Count badge */}
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {displayed.length} {displayed.length === 1 ? "query" : "queries"}
        </span>
      </div>

      {/* Empty state */}
      {queries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
            No saved queries yet
          </h3>
          <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Head over to the{" "}
            <button
              onClick={() => router.push("/query")}
              className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
            >
              Query Editor
            </button>
            , write a query, and click{" "}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Save Query</span>{" "}
            to store it here.
          </p>
        </div>
      )}

      {/* No search results */}
      {queries.length > 0 && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No queries match <span className="font-medium">&ldquo;{searchTerm}&rdquo;</span>
          </p>
          <button
            onClick={() => { setSearchTerm(""); setLangFilter("all"); }}
            className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Query cards grid */}
      {displayed.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayed.map((q) => (
            <div
              key={q.id}
              onClick={() => setSelectedQuery(q)}
              className={`group relative flex cursor-pointer flex-col rounded-2xl border bg-white p-4 transition-all hover:shadow-md dark:bg-white/[0.03] ${
                selectedQuery?.id === q.id
                  ? "border-blue-500 shadow-md ring-1 ring-blue-500/30 dark:border-blue-500"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
              style={{ boxShadow: selectedQuery?.id === q.id ? undefined : "0 2px 8px 0 #00000010" }}
            >
              {/* Card header */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <LanguageBadge lang={q.language} />
                  <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white/90">
                    {q.name}
                  </h4>
                </div>
                {/* Quick-delete button (top-right on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(q);
                  }}
                  title="Delete query"
                  className="flex-shrink-0 rounded-lg p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              {q.description && (
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {q.description}
                </p>
              )}

              {/* Query preview */}
              <div className="mb-3 flex-1 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-800">
                <pre className="overflow-hidden font-mono text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap break-words">
                  {q.query}
                </pre>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {formatDate(q.createdAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenInEditor(q);
                  }}
                  title="Open in Query Editor"
                  className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selectedQuery && (
        <QueryDetailDrawer
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
          onDelete={handleDelete}
          onOpenInEditor={handleOpenInEditor}
        />
      )}

      {/* Delete confirmation */}
      {queryToDelete && (
        <DeleteConfirmDialog
          query={queryToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setQueryToDelete(null)}
        />
      )}
    </>
  );
}

// ── Main AlertsClient Component ───────────────────────────────
export default function AlertsClient() {
  const [mainTab, setMainTab] = useState<MainTab>("alerts");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<AlertFilter>("all");

  const openPanel = (idx: number) => {
    setSelectedIndex(idx);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedIndex(null);
  };

  const filteredAlerts = MOCK_ALERTS.filter(
    (a) => filter === "all" || a.severity === filter
  );

  return (
    <>
      {/* ── Main Tab Bar ── */}
      <div className="mb-6 flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setMainTab("alerts")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            mainTab === "alerts"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Alerts
          <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {MOCK_ALERTS.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab("custom-queries")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            mainTab === "custom-queries"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Custom Queries
        </button>
      </div>

      {/* ── Alerts Tab ── */}
      {mainTab === "alerts" && (
        <div className="max-w-[560px]">
          {/* Severity filter */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {(["all", "low", "mid", "high"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filter === f
                    ? f === "all"
                      ? "bg-indigo-600 text-white"
                      : f === "low"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                      : f === "mid"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-5 sm:space-y-6">
            {filteredAlerts.map((a, idx) => (
              <button
                key={idx}
                onClick={() => openPanel(idx)}
                className="w-full text-left bg-white dark:bg-white/[0.03] rounded-2xl p-4 lg:p-5 transition flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                style={{ boxShadow: "20px 20px 20px 0px #00000014" }}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10">
                  <AlertIcon className="text-warning-500" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white/90">{a.title}</p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">{a.desc}</p>
                </div>
                <div className="ml-2 flex items-center gap-2">
                  {severityDot(a.severity)}
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{a.severity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom Queries Tab ── */}
      {mainTab === "custom-queries" && <CustomQueriesTab />}

      {/* ── Alert detail slide-in panel ── */}
      <div
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-full max-w-[360px] lg:max-w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl transition-transform duration-300 ease-in-out z-40 ${
          isPanelOpen && mainTab === "alerts"
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-full pointer-events-none"
        }`}
        aria-hidden={isPanelOpen && mainTab === "alerts" ? "false" : "true"}
        style={{ borderTopLeftRadius: "10px" }}
      >
        <div className="relative h-full p-5 overflow-y-auto">
          <button
            aria-label="Close"
            onClick={closePanel}
            className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <CloseLineIcon />
          </button>
          {selectedIndex !== null && (
            <div className="space-y-4 mt-2">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
                  {MOCK_ALERTS[selectedIndex]?.title}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {severityDot(MOCK_ALERTS[selectedIndex]?.severity)}
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {MOCK_ALERTS[selectedIndex]?.severity}
                  </span>
                </div>
              </div>
              {MOCK_ALERTS.slice(0, 5).map((a, i) => (
                <div
                  key={i}
                  className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <p className="text-sm text-gray-900 dark:text-white/90">
                    {i + 1}. {a.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
