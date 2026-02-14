"use client";

import React, { useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { API_CONFIG } from "@/config/api";

interface TableData {
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

interface QueryResult {
  success: boolean;
  data?: TableData | object | any[];
  error?: string;
}

export default function QueryClient() {
  const [queryInput, setQueryInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const parseResponseToTable = (data: any): TableData | null => {
    // If data is already in table format
    if (data.columns && data.rows) {
      return data as TableData;
    }

    // If data is an array of objects
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
      const columns = Object.keys(data[0]);
      const rows = data.map((item) =>
        columns.map((col) => {
          const value = item[col];
          return value === null || value === undefined ? "-" : value;
        })
      );
      return { columns, rows };
    }

    // If data is a single object, convert to single row
    if (typeof data === "object" && !Array.isArray(data)) {
      const columns = Object.keys(data);
      const rows = [columns.map((col) => {
        const value = data[col];
        return value === null || value === undefined ? "-" : value;
      })];
      return { columns, rows };
    }

    return null;
  };

  const handleRun = useCallback(async () => {
    if (!queryInput.trim()) {
      alert("Please enter a query or filter term (or use * to show all)");
      return;
    }

    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      // Fetch from configured API endpoint
      const response = await fetch(API_CONFIG.QUERY_ENDPOINT, {
        method: "GET",
      });

      if (response.ok) {
        let data = await response.json();
        
        console.log("API Response:", data); // Debug log
        
        // If using a public API that returns an array directly (like JSONPlaceholder)
        if (Array.isArray(data)) {
          // Filter results based on query input (case-insensitive search)
          const searchTerm = queryInput.toLowerCase().trim();
          
          let filteredData = data;
          
          // If user types "*" or "all", show all data without filtering
          if (searchTerm !== "*" && searchTerm !== "all") {
            filteredData = data.filter((item) => {
              return JSON.stringify(item).toLowerCase().includes(searchTerm);
            });
            
            // If filter returns empty, show all data and warn user
            if (filteredData.length === 0) {
              console.warn(`No results found for "${queryInput}". Showing all data.`);
              filteredData = data;
            }
          }
          
          console.log("Filtered Data:", filteredData); // Debug log
          
          setResult({
            success: true,
            data: filteredData,
          });
        } else {
          // If using custom backend with structured response
          setResult(data);
          if (!data.success) {
            setError(data.error || "Query execution failed");
          }
        }
      } else {
        setError(`Error: ${response.statusText}`);
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  }, [queryInput]);

  const handleClear = useCallback(() => {
    setQueryInput("");
    setResult(null);
    setError(null);
  }, []);

  const renderTableResults = (tableData: TableData) => {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
              {tableData.columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableData.columns.length}
                  className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              tableData.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900/50"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {typeof cell === "boolean" ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cell
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {String(cell)}
                        </span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("query.inputLabel")}
        </label>
        <textarea
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder={t("query.inputPlaceholder")}
          title="Enter a SQL query (for custom backend) or filter term (for public APIs like JSONPlaceholder)"
          rows={6}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
          disabled={isRunning}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-purple-600 px-6 py-2.5 font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
              {t("query.running")}
            </>
          ) : (
            t("query.runButton")
          )}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={isRunning}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t("query.clearButton")}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {result && result.success && result.data && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("query.result")}
          </h4>
          {parseResponseToTable(result.data) ? (
            renderTableResults(parseResponseToTable(result.data)!)
          ) : (
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900">
              <pre className="max-h-96 overflow-auto text-sm text-gray-900 dark:text-gray-100">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
