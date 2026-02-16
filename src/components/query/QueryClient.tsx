"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { API_CONFIG } from "@/config/api";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
      <span className="text-gray-500">Loading editor...</span>
    </div>
  ),
});

interface QueryResult {
  success: boolean;
  data?: any[];  // Just raw data from API
  error?: string;
  execution_time?: number;
  row_count?: number;
}

type QueryLanguage = "pyspark" | "sql";

export default function QueryClient() {
  const [queryInput, setQueryInput] = useState("");
  const [language, setLanguage] = useState<QueryLanguage>("pyspark");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<"logs" | "raw" | "table">("logs");
  const { t } = useLanguage();
  const editorRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();

  // Sample starter queries
  const sampleQueries = {
    pyspark: `# PySpark Query Example
df = spark.read.table("security_events")
df.filter(df.severity == "Critical").show()`,
    sql: `-- SQL Query Example
SELECT * FROM security_events 
WHERE severity = 'Critical' 
ORDER BY timestamp DESC 
LIMIT 100`,
  };

  // keep editor readOnly in sync when isRunning changes
  useEffect(() => {
    if (editorRef.current && typeof editorRef.current.updateOptions === "function") {
      try {
        editorRef.current.updateOptions({ readOnly: isRunning });
      } catch (e) {
        // ignore
      }
    }
  }, [isRunning]);

  // Load query from history
  const loadFromHistory = useCallback(
    (direction: "up" | "down") => {
      if (executionHistory.length === 0) return;

      let newIndex = historyIndex;
      if (direction === "up") {
        newIndex = Math.min(historyIndex + 1, executionHistory.length - 1);
      } else {
        newIndex = Math.max(historyIndex - 1, -1);
      }

      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        setQueryInput(executionHistory[newIndex]);
      } else {
        setQueryInput("");
      }
    },
    [executionHistory, historyIndex]
  );

  const handleRun = useCallback(async () => {
    if (!queryInput.trim()) {
      alert("Please enter a query");
      return;
    }

    setIsRunning(true);
    setResult(null);
    setError(null);

    // Add to history
    setExecutionHistory((prev) => [queryInput, ...prev.slice(0, 49)]); // Keep last 50
    setHistoryIndex(-1);

    const startTime = performance.now();

    // 🔥 TOGGLE THIS FLAG FOR LOCAL TESTING
    const USE_DUMMY_DATA = false; // Set to false to use real API

    try {
      let data: any;

      if (USE_DUMMY_DATA) {
        // ============================================================
        // DUMMY DATA FOR LOCAL TESTING
        // ============================================================
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate dummy security events
        data = [
          {
            id: 1,
            timestamp: "2024-02-14T10:08:01Z",
            user: "alice@contoso.com",
            action: "DLP rule matched",
            policy: "Financial Data Protection",
            rule: "Block External Email with Financial Data",
            sensitiveInfoType: "Credit Card Number",
            messageSubject: "Quarterly Financial Report",
            recipients: ["bob@external.com"],
            attachment: "report.docx",
            actionTaken: "Blocked",
            override: "",
            location: "Exchange Online",
            severity: "High",
            source: "Purview DLP",
            source1: "Purview DLP",
            source2: "Purview DLP",
            source3: "Purview DLP",
            source4: "Purview DLP",
            source5: "Purview DLP",
            source6: "Purview DLP",
            source7: "Purview DLP",
            source8: "Purview DLP"
          },
          {
            id: 2,
            timestamp: "2024-02-14T10:10:22Z",
            user: "john.doe@contoso.com",
            action: "Login",
            source_ip: "192.168.1.100",
            device: "LAPTOP-ABC123",
            location: "Office Building A",
            status: "Success",
            mfa_used: true,
            risk_score: 15,
            source: "UEBA",
            source1: "UEBA",
            source2: "UEBA",
            source3: "UEBA",
            source4: "UEBA",
            source5: "UEBA",
            source6: "UEBA",
            source7: "UEBA",
            source8: "UEBA"
          },
          {
            id: 3,
            timestamp: "2024-02-14T10:15:45Z",
            user: "jane.smith@contoso.com",
            url: "https://malicious-site.com/payload",
            action: "Blocked",
            urlcategory: "Malware",
            bytes_in: 1024,
            bytes_out: 2048,
            duration_ms: 150,
            threat_name: "Trojan.Generic",
            severity: "Critical",
            source: "Zscaler",
            source1: "Zscaler",
            source2: "Zscaler",
            source3: "Zscaler",
            source4: "Zscaler",
            source5: "Zscaler",
            source6: "Zscaler",
            source7: "Zscaler",
            source8: "Zscaler"
          },
          {
            id: 4,
            timestamp: "2024-02-14T10:20:12Z",
            user: "bob.jones@contoso.com",
            badge_id: "BADGE-1001",
            door_name: "Server Room 1",
            access_granted: false,
            reason: "Insufficient Permissions",
            employee_name: "Bob Jones",
            department: "IT",
            severity: "Medium",
            source: "Physical Security",
            source1: "Physical Security",
            source2: "Physical Security",
            source3: "Physical Security",
            source4: "Physical Security",
            source5: "Physical Security",
            source6: "Physical Security",
            source7: "Physical Security",
            source8: "Physical Security"
          },
          {
            id: 5,
            timestamp: "2024-02-14T10:25:33Z",
            user: "charlie@contoso.com",
            action: "File Download",
            file_name: "customer_data.xlsx",
            file_size_mb: 15.7,
            destination: "Personal OneDrive",
            classification: "Confidential",
            data_type: "PII",
            event_id: "evt-00123",
            severity: "High",
            source: "Purview"
          },
          {
            id: 6,
            timestamp: "2024-02-14T10:30:01Z",
            user: "diana@contoso.com",
            action: "Unusual Login Pattern",
            login_count: 15,
            time_window_minutes: 5,
            unique_ips: 8,
            countries: ["US", "CN", "RU"],
            risk_score: 92,
            status: "Flagged",
            description: "Multiple rapid logins from different geographic locations",
            severity: "Critical",
            source: "UEBA"
          },
          {
            id: 7,
            timestamp: "2024-02-14T10:35:18Z",
            user: "eve@contoso.com",
            url: "https://facebook.com",
            action: "Allowed",
            urlcategory: "Social Networking",
            bytes_in: 5120,
            bytes_out: 1024,
            duration_ms: 250,
            severity: "Low",
            source: "Zscaler"
          },
          {
            id: 8,
            timestamp: "2024-02-14T10:40:55Z",
            scanName: "Weekly Compliance Scan",
            dataSourceName: "Azure SQL Database",
            assetsDiscovered: 1247,
            sensitiveAssetsFound: 89,
            scanStatus: "Completed",
            scanDuration: "45 minutes",
            findings: ["PII detected", "Unencrypted columns"],
            severity: "Medium",
            source: "Purview"
          },
          {
            id: 9,
            timestamp: "2024-02-14T10:45:22Z",
            user: "frank@contoso.com",
            badge_id: "BADGE-2002",
            door_name: "Main Entrance",
            access_granted: true,
            employee_name: "Frank Miller",
            department: "Security",
            entry_time: "10:45:22",
            exit_time: null,
            severity: "Low",
            source: "Physical Security"
          },
          {
            id: 10,
            timestamp: "2024-02-14T10:50:00Z",
            user: "grace@contoso.com",
            action: "DLP rule matched",
            policy: "Healthcare Data Protection",
            rule: "Block PHI Sharing",
            sensitiveInfoType: "Social Security Number",
            messageSubject: "Patient Records Q1",
            recipients: ["external-partner@hospital.com"],
            actionTaken: "Blocked",
            override: "Medical Director Approval Required",
            location: "Teams",
            severity: "Critical",
            source: "Purview DLP"
          }
        ];

        console.log("🔥 Using dummy data for testing");
        
      } else {
        // ============================================================
        // REAL API CALL (Commented out for testing)
        // ============================================================
        
        const response = await fetch(API_CONFIG.QUERY_ENDPOINT + "/api/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: queryInput,
            language: language,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setError(
            `Error: ${response.statusText} - ${
              errorData.error || "Request failed"
            }`
          );
          return;
        }

        data = await response.json();
      }

      const executionTime = performance.now() - startTime;

      // Just pass the data as-is
      setResult({
        success: true,
        data: Array.isArray(data) ? data : [data],
        execution_time: executionTime,
        row_count: Array.isArray(data) ? data.length : 1,
      });
    } catch (err) {
      setError(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsRunning(false);
    }
  }, [queryInput, language]);

  const handleClear = useCallback(() => {
    setQueryInput("");
    setResult(null);
    setError(null);
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      handleClear();
    });

    // Configure editor for better UX
    editor.updateOptions({
      minimap: { enabled: false },
      lineNumbers: "on",
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly: isRunning,
      automaticLayout: true,
    });
  };

  const loadSampleQuery = () => {
    setQueryInput(sampleQueries[language]);
  };

  const renderLogsView = (events: any[]) => {
    if (!events || events.length === 0) {
      return (
        <div className="p-4 text-gray-500 dark:text-gray-400">No events found</div>
      );
    }

    return (
      <div className="space-y-0">
        {/* Table Header */}
        <div className="sticky top-0 z-10 grid grid-cols-12 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
          <div className="col-span-2">Time</div>
          <div className="col-span-10">Output</div>
        </div>

        {/* Log Entries */}
        {events.map((row, idx) => {
          const jsonString = JSON.stringify(row, null, 2);
          const timestamp = row.timestamp || row.time || row.ts || new Date().toISOString();
          
          return (
            <div
              key={idx}
              className="grid grid-cols-12 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              {/* Time Column */}
              <div className="col-span-2 border-r border-gray-200 dark:border-gray-700 px-3 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                {new Date(timestamp).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')}
              </div>

              {/* Output Column */}
              <div className="col-span-10 px-3 py-2">
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-200">
                  <code 
                    className="language-json"
                    dangerouslySetInnerHTML={{ 
                      __html: syntaxHighlightJSON(jsonString) 
                    }}
                  />
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRawView = (events: any[]) => {
    if (!events || events.length === 0) {
      return (
        <div className="p-4 text-gray-500 dark:text-gray-400">No events found</div>
      );
    }

    return (
      <div className="space-y-0">
        {events.map((row, idx) => {
          const jsonString = JSON.stringify(row);
          
          return (
            <div
              key={idx}
              className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 font-mono text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <span className="text-gray-500 dark:text-gray-400">[{idx + 1}]</span>{' '}
              <span className="text-gray-700 dark:text-gray-200">{jsonString}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableView = (events: any[]) => {
    if (!events || events.length === 0) {
      return (
        <div className="p-4 text-gray-500 dark:text-gray-400">No events found</div>
      );
    }

    // Get all unique column names from all rows
    const columns = Array.from(
      new Set(events.flatMap((row) => Object.keys(row)))
    );

    return (
      <div className="w-full h-full overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              {columns.map((col) => (
                <th
                  key={col}
                  className="sticky top-0 border-r border-gray-200 dark:border-gray-700
                            bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left font-semibold
                            text-gray-600 dark:text-gray-400 last:border-r-0
                            break-words"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {events.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 dark:border-gray-700
                          hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {columns.map((col) => {
                  const value = row[col];
                  const displayValue =
                    value === null || value === undefined
                      ? "-"
                      : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value);

                  return (
                    <td
                      key={col}
                      title={displayValue}
                      className="border-r border-gray-200 dark:border-gray-700
                                px-3 py-2 text-gray-700 dark:text-gray-300
                                last:border-r-0 break-words max-w-[250px]"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  };

  const renderEvents = (events: any[]) => {
    switch (activeTab) {
      case "logs":
        return renderLogsView(events);
      case "raw":
        return renderRawView(events);
      case "table":
        return renderTableView(events);
      default:
        return renderLogsView(events);
    }
  };

  // Syntax highlighting function
  const syntaxHighlightJSON = (json: string) => {
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '<span style="color: #dc2626;">\"$1\"</span>:') // Keys (red)
      .replace(/: "([^"]*)"/g, ': <span style="color: #16a34a;">\"$1\"</span>') // String values (green)
      .replace(/: (\d+)/g, ': <span style="color: #ca8a04;">$1</span>') // Numbers (yellow/gold)
      .replace(/: (true|false)/g, ': <span style="color: #2563eb;">$1</span>') // Booleans (blue)
      .replace(/: (null)/g, ': <span style="color: #9333ea;">$1</span>'); // Null (purple)
  };

  return (
    <div className="flex h-full flex-col space-y-4 overflow-x-hidden">
      {/* Language Selector & Controls */}
      <div className="flex-shrink-0 flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as QueryLanguage)}
              disabled={isRunning}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="pyspark">PySpark</option>
              <option value="sql">SQL</option>
            </select>
          </div>
          <button
            onClick={loadSampleQuery}
            disabled={isRunning}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
          >
            Load Sample
          </button>
        </div>

        <div className="text-xs text-gray-500">
          ⌘/Ctrl+Enter to run • ⌘/Ctrl+K to clear
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-shrink-0 rounded-lg border border-gray-300 overflow-hidden dark:border-gray-600">
        <MonacoEditor
          height="200px"
          language={language}
          value={queryInput}
          onChange={(value) => setQueryInput(value || "")}
          onMount={handleEditorDidMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          options={{
            renderLineHighlight: 'none',
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: isRunning,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            glyphMargin: false,
          }}
        />
      </div>

      

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-3">
        <button
          onClick={handleRun}
          disabled={isRunning || !queryInput.trim()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Run Query</span>
            </>
          )}
        </button>

        <button
          onClick={handleClear}
          disabled={isRunning}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear
        </button>

        {executionHistory.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => loadFromHistory("up")}
              disabled={isRunning || historyIndex >= executionHistory.length - 1}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Previous query"
            >
              ↑
            </button>
            <button
              onClick={() => loadFromHistory("down")}
              disabled={isRunning || historyIndex < 0}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Next query"
            >
              ↓
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 dark:text-red-300">
                Execution Error
              </h4>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-sm text-red-700 dark:text-red-400">
                {error}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && result.success && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Results Header with Tabs */}
          <div className="flex-shrink-0 rounded-t-lg border border-b-0 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                {/* Tab Buttons */}
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === "logs"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  Logs
                </button>
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === "raw"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  _raw
                </button>
                <button
                  onClick={() => setActiveTab("table")}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === "table"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  Table
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {result.row_count} {result.row_count === 1 ? "row" : "rows"}
                </span>
                {result.execution_time && (
                  <span>
                    Executed in {(result.execution_time / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Results Data with Flex Scroll */}
          <div className="min-h-0 flex-1 rounded-b-lg border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600 overflow-hidden">
            {result.data && renderEvents(result.data)}
          </div>
        </div>
      )}
    </div>
  );
}