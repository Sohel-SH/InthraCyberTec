// "use client";

// import React, { useState, useCallback } from "react";
// import { useLanguage } from "@/context/LanguageContext";
// import { API_CONFIG } from "@/config/api";

// interface UnifiedEvent {
//   event_id: string;
//   timestamp: string;
//   source: string;
//   category: string;
//   user?: string | null;
//   action?: string | null;
//   severity: "Low" | "Medium" | "High" | "Critical";
//   description: string;
//   raw: any;
// }

// interface QueryResult {
//   success: boolean;
//   data?: UnifiedEvent[];
//   error?: string;
// }

// export default function QueryClient() {
//   const [queryInput, setQueryInput] = useState("");
//   const [isRunning, setIsRunning] = useState(false);
//   const [result, setResult] = useState<QueryResult | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const { t } = useLanguage();

//   // 🔥 Normalize Different Sources
//   const normalizeEvent = (raw: any): UnifiedEvent | null => {
//     // Source 1 – Purview Scan
//     if (raw.properties?.dataSourceName) {
//       return {
//         event_id: raw.properties.scanResultId || crypto.randomUUID(),
//         timestamp: raw.time,
//         source: "Purview",
//         category: "Scan",
//         user: null,
//         action: raw.resultType,
//         severity: "Low",
//         description: `${raw.properties.scanName} completed (${raw.properties.assetsDiscovered} assets discovered)`,
//         raw,
//       };
//     }

//     // Source 2 – Purview DLP
//     if (raw.SensitiveInfoType) {
//       return {
//         event_id: crypto.randomUUID(),
//         timestamp: raw.Timestamp,
//         source: "Purview",
//         category: "DLP",
//         user: raw.User,
//         action: raw.ActionTaken,
//         severity: raw.ActionTaken === "Blocked" ? "High" : "Medium",
//         description: `DLP rule matched: ${raw.SensitiveInfoType}`,
//         raw,
//       };
//     }

//     // Source 3 – Zscaler
//     if (raw.sourcetype === "zscalernss-web") {
//       const event = raw.event;
//       const isBlocked = event.action === "Blocked";

//       return {
//         event_id: crypto.randomUUID(),
//         timestamp: event.datetime,
//         source: "Zscaler",
//         category: "Web",
//         user: event.user,
//         action: event.action,
//         severity: isBlocked
//           ? event.urlcategory === "Malware"
//             ? "Critical"
//             : "High"
//           : "Low",
//         description: `${event.action} ${event.url} (${event.urlcategory})`,
//         raw,
//       };
//     }

//     // Source 4 – UEBA
//     if (raw.risk_score !== undefined) {
//       return {
//         event_id: raw.event_id,
//         timestamp: raw.timestamp,
//         source: "UEBA",
//         category: "Anomaly",
//         user: raw.user,
//         action: raw.status,
//         severity:
//           raw.risk_score > 80
//             ? "Critical"
//             : raw.risk_score > 60
//             ? "High"
//             : "Medium",
//         description: raw.description,
//         raw,
//       };
//     }

//     // Source 5 – Badge Access
//     if (raw.badge_id) {
//       return {
//         event_id: crypto.randomUUID(),
//         timestamp: raw.timestamp,
//         source: "Physical Security",
//         category: "Access",
//         user: raw.employee_name,
//         action: raw.access_granted ? "Allowed" : "Denied",
//         severity: raw.access_granted ? "Low" : "High",
//         description: `${raw.door_name} access ${
//           raw.access_granted ? "granted" : "denied"
//         }`,
//         raw,
//       };
//     }

//     return null;
//   };

//   const handleRun = useCallback(async () => {
//     if (!queryInput.trim()) {
//       alert("Please enter a query");
//       return;
//     }

//     setIsRunning(true);
//     setResult(null);
//     setError(null);

//     try {
//       const response = await fetch(API_CONFIG.QUERY_ENDPOINT + "/run", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           query: queryInput,
//           timestamp: new Date().toISOString(),
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         setError(
//           `Error: ${response.statusText} - ${
//             errorData.error || "Request failed"
//           }`
//         );
//         return;
//       }

//       const data = await response.json();

//       let events: UnifiedEvent[] = [];

//       if (Array.isArray(data)) {
//         events = data
//           .map((item) => normalizeEvent(item))
//           .filter(Boolean) as UnifiedEvent[];
//       } else {
//         const single = normalizeEvent(data);
//         if (single) events = [single];
//       }

//       setResult({
//         success: true,
//         data: events,
//       });
//     } catch (err) {
//       setError(
//         `Error: ${err instanceof Error ? err.message : "Unknown error"}`
//       );
//     } finally {
//       setIsRunning(false);
//     }
//   }, [queryInput]);

//   const handleClear = useCallback(() => {
//     setQueryInput("");
//     setResult(null);
//     setError(null);
//   }, []);

//   const renderEvents = (events: UnifiedEvent[]) => {
//     if (!events || events.length === 0) {
//       return (
//         <div className="text-gray-500 dark:text-gray-400">
//           No events found
//         </div>
//       );
//     }

//     return (
//       <div className="space-y-4">
//         {events.map((event) => (
//           <div
//             key={event.event_id}
//             className="rounded-lg border border-gray-300 bg-gray-50 p-4 shadow-sm dark:border-gray-600 dark:bg-gray-900"
//           >
//             <div className="flex justify-between">
//               <span className="font-semibold">{event.source}</span>
//               <span
//                 className={`text-sm font-semibold ${
//                   event.severity === "Critical"
//                     ? "text-red-600"
//                     : event.severity === "High"
//                     ? "text-orange-500"
//                     : event.severity === "Medium"
//                     ? "text-yellow-500"
//                     : "text-green-500"
//                 }`}
//               >
//                 {event.severity}
//               </span>
//             </div>

//             <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
//               {event.description}
//             </div>

//             <div className="mt-2 text-xs text-gray-500">
//               User: {event.user || "N/A"}
//             </div>

//             <div className="text-xs text-gray-500">
//               Action: {event.action || "N/A"}
//             </div>

//             <div className="text-xs text-gray-400 mt-1">
//               {new Date(event.timestamp).toLocaleString()}
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-4">
//       <textarea
//         value={queryInput}
//         onChange={(e) => setQueryInput(e.target.value)}
//         rows={6}
//         disabled={isRunning}
//         placeholder={t("query.inputPlaceholder")}
//         className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
//       />

//       <div className="flex gap-3">
//         <button
//           onClick={handleRun}
//           disabled={isRunning}
//           className="rounded-lg bg-blue-600 px-6 py-2 text-white disabled:opacity-50"
//         >
//           {isRunning ? "Running..." : "Run Query"}
//         </button>

//         <button
//           onClick={handleClear}
//           disabled={isRunning}
//           className="rounded-lg border px-6 py-2"
//         >
//           Clear
//         </button>
//       </div>

//       {error && (
//         <div className="rounded-lg bg-red-100 p-3 text-red-700">
//           {error}
//         </div>
//       )}

//       {result && result.success && result.data && (
//         <div>
//           <h4 className="text-sm font-medium mb-2">Results</h4>
//           {renderEvents(result.data)}
//         </div>
//       )}
//     </div>
//   );
// }


// "use client";

// import React, { useState, useCallback, useRef, useEffect } from "react";
// import dynamic from "next/dynamic";
// import { useLanguage } from "@/context/LanguageContext";
// import { API_CONFIG } from "@/config/api";

// // Dynamically import Monaco Editor to avoid SSR issues
// const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
//   ssr: false,
//   loading: () => (
//     <div className="flex h-64 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
//       <span className="text-gray-500">Loading editor...</span>
//     </div>
//   ),
// });

// interface QueryResult {
//   success: boolean;
//   data?: any[];  // Just raw data from API
//   error?: string;
//   execution_time?: number;
//   row_count?: number;
// }

// type QueryLanguage = "python" | "sql";

// export default function QueryClient() {
//   const [queryInput, setQueryInput] = useState("");
//   const [language, setLanguage] = useState<QueryLanguage>("python");
//   const [isRunning, setIsRunning] = useState(false);
//   const [result, setResult] = useState<QueryResult | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [executionHistory, setExecutionHistory] = useState<string[]>([]);
//   const [historyIndex, setHistoryIndex] = useState(-1);
//   const { t } = useLanguage();
//   const editorRef = useRef<any>(null);

//   // Sample starter queries
//   const sampleQueries = {
//     python: `# PySpark Query Example
// df = spark.read.table("security_events")
// df.filter(df.severity == "Critical").show()`,
//     sql: `-- SQL Query Example
// SELECT * FROM security_events 
// WHERE severity = 'Critical' 
// ORDER BY timestamp DESC 
// LIMIT 100`,
//   };

//   // Load query from history
//   const loadFromHistory = useCallback(
//     (direction: "up" | "down") => {
//       if (executionHistory.length === 0) return;

//       let newIndex = historyIndex;
//       if (direction === "up") {
//         newIndex = Math.min(historyIndex + 1, executionHistory.length - 1);
//       } else {
//         newIndex = Math.max(historyIndex - 1, -1);
//       }

//       setHistoryIndex(newIndex);
//       if (newIndex >= 0) {
//         setQueryInput(executionHistory[newIndex]);
//       } else {
//         setQueryInput("");
//       }
//     },
//     [executionHistory, historyIndex]
//   );

//   const handleRun = useCallback(async () => {
//     if (!queryInput.trim()) {
//       alert("Please enter a query");
//       return;
//     }

//     setIsRunning(true);
//     setResult(null);
//     setError(null);

//     // Add to history
//     setExecutionHistory((prev) => [queryInput, ...prev.slice(0, 49)]); // Keep last 50
//     setHistoryIndex(-1);

//     const startTime = performance.now();

//     try {
//       const response = await fetch(API_CONFIG.QUERY_ENDPOINT + "/run", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           query: queryInput,
//           language: language,
//           timestamp: new Date().toISOString(),
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         setError(
//           `Error: ${response.statusText} - ${
//             errorData.error || "Request failed"
//           }`
//         );
//         return;
//       }

//       const data = await response.json();
//       const executionTime = performance.now() - startTime;

//       // Just pass the data as-is
//       setResult({
//         success: true,
//         data: Array.isArray(data) ? data : [data],
//         execution_time: executionTime,
//         row_count: Array.isArray(data) ? data.length : 1,
//       });
//     } catch (err) {
//       setError(
//         `Error: ${err instanceof Error ? err.message : "Unknown error"}`
//       );
//     } finally {
//       setIsRunning(false);
//     }
//   }, [queryInput, language]);

//   const handleClear = useCallback(() => {
//     setQueryInput("");
//     setResult(null);
//     setError(null);
//   }, []);

//   const handleEditorDidMount = (editor: any, monaco: any) => {
//     editorRef.current = editor;

//     // Add keyboard shortcuts
//     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
//       handleRun();
//     });

//     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
//       handleClear();
//     });

//     // Configure editor for better UX
//     editor.updateOptions({
//       minimap: { enabled: false },
//       lineNumbers: "on",
//       roundedSelection: true,
//       scrollBeyondLastLine: false,
//       readOnly: isRunning,
//       automaticLayout: true,
//     });
//   };

//   const loadSampleQuery = () => {
//     setQueryInput(sampleQueries[language]);
//   };

//   const renderEvents = (events: any[]) => {
//     if (!events || events.length === 0) {
//       return (
//         <div className="text-gray-500 dark:text-gray-400">No events found</div>
//       );
//     }

//     return (
//       <div className="space-y-4">
//         {events.map((row, idx) => {
//           // Get all fields from the row
//           const allFields = Object.entries(row || {});
          
//           return (
//             <div
//               key={idx}
//               className="rounded-lg border border-gray-300 bg-gray-50 p-4 shadow-sm dark:border-gray-600 dark:bg-gray-900"
//             >
//               {/* Header Row */}
//               <div className="mb-3 flex items-center justify-between border-b border-gray-300 pb-2 dark:border-gray-600">
//                 <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
//                   Row {idx + 1}
//                 </span>
//                 <span className="text-xs text-gray-500 dark:text-gray-400">
//                   {allFields.length} fields
//                 </span>
//               </div>

//               {/* All Fields Grid */}
//               <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
//                 {allFields.map(([key, value]) => {
//                   // Skip displaying null/undefined values
//                   if (value === null || value === undefined) return null;
                  
//                   // Format the value
//                   let displayValue: string;
//                   if (typeof value === 'object') {
//                     displayValue = JSON.stringify(value, null, 2);
//                   } else {
//                     displayValue = String(value);
//                   }

//                   return (
//                     <div key={key} className="flex flex-col">
//                       <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
//                         {key.replace(/_/g, ' ')}
//                       </span>
//                       <span className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                         {displayValue.length > 100 ? (
//                           <details className="cursor-pointer">
//                             <summary className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
//                               View ({displayValue.length} chars)
//                             </summary>
//                             <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
//                               {displayValue}
//                             </pre>
//                           </details>
//                         ) : (
//                           <span className="break-words">{displayValue}</span>
//                         )}
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-4">
//       {/* Language Selector & Controls */}
//       <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2">
//             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//               Language:
//             </label>
//             <select
//               value={language}
//               onChange={(e) => setLanguage(e.target.value as QueryLanguage)}
//               disabled={isRunning}
//               className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
//             >
//               <option value="python">PySpark (Python)</option>
//               <option value="sql">SQL</option>
//             </select>
//           </div>

//           <button
//             onClick={loadSampleQuery}
//             disabled={isRunning}
//             className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
//           >
//             Load Sample
//           </button>
//         </div>

//         <div className="text-xs text-gray-500">
//           ⌘/Ctrl+Enter to run • ⌘/Ctrl+K to clear
//         </div>
//       </div>

//       {/* Monaco Editor */}
//       <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
//         <MonacoEditor
//           height="300px"
//           language={language}
//           value={queryInput}
//           onChange={(value) => setQueryInput(value || "")}
//           onMount={handleEditorDidMount}
//           theme="vs-dark"
//           options={{
//             minimap: { enabled: false },
//             fontSize: 14,
//             lineNumbers: "on",
//             roundedSelection: true,
//             scrollBeyondLastLine: false,
//             readOnly: isRunning,
//             automaticLayout: true,
//             tabSize: 2,
//             wordWrap: "on",
//             suggestOnTriggerCharacters: true,
//             quickSuggestions: true,
//             folding: true,
//             glyphMargin: false,
//           }}
//         />
//       </div>

//       {/* Action Buttons */}
//       <div className="flex gap-3">
//         <button
//           onClick={handleRun}
//           disabled={isRunning || !queryInput.trim()}
//           className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
//         >
//           {isRunning ? (
//             <>
//               <svg
//                 className="h-4 w-4 animate-spin"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//               <span>Running...</span>
//             </>
//           ) : (
//             <>
//               <svg
//                 className="h-4 w-4"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
//                 />
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//               <span>Run Query</span>
//             </>
//           )}
//         </button>

//         <button
//           onClick={handleClear}
//           disabled={isRunning}
//           className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
//         >
//           Clear
//         </button>

//         {executionHistory.length > 0 && (
//           <div className="flex gap-1">
//             <button
//               onClick={() => loadFromHistory("up")}
//               disabled={isRunning || historyIndex >= executionHistory.length - 1}
//               className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
//               title="Previous query"
//             >
//               ↑
//             </button>
//             <button
//               onClick={() => loadFromHistory("down")}
//               disabled={isRunning || historyIndex < 0}
//               className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
//               title="Next query"
//             >
//               ↓
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Error Display */}
//       {error && (
//         <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
//           <div className="flex items-start gap-3">
//             <svg
//               className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//               />
//             </svg>
//             <div className="flex-1">
//               <h4 className="font-semibold text-red-800 dark:text-red-300">
//                 Execution Error
//               </h4>
//               <pre className="mt-2 whitespace-pre-wrap font-mono text-sm text-red-700 dark:text-red-400">
//                 {error}
//               </pre>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Results Display */}
//       {result && result.success && (
//         <div className="space-y-4">
//           {/* Results Header */}
//           <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
//             <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
//               Query Results
//             </h4>
//             <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
//               <span>
//                 {result.row_count} {result.row_count === 1 ? "row" : "rows"}
//               </span>
//               {result.execution_time && (
//                 <span>
//                   Executed in {(result.execution_time / 1000).toFixed(2)}s
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* Results Data */}
//           <div className="rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
//             {result.data && renderEvents(result.data)}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// Log Viewer //
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";
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

type QueryLanguage = "python" | "sql";

export default function QueryClient() {
  const [queryInput, setQueryInput] = useState("");
  const [language, setLanguage] = useState<QueryLanguage>("python");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { t } = useLanguage();
  const editorRef = useRef<any>(null);

  // Sample starter queries
  const sampleQueries = {
    python: `# PySpark Query Example
df = spark.read.table("security_events")
df.filter(df.severity == "Critical").show()`,
    sql: `-- SQL Query Example
SELECT * FROM security_events 
WHERE severity = 'Critical' 
ORDER BY timestamp DESC 
LIMIT 100`,
  };

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

    try {
      const response = await fetch(API_CONFIG.QUERY_ENDPOINT + "/run", {
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

      const data = await response.json();
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

  const renderEvents = (events: any[]) => {
    if (!events || events.length === 0) {
      return (
        <div className="text-gray-500 dark:text-gray-400">No events found</div>
      );
    }

    return (
      <div className="space-y-3">
        {events.map((row, idx) => {
          const jsonString = JSON.stringify(row, null, 2);
          
          return (
            <div
              key={idx}
              className="rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                  Row {idx + 1}
                </span>
                <span className="font-mono text-xs text-gray-500">
                  {jsonString.length} characters
                </span>
              </div>
              
              {/* Formatted JSON with Syntax Highlighting */}
              <pre className="overflow-x-auto p-4 font-mono text-sm">
                <code 
                  className="language-json"
                  dangerouslySetInnerHTML={{ 
                    __html: syntaxHighlightJSON(jsonString) 
                  }}
                />
              </pre>
            </div>
          );
        })}
      </div>
    );
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
    <div className="space-y-4">
      {/* Language Selector & Controls */}
      <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
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
              <option value="python">PySpark (Python)</option>
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
      <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        <MonacoEditor
          height="300px"
          language={language}
          value={queryInput}
          onChange={(value) => setQueryInput(value || "")}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
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
      <div className="flex gap-3">
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
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
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
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Query Results
            </h4>
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

          {/* Results Data */}
          <div className="rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
            {result.data && renderEvents(result.data)}
          </div>
        </div>
      )}
    </div>
  );
}