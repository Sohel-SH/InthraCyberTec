"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { API_CONFIG } from "@/config/api";
import { savedQueriesService, type SavedQuery } from "@/services/savedQueriesService";

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
  data?: any[];
  error?: string;
  execution_time?: number;
  row_count?: number;
}

interface ValidationMarker {
  severity: number; // 1=hint, 2=info, 4=warning, 8=error
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

type QueryLanguage = "pyspark" | "sql";

interface RunHistoryEntry {
  id: string;
  query: string;
  language: QueryLanguage;
  ranAt: number;
}

const MAX_RUN_HISTORY = 10;

function formatRunTimeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 10) return "Just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function previewQueryOneLine(query: string, maxLen = 72): string {
  const line = query.trim().split(/\r?\n/)[0] || "";
  const collapsed = line.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLen) return collapsed || "(empty)";
  return `${collapsed.slice(0, maxLen - 1)}…`;
}

// ─────────────────────────────────────────────────────────────
// SQL VALIDATOR
// ─────────────────────────────────────────────────────────────

const SQL_STATEMENT_KEYWORDS = [
  "SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER",
  "WITH", "MERGE", "TRUNCATE", "EXPLAIN", "DESCRIBE", "SHOW", "USE",
  "GRANT", "REVOKE", "BEGIN", "COMMIT", "ROLLBACK", "SET", "CALL",
];

// SQL keywords valid after identifiers/values — won't be flagged as trailing junk
const SQL_VALID_FOLLOWERS = new Set([
  "AS","AND","OR","NOT","IN","IS","ON","BY","ASC","DESC","INNER","OUTER",
  "LEFT","RIGHT","FULL","CROSS","JOIN","UNION","ALL","DISTINCT","WHERE",
  "HAVING","LIMIT","OFFSET","FROM","SELECT","CASE","WHEN","THEN","ELSE",
  "END","BETWEEN","LIKE","EXISTS","NULL","TRUE","FALSE","INTO","VALUES",
  "SET","TABLE","VIEW","INDEX","DATABASE","SCHEMA","IF","ELSE","GROUP",
  "ORDER","PARTITION","OVER","ROWS","RANGE","PRECEDING","FOLLOWING",
]);

function validateSQL(code: string): ValidationMarker[] {
  const markers: ValidationMarker[] = [];
  const lines = code.split("\n");

  // Strip comments for analysis
  const strippedCode = code
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  const upperStripped = strippedCode.toUpperCase().trim();

  // ── FIX 1: GATE CHECK — proper regex catches single-word junk too ──
  // Old bug: startsWith(kw + " ") fails for single-word input with no space
  if (strippedCode.length > 0) {
    const startsWithValidKeyword = SQL_STATEMENT_KEYWORDS.some((kw) => {
      // Match keyword followed by whitespace, '(', or end-of-string
      const re = new RegExp(`^${kw}(\\s|\\(|$)`, "i");
      return re.test(upperStripped);
    });

    if (!startsWithValidKeyword) {
      let firstContentLine = 0;
      for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (t && !t.startsWith("--") && !t.startsWith("/*")) {
          firstContentLine = i;
          break;
        }
      }
      const badToken = strippedCode.split(/[\s(]/)[0];
      markers.push({
        severity: 8,
        message: `Invalid SQL: query must begin with a SQL keyword (SELECT, INSERT, UPDATE, DELETE, CREATE, …). Got: '${badToken}'`,
        startLineNumber: firstContentLine + 1,
        startColumn: 1,
        endLineNumber: firstContentLine + 1,
        endColumn: lines[firstContentLine]?.length + 1 || 2,
      });
      return markers; // Early exit — further checks meaningless on garbage input
    }
  }

  // Track open/close parentheses
  let parenDepth = 0;
  let parenOpenLine = -1;
  let parenOpenCol = -1;

  // Known invalid SQL patterns
  const invalidPatterns: { pattern: RegExp; message: string }[] = [
    { pattern: /SELECT\s*FROM/i, message: "Missing column list between SELECT and FROM" },
    { pattern: /WHERE\s+(AND|OR)\b/i, message: "Condition cannot start with AND/OR after WHERE" },
    { pattern: /,\s*(FROM|WHERE|GROUP|ORDER|HAVING|LIMIT)\b/i, message: "Trailing comma before keyword" },
    { pattern: /\bFROM\s+WHERE\b/i, message: "Missing table name between FROM and WHERE" },
    { pattern: /\bJOIN\s+(WHERE|ON\s+ON)\b/i, message: "Invalid JOIN syntax" },
    { pattern: /\bSELECT\s+\*/i, message: "SELECT * may impact performance — consider specifying columns" },
    { pattern: /\bDROP\s+TABLE\b/i, message: "Destructive operation: DROP TABLE detected" },
    { pattern: /;[\s\S]*;/, message: "Multiple statements detected — only one statement is supported" },
    { pattern: /\b(SELEC|FORM|WEHRE|GROPU|ORDR|LIMT)\b/i, message: "Possible typo in SQL keyword" },
  ];

  // Check for missing FROM in SELECT statements
  const upperCode = code.toUpperCase().replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const isSelectStatement = /^\s*(WITH|SELECT)/i.test(upperCode.trim());
  if (isSelectStatement && !/\bFROM\b/i.test(upperCode)) {
    markers.push({
      severity: 8,
      message: "SELECT statement is missing a FROM clause",
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: lines[0].length + 1,
    });
  }

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;
    const trimmed = line.trimStart();

    // Skip comments
    if (trimmed.startsWith("--") || trimmed.startsWith("/*")) return;

    // ── Parentheses balance ──
    for (let col = 0; col < line.length; col++) {
      if (line[col] === "(") {
        if (parenDepth === 0) { parenOpenLine = lineNum; parenOpenCol = col + 1; }
        parenDepth++;
      } else if (line[col] === ")") {
        parenDepth--;
        if (parenDepth < 0) {
          markers.push({
            severity: 8,
            message: "Unexpected closing parenthesis — no matching opening '('",
            startLineNumber: lineNum,
            startColumn: col + 1,
            endLineNumber: lineNum,
            endColumn: col + 2,
          });
          parenDepth = 0;
        }
      }
    }

    // ── FIX 2: Trailing junk after last closing ')' ──
    // e.g. WHERE severity = 'Critical')junktext  ← catches this
    if (line.includes(")")) {
      let depth = 0;
      let lastCloseAt = -1;
      let inStr: string | null = null;
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        if (!inStr && (ch === '"' || ch === "'" || ch === "`")) { inStr = ch; continue; }
        if (inStr && ch === inStr) { inStr = null; continue; }
        if (inStr) continue;
        if (ch === "(") depth++;
        else if (ch === ")") { depth--; if (depth === 0) lastCloseAt = ci; }
      }
      if (lastCloseAt !== -1 && lastCloseAt < line.length - 1) {
        const after = line.slice(lastCloseAt + 1).trim();
        // Valid: chain, operator, comment, comma, semicolon
        const isValidSuffix = /^[\.\,\;\:\+\-\*\/\=\<\>\&\|\^\!\[\{\\#]/.test(after) || after === "";
        if (!isValidSuffix) {
          const trashCol = line.indexOf(after, lastCloseAt + 1) + 1;
          markers.push({
            severity: 8,
            message: `Unexpected token after ')': '${after.slice(0, 30)}${after.length > 30 ? "…" : ""}' — not valid SQL syntax`,
            startLineNumber: lineNum,
            startColumn: trashCol,
            endLineNumber: lineNum,
            endColumn: line.length + 1,
          });
        }
      }
    }

    // ── FIX 3: Trailing junk word after identifier/string ──
    // e.g. FROM security_events randomword  or  LIMIT 100 randomword
    {
      const trailMatch = line.match(/(?:'[^']*'|"[^"]*"|`[^`]*`|\b\w+)\s+([a-zA-Z_][a-zA-Z0-9_]{2,})\s*(?:--|$)/);
      if (trailMatch) {
        const candidate = trailMatch[1];
        if (!SQL_VALID_FOLLOWERS.has(candidate.toUpperCase())) {
          const junkIdx = line.lastIndexOf(candidate);
          markers.push({
            severity: 8,
            message: `Unexpected token '${candidate}' — not a valid SQL keyword. Check for extra text after the statement.`,
            startLineNumber: lineNum,
            startColumn: junkIdx + 1,
            endLineNumber: lineNum,
            endColumn: junkIdx + candidate.length + 1,
          });
        }
      }
    }

    // ── Per-line pattern checks ──
    invalidPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        const match = line.match(pattern);
        const colStart = match ? line.indexOf(match[0]) + 1 : 1;
        const severity = message.includes("performance") || message.includes("Destructive") ? 4 : 8;
        markers.push({ severity, message, startLineNumber: lineNum, startColumn: colStart, endLineNumber: lineNum, endColumn: line.length + 1 });
      }
    });

    // Detect unquoted string literals
    const unquotedStr = line.match(/=\s+([a-zA-Z][a-zA-Z0-9_]+)\s*($|AND|OR|,)/);
    if (unquotedStr && !["NULL", "TRUE", "FALSE"].includes(unquotedStr[1].toUpperCase())) {
      const col = line.indexOf(unquotedStr[0]) + 1;
      markers.push({
        severity: 4,
        message: `'${unquotedStr[1]}' looks like a string value but is not quoted — did you mean '${unquotedStr[1]}'?`,
        startLineNumber: lineNum,
        startColumn: col,
        endLineNumber: lineNum,
        endColumn: col + unquotedStr[0].length,
      });
    }
  });

  // Unclosed parenthesis at EOF
  if (parenDepth > 0 && parenOpenLine !== -1) {
    markers.push({
      severity: 8,
      message: `Unclosed parenthesis — missing ${parenDepth} closing ')'`,
      startLineNumber: parenOpenLine,
      startColumn: parenOpenCol,
      endLineNumber: parenOpenLine,
      endColumn: parenOpenCol + 1,
    });
  }

  return markers;
}

// ─────────────────────────────────────────────────────────────
// PYSPARK VALIDATOR
// ─────────────────────────────────────────────────────────────

// Python keywords valid after closing ')' / string — won't be flagged as junk
const PYTHON_VALID_FOLLOWERS = new Set([
  "if", "and", "or", "not", "in", "is", "as", "else", "for",
  "while", "with", "return", "lambda", "yield", "from", "import",
]);

// Regexes that match valid Python line starts
const PYTHON_VALID_STARTS = [
  /^#/,
  /^(import|from)\s/,
  /^(def|class|async\s+def)\s/,
  /^(if|elif|else\s*:|for|while|with|try\s*:|except|finally\s*:|return|yield|raise|pass|break|continue)\b/,
  /^[a-zA-Z_]\w*\s*(\(|=|\.|,|\[)/,
  /^[a-zA-Z_]\w*\s*[+\-*/%&|^]=/,
  /^"""|^'''/,
];

function validatePySpark(code: string): ValidationMarker[] {
  const markers: ValidationMarker[] = [];
  const lines = code.split("\n");

  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let parenOpenLine = -1;

  // ── GATE CHECK: first meaningful non-comment line must look like Python ──
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const looksLikePython = PYTHON_VALID_STARTS.some((re) => re.test(trimmed));
    if (!looksLikePython) {
      markers.push({
        severity: 8,
        message: `Invalid Python/PySpark: '${trimmed.slice(0, 50)}${trimmed.length > 50 ? "…" : ""}' is not a valid Python statement. Expected an assignment, function call, import, or keyword.`,
        startLineNumber: i + 1,
        startColumn: 1,
        endLineNumber: i + 1,
        endColumn: lines[i].length + 1,
      });
      return markers;
    }
    break;
  }

  // Common PySpark API mistakes
  const invalidPatterns: { pattern: RegExp; message: string; severity?: number }[] = [
    { pattern: /spark\.read\.csv\s*\((?![^)]*header)/, message: "spark.read.csv called without 'header' option — data may be read incorrectly", severity: 4 },
    { pattern: /\.show\s*\(\s*\)/, message: "df.show() with no limit may print excessive rows in production", severity: 2 },
    { pattern: /\.collect\s*\(\s*\)/, message: ".collect() loads all data into driver memory — use with caution on large datasets", severity: 4 },
    { pattern: /spark\.read\.table\s*\(\s*\)/, message: "spark.read.table() called with empty table name", severity: 8 },
    { pattern: /\bdf\s*=\s*df\b/, message: "Reassigning df to itself has no effect", severity: 4 },
    { pattern: /\.filter\s*\(\s*\)/, message: ".filter() called with no condition", severity: 8 },
    { pattern: /\.groupBy\s*\(\s*\)\s*\.agg\s*\(/, message: ".groupBy() with no columns — did you forget to specify group keys?", severity: 4 },
    { pattern: /import\s+\*\s+from/, message: "Wildcard import not valid in Python — use 'from module import *'", severity: 8 },
    { pattern: /\bprint\s*\(df\b/, message: "Printing a DataFrame object — use df.show() to display contents instead", severity: 4 },
    { pattern: /\.withColumn\s*\([^,]+\)(?!\s*\.)/, message: ".withColumn() requires exactly 2 arguments: column name and expression", severity: 8 },
    { pattern: /\bfor\b.+\bin\b.+\bdf\b/, message: "Iterating over a DataFrame with 'for' loop is inefficient — use DataFrame API instead", severity: 4 },
  ];

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;
    const trimmed = line.trimStart();

    // Skip comments and empty lines
    if (trimmed.startsWith("#") || trimmed === "") return;

    // ── Bracket balance tracking ──
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === "(") { if (parenDepth === 0) parenOpenLine = lineNum; parenDepth++; }
      else if (ch === ")") {
        parenDepth--;
        if (parenDepth < 0) {
          markers.push({ severity: 8, message: "Unexpected ')' — no matching '('", startLineNumber: lineNum, startColumn: col + 1, endLineNumber: lineNum, endColumn: col + 2 });
          parenDepth = 0;
        }
      }
      else if (ch === "[") bracketDepth++;
      else if (ch === "]") {
        bracketDepth--;
        if (bracketDepth < 0) {
          markers.push({ severity: 8, message: "Unexpected ']' — no matching '['", startLineNumber: lineNum, startColumn: col + 1, endLineNumber: lineNum, endColumn: col + 2 });
          bracketDepth = 0;
        }
      }
      else if (ch === "{") braceDepth++;
      else if (ch === "}") {
        braceDepth--;
        if (braceDepth < 0) {
          markers.push({ severity: 8, message: "Unexpected '}' — no matching '{'", startLineNumber: lineNum, startColumn: col + 1, endLineNumber: lineNum, endColumn: col + 2 });
          braceDepth = 0;
        }
      }
    }

    // ── FIX 1: Trailing junk after last closing ')' ──
    // Catches: df = spark.read.table("security_events")asdadadas
    //      and: df.filter(df.severity == "Critical")ssssudhgs
    if (line.includes("(") || line.includes(")")) {
      let depth = 0;
      let lastCloseAt = -1;
      let inStr: string | null = null;

      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        if (!inStr && (ch === '"' || ch === "'")) { inStr = ch; continue; }
        if (inStr && ch === inStr) { inStr = null; continue; }
        if (inStr) continue;
        if (ch === "(") depth++;
        else if (ch === ")") { depth--; if (depth === 0) lastCloseAt = ci; }
      }

      if (lastCloseAt !== -1 && lastCloseAt < line.length - 1) {
        const after = line.slice(lastCloseAt + 1).trim();
        // Valid suffixes: method chain (.), operators, comment (#), comma, colon, bracket, backslash
        const isValidSuffix = /^[\.\,\:\+\-\*\/\%\=\<\>\&\|\^\!\[\{\\#]/.test(after) || after === "";
        if (!isValidSuffix) {
          const trashCol = line.indexOf(after, lastCloseAt + 1) + 1;
          markers.push({
            severity: 8,
            message: `Unexpected token after ')': '${after.slice(0, 30)}${after.length > 30 ? "…" : ""}' — invalid Python syntax. Did you mean to chain a method with '.'?`,
            startLineNumber: lineNum,
            startColumn: trashCol,
            endLineNumber: lineNum,
            endColumn: line.length + 1,
          });
        }
      }
    }

    // ── FIX 2: Trailing junk word directly after a string literal ──
    // Catches: spark.read.table("events")junkword (no space between quote and junk)
    {
      const trailMatch = line.match(/(?:'[^']*'|"[^"]*")\s*([a-zA-Z_][a-zA-Z0-9_]+)\s*(?:#.*)?$/);
      if (trailMatch) {
        const junk = trailMatch[1];
        if (!PYTHON_VALID_FOLLOWERS.has(junk.toLowerCase())) {
          const junkIdx = line.lastIndexOf(junk);
          markers.push({
            severity: 8,
            message: `Unexpected token '${junk}' after string literal — invalid Python syntax`,
            startLineNumber: lineNum,
            startColumn: junkIdx + 1,
            endLineNumber: lineNum,
            endColumn: junkIdx + junk.length + 1,
          });
        }
      }
    }

    // ── FIX 3: Per-line unknown statement check ──
    // Catches garbage lines anywhere in the script (not just the first line)
    // e.g. line 1 is valid Python, but line 3 is pure junk text
    {
      const looksValid = PYTHON_VALID_STARTS.some((re) => re.test(trimmed));
      if (!looksValid) {
        markers.push({
          severity: 8,
          message: `Line ${lineNum}: '${trimmed.slice(0, 40)}${trimmed.length > 40 ? "…" : ""}' is not valid Python/PySpark syntax`,
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: line.length + 1,
        });
      }
    }

    // Indentation issues
    if (/^\t+ /.test(line) || /^ +\t/.test(line)) {
      markers.push({
        severity: 4,
        message: "Mixed tabs and spaces in indentation — use spaces only (PEP 8)",
        startLineNumber: lineNum,
        startColumn: 1,
        endLineNumber: lineNum,
        endColumn: line.length + 1,
      });
    }

    // PySpark API patterns
    invalidPatterns.forEach(({ pattern, message, severity = 8 }) => {
      if (!message) return;
      if (pattern.test(line)) {
        const match = line.match(pattern);
        const colStart = match ? line.indexOf(match[0]) + 1 : 1;
        markers.push({ severity, message, startLineNumber: lineNum, startColumn: colStart, endLineNumber: lineNum, endColumn: line.length + 1 });
      }
    });

    // Common PySpark API typos
    const typoPatterns = [
      { typo: /\.fliter\b/, correct: ".filter" },
      { typo: /\.selct\b/, correct: ".select" },
      { typo: /\.grouBy\b/, correct: ".groupBy" },
      { typo: /\.wtihColumn\b/, correct: ".withColumn" },
      { typo: /\.wirteStream\b/, correct: ".writeStream" },
      { typo: /sparks\s*\./, correct: "spark." },
    ];
    typoPatterns.forEach(({ typo, correct }) => {
      if (typo.test(line)) {
        const match = line.match(typo);
        const col = match ? line.indexOf(match[0]) + 1 : 1;
        markers.push({
          severity: 8,
          message: `Possible typo — did you mean '${correct}'?`,
          startLineNumber: lineNum,
          startColumn: col,
          endLineNumber: lineNum,
          endColumn: col + (match ? match[0].length : 5),
        });
      }
    });
  });

  // Unclosed brackets at EOF
  if (parenDepth > 0) markers.push({ severity: 8, message: `Unclosed parenthesis — ${parenDepth} '(' left open`, startLineNumber: parenOpenLine !== -1 ? parenOpenLine : lines.length, startColumn: 1, endLineNumber: parenOpenLine !== -1 ? parenOpenLine : lines.length, endColumn: 2 });
  if (bracketDepth > 0) markers.push({ severity: 8, message: `Unclosed bracket — ${bracketDepth} '[' left open`, startLineNumber: lines.length, startColumn: 1, endLineNumber: lines.length, endColumn: 2 });
  if (braceDepth > 0) markers.push({ severity: 8, message: `Unclosed brace — ${braceDepth} '{' left open`, startLineNumber: lines.length, startColumn: 1, endLineNumber: lines.length, endColumn: 2 });

  return markers;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function QueryClient() {
  const [queryInput, setQueryInput] = useState("");
  const [language, setLanguage] = useState<QueryLanguage>("pyspark");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<"logs" | "raw" | "table">("logs");
  const [validationMarkers, setValidationMarkers] = useState<ValidationMarker[]>([]);

  // ── Save Query modal state ────────────────────────────────────
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [saveToast, setSaveToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [historyPanelExpanded, setHistoryPanelExpanded] = useState(false);

  const { t } = useLanguage();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  // ── On mount: consume any pending query handed off from Alerts page ──
  useEffect(() => {
    const pending = savedQueriesService.consumePendingLoad();
    if (pending) {
      setQueryInput(pending.query);
      setLanguage(pending.language as QueryLanguage);
      // Give Monaco a tick to mount before validating
      setTimeout(() => {
        if (monacoRef.current && editorRef.current) {
          runValidation(pending.query, pending.language as QueryLanguage, monacoRef.current, editorRef.current);
        }
      }, 300);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dismiss toast after 3 s ───────────────────────────────────
  useEffect(() => {
    if (!saveToast) return;
    const t = setTimeout(() => setSaveToast(null), 3000);
    return () => clearTimeout(t);
  }, [saveToast]);

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

  // ── Run validation and push markers into Monaco ──────────────
  const runValidation = useCallback(
    (code: string, lang: QueryLanguage, monacoInstance: any, editorInstance: any) => {
      if (!monacoInstance || !editorInstance) return;
      const model = editorInstance.getModel();
      if (!model) return;

      const raw = lang === "sql" ? validateSQL(code) : validatePySpark(code);
      const monacoMarkers = raw.map((m) => ({
        severity: m.severity,
        message: m.message,
        startLineNumber: m.startLineNumber,
        startColumn: m.startColumn,
        endLineNumber: m.endLineNumber,
        endColumn: m.endColumn,
        source: lang === "sql" ? "SQL Validator" : "PySpark Validator",
      }));

      monacoInstance.editor.setModelMarkers(model, "queryValidator", monacoMarkers);
      setValidationMarkers(raw);
    },
    []
  );

  // Debounced validation on code change
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const code = value || "";
      setQueryInput(code);
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
      validationTimerRef.current = setTimeout(() => {
        if (monacoRef.current && editorRef.current) {
          runValidation(code, language, monacoRef.current, editorRef.current);
        }
      }, 400);
    },
    [language, runValidation]
  );

  // Re-validate when language switches
  useEffect(() => {
    if (monacoRef.current && editorRef.current && queryInput) {
      runValidation(queryInput, language, monacoRef.current, editorRef.current);
    }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep editor readOnly in sync
  useEffect(() => {
    if (editorRef.current && typeof editorRef.current.updateOptions === "function") {
      try { editorRef.current.updateOptions({ readOnly: isRunning }); } catch (e) {}
    }
  }, [isRunning]);

  const loadFromHistory = useCallback(
    (direction: "up" | "down") => {
      if (runHistory.length === 0) return;
      let newIndex = historyIndex;
      if (direction === "up") newIndex = Math.min(historyIndex + 1, runHistory.length - 1);
      else newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        const entry = runHistory[newIndex];
        setQueryInput(entry.query);
        setLanguage(entry.language);
        setTimeout(() => {
          if (monacoRef.current && editorRef.current) {
            runValidation(entry.query, entry.language, monacoRef.current, editorRef.current);
          }
        }, 0);
      } else {
        setQueryInput("");
      }
    },
    [runHistory, historyIndex, runValidation]
  );

  const applyHistoryEntry = useCallback(
    (entry: RunHistoryEntry, indexInHistory: number) => {
      setQueryInput(entry.query);
      setLanguage(entry.language);
      setHistoryIndex(indexInHistory);
      setTimeout(() => {
        if (monacoRef.current && editorRef.current) {
          runValidation(entry.query, entry.language, monacoRef.current, editorRef.current);
        }
      }, 0);
    },
    [runValidation]
  );

  const handleRun = useCallback(async () => {
    if (!queryInput.trim()) { alert("Please enter a query"); return; }

    const historyEntry: RunHistoryEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      query: queryInput,
      language,
      ranAt: Date.now(),
    };
    setRunHistory((prev) => [historyEntry, ...prev].slice(0, MAX_RUN_HISTORY));
    setHistoryIndex(-1);

    // Block execution if there are hard errors
    const hardErrors = validationMarkers.filter((m) => m.severity === 8);
    if (hardErrors.length > 0) {
      setResult(null);
      setError(
        `Cannot run query — fix ${hardErrors.length} syntax error${hardErrors.length > 1 ? "s" : ""} first:\n` +
          hardErrors.map((e) => `  Line ${e.startLineNumber}: ${e.message}`).join("\n")
      );
      return;
    }

    setIsRunning(true);
    setResult(null);
    setError(null);

    const startTime = performance.now();
    const USE_DUMMY_DATA = true;

    try {
      let data: any;

      if (USE_DUMMY_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        data = [
          { id: 1, timestamp: "2024-02-14T10:08:01Z", user: "alice@contoso.com", action: "DLP rule matched", policy: "Financial Data Protection", rule: "Block External Email with Financial Data", sensitiveInfoType: "Credit Card Number", messageSubject: "Quarterly Financial Report", recipients: ["bob@external.com"], attachment: "report.docx", actionTaken: "Blocked", override: "", location: "Exchange Online", severity: "High", source: "Purview DLP" },
          { id: 2, timestamp: "2024-02-14T10:10:22Z", user: "john.doe@contoso.com", action: "Login", source_ip: "192.168.1.100", device: "LAPTOP-ABC123", location: "Office Building A", status: "Success", mfa_used: true, risk_score: 15, source: "UEBA", severity: "Low" },
          { id: 3, timestamp: "2024-02-14T10:15:45Z", user: "jane.smith@contoso.com", url: "https://malicious-site.com/payload", action: "Blocked", urlcategory: "Malware", bytes_in: 1024, bytes_out: 2048, duration_ms: 150, threat_name: "Trojan.Generic", severity: "Critical", source: "Zscaler" },
          { id: 4, timestamp: "2024-02-14T10:20:12Z", user: "bob.jones@contoso.com", badge_id: "BADGE-1001", door_name: "Server Room 1", access_granted: false, reason: "Insufficient Permissions", employee_name: "Bob Jones", department: "IT", severity: "Medium", source: "Physical Security" },
          { id: 5, timestamp: "2024-02-14T10:25:33Z", user: "charlie@contoso.com", action: "File Download", file_name: "customer_data.xlsx", file_size_mb: 15.7, destination: "Personal OneDrive", classification: "Confidential", data_type: "PII", event_id: "evt-00123", severity: "High", source: "Purview" },
          { id: 6, timestamp: "2024-02-14T10:30:01Z", user: "diana@contoso.com", action: "Unusual Login Pattern", login_count: 15, time_window_minutes: 5, unique_ips: 8, countries: ["US", "CN", "RU"], risk_score: 92, status: "Flagged", description: "Multiple rapid logins from different geographic locations", severity: "Critical", source: "UEBA" },
          { id: 7, timestamp: "2024-02-14T10:35:18Z", user: "eve@contoso.com", url: "https://facebook.com", action: "Allowed", urlcategory: "Social Networking", bytes_in: 5120, bytes_out: 1024, duration_ms: 250, severity: "Low", source: "Zscaler" },
          { id: 8, timestamp: "2024-02-14T10:40:55Z", scanName: "Weekly Compliance Scan", dataSourceName: "Azure SQL Database", assetsDiscovered: 1247, sensitiveAssetsFound: 89, scanStatus: "Completed", scanDuration: "45 minutes", findings: ["PII detected", "Unencrypted columns"], severity: "Medium", source: "Purview" },
          { id: 9, timestamp: "2024-02-14T10:45:22Z", user: "frank@contoso.com", badge_id: "BADGE-2002", door_name: "Main Entrance", access_granted: true, employee_name: "Frank Miller", department: "Security", entry_time: "10:45:22", exit_time: null, severity: "Low", source: "Physical Security" },
          { id: 10, timestamp: "2024-02-14T10:50:00Z", user: "grace@contoso.com", action: "DLP rule matched", policy: "Healthcare Data Protection", rule: "Block PHI Sharing", sensitiveInfoType: "Social Security Number", messageSubject: "Patient Records Q1", recipients: ["external-partner@hospital.com"], actionTaken: "Blocked", override: "Medical Director Approval Required", location: "Teams", severity: "Critical", source: "Purview DLP" },
        ];
      } else {
        const response = await fetch(API_CONFIG.QUERY_ENDPOINT + "/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryInput, language, timestamp: new Date().toISOString() }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setError(`Error: ${response.statusText} - ${errorData.error || "Request failed"}`);
          return;
        }
        data = await response.json();
      }

      const executionTime = performance.now() - startTime;
      setResult({ success: true, data: Array.isArray(data) ? data : [data], execution_time: executionTime, row_count: Array.isArray(data) ? data.length : 1 });
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  }, [queryInput, language, validationMarkers]);

  // ── Save Query handlers ───────────────────────────────────────
  const openSaveModal = useCallback(() => {
    if (!queryInput.trim()) return;
    setSaveName("");
    setSaveDesc("");
    setShowSaveModal(true);
  }, [queryInput]);

  const handleSaveQuery = useCallback(() => {
    if (!saveName.trim()) return;
    try {
      savedQueriesService.save({
        name: saveName.trim(),
        description: saveDesc.trim() || undefined,
        query: queryInput,
        language,
      });
      setShowSaveModal(false);
      setSaveName("");
      setSaveDesc("");
      setSaveToast({ type: "success", msg: `Query "${saveName.trim()}" saved successfully!` });
    } catch {
      setSaveToast({ type: "error", msg: "Failed to save query. Please try again." });
    }
  }, [saveName, saveDesc, queryInput, language]);

  const handleClear = useCallback(() => {
    setQueryInput("");
    setResult(null);
    setError(null);
    setValidationMarkers([]);
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) monacoRef.current.editor.setModelMarkers(model, "queryValidator", []);
    }
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRun());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => handleClear());

    editor.updateOptions({
      minimap: { enabled: false },
      lineNumbers: "on",
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly: isRunning,
      automaticLayout: true,
      glyphMargin: true, // Required for gutter error/warning icons
    });

    if (queryInput) runValidation(queryInput, language, monaco, editor);
  };

  const loadSampleQuery = () => {
    const sample = sampleQueries[language];
    setQueryInput(sample);
    setTimeout(() => {
      if (monacoRef.current && editorRef.current) {
        runValidation(sample, language, monacoRef.current, editorRef.current);
      }
    }, 100);
  };

  // Derived counts
  const errorCount = validationMarkers.filter((m) => m.severity === 8).length;
  const warningCount = validationMarkers.filter((m) => m.severity === 4).length;
  const infoCount = validationMarkers.filter((m) => m.severity <= 2).length;

  // ── Render helpers ────────────────────────────────────────────
  const syntaxHighlightJSON = (json: string) =>
    json
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"([^"]+)":/g, '<span style="color: #dc2626;">\"$1\"</span>:')
      .replace(/: "([^"]*)"/g, ': <span style="color: #16a34a;">\"$1\"</span>')
      .replace(/: (\d+)/g, ': <span style="color: #ca8a04;">$1</span>')
      .replace(/: (true|false)/g, ': <span style="color: #2563eb;">$1</span>')
      .replace(/: (null)/g, ': <span style="color: #9333ea;">$1</span>');

  const renderLogsView = (events: any[]) => {
    if (!events || events.length === 0) return <div className="p-4 text-gray-500 dark:text-gray-400">No events found</div>;
    return (
      <div className="space-y-0">
        <div className="sticky top-0 z-10 grid grid-cols-12 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
          <div className="col-span-2">Time</div>
          <div className="col-span-10">Output</div>
        </div>
        {events.map((row, idx) => {
          const timestamp = row.timestamp || row.time || row.ts || new Date().toISOString();
          return (
            <div key={idx} className="grid grid-cols-12 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="col-span-2 border-r border-gray-200 dark:border-gray-700 px-3 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                {new Date(timestamp).toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(/(\d+)\/(\d+)\/(\d+),/, "$3-$1-$2")}
              </div>
              <div className="col-span-10 px-3 py-2">
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-200">
                  <code className="language-json" dangerouslySetInnerHTML={{ __html: syntaxHighlightJSON(JSON.stringify(row, null, 2)) }} />
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRawView = (events: any[]) => {
    if (!events || events.length === 0) return <div className="p-4 text-gray-500 dark:text-gray-400">No events found</div>;
    return (
      <div className="space-y-0">
        {events.map((row, idx) => (
          <div key={idx} className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 font-mono text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <span className="text-gray-500 dark:text-gray-400">[{idx + 1}]</span>{" "}
            <span className="text-gray-700 dark:text-gray-200">{JSON.stringify(row)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = (events: any[]) => {
    if (!events || events.length === 0) return <div className="p-4 text-gray-500 dark:text-gray-400">No events found</div>;
    const columns = Array.from(new Set(events.flatMap((row) => Object.keys(row))));
    return (
      <div className="w-full h-full overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              {columns.map((col) => (
                <th key={col} className="sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 last:border-r-0 break-words">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {columns.map((col) => {
                  const value = row[col];
                  const displayValue = value === null || value === undefined ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value);
                  return <td key={col} title={displayValue} className="border-r border-gray-200 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300 last:border-r-0 break-words max-w-[250px]">{displayValue}</td>;
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
      case "logs": return renderLogsView(events);
      case "raw": return renderRawView(events);
      case "table": return renderTableView(events);
      default: return renderLogsView(events);
    }
  };

  // ── JSX ──────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col space-y-4 overflow-x-hidden">

      {/* Language Selector & Controls */}
      <div className="flex-shrink-0 flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Language:</label>
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
          <button onClick={loadSampleQuery} disabled={isRunning} className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400">
            Load Sample
          </button>
        </div>
        <div className="text-xs text-gray-500">⌘/Ctrl+Enter to run • ⌘/Ctrl+K to clear</div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-shrink-0 rounded-lg border border-gray-300 overflow-hidden dark:border-gray-600">
        <MonacoEditor
          height="200px"
          language={language}
          value={queryInput}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          options={{
            renderLineHighlight: "none",
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
            glyphMargin: true, // Required for gutter error/warning icons
          }}
        />
      </div>

      {/* Validation Status Bar */}
      {queryInput.trim() && (
        <div className="flex-shrink-0 flex items-center gap-3 rounded-md border px-3 py-1.5 text-xs font-mono border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          {errorCount === 0 && warningCount === 0 && infoCount === 0 ? (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No issues detected
            </span>
          ) : (
            <>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {warningCount} warning{warningCount > 1 ? "s" : ""}
                </span>
              )}
              {infoCount > 0 && (
                <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {infoCount} hint{infoCount > 1 ? "s" : ""}
                </span>
              )}
            </>
          )}
          <span className="ml-auto text-gray-400 dark:text-gray-600">
            {language === "sql" ? "SQL Validator" : "PySpark Validator"} — hover underlines for details
          </span>
        </div>
      )}

      {/* Validation Problems Panel */}
      {validationMarkers.length > 0 && (
        <div className="flex-shrink-0 max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Problems ({validationMarkers.length})
          </div>
          {validationMarkers.map((m, i) => (
            <div
              key={i}
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.revealLineInCenter(m.startLineNumber);
                  editorRef.current.setPosition({ lineNumber: m.startLineNumber, column: m.startColumn });
                  editorRef.current.focus();
                }
              }}
              className="flex cursor-pointer items-start gap-2 border-b border-gray-100 dark:border-gray-800 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800/60 last:border-b-0"
            >
              {m.severity === 8 ? (
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : m.severity === 4 ? (
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-mono text-gray-400 dark:text-gray-500 flex-shrink-0">
                Ln {m.startLineNumber}, Col {m.startColumn}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{m.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex flex-wrap gap-3">
        <button
          onClick={handleRun}
          disabled={isRunning || !queryInput.trim()}
          title={errorCount > 0 ? `Fix ${errorCount} error${errorCount > 1 ? "s" : ""} before running` : ""}
          className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            errorCount > 0 ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isRunning ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorCount > 0 ? `Fix ${errorCount} Error${errorCount > 1 ? "s" : ""}` : "Run Query"}</span>
            </>
          )}
        </button>

        {/* ── Save Query Button ── */}
        <button
          onClick={openSaveModal}
          disabled={isRunning || !queryInput.trim()}
          title="Save this query to Custom Queries"
          className="flex items-center gap-2 rounded-lg border border-emerald-500 bg-white px-6 py-2.5 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:bg-gray-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span>Save Query</span>
        </button>

        <button
          onClick={handleClear}
          disabled={isRunning}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear
        </button>

        {runHistory.length > 0 && (
          <div className="flex gap-1">
            <button onClick={() => loadFromHistory("up")} disabled={isRunning || historyIndex >= runHistory.length - 1} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" title="Older run">↑</button>
            <button onClick={() => loadFromHistory("down")} disabled={isRunning || historyIndex < 0} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" title="Newer run">↓</button>
          </div>
        )}
      </div>

      {/* Recent query runs (last 10) — collapsible so results stay visible */}
      {runHistory.length > 0 && (
        <div className="min-h-0 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-900/95">
          <button
            type="button"
            onClick={() => setHistoryPanelExpanded((open) => !open)}
            aria-expanded={historyPanelExpanded}
            className="flex w-full items-center gap-3 rounded-t-xl px-4 py-2.5 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent queries</h3>
                <span className="rounded-full bg-gray-200/90 px-2 py-0.5 text-[11px] font-medium tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {runHistory.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {historyPanelExpanded ? "Click a row to load into the editor" : "Expand to browse past runs — keeps results in view"}
              </p>
            </div>
            <svg
              className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${reduceMotion ? "duration-150 ease-linear" : "duration-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)]"} ${historyPanelExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence initial={false}>
            {historyPanelExpanded && (
              <motion.div
                key="recent-queries-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: reduceMotion ? 0.01 : 0.36, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: reduceMotion ? 0.01 : 0.22, ease: "easeOut" },
                }}
                className="min-h-0 overflow-hidden border-t border-gray-200/80 dark:border-gray-700/80"
              >
                <ul
                  className="max-h-[220px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
                  role="list"
                >
                  {runHistory.map((entry, idx) => {
                    const isActive = historyIndex === idx;
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => applyHistoryEntry(entry, idx)}
                          disabled={isRunning}
                          className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActive
                              ? "bg-blue-50/90 dark:bg-blue-950/40"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/70"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300`}
                          >
                            {entry.language}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs leading-snug text-gray-800 dark:text-gray-200">{previewQueryOneLine(entry.query)}</p>
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatRunTimeAgo(entry.ranAt)}</p>
                          </div>
                          <span className="flex-shrink-0 pt-0.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-600" aria-hidden>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Save Toast notification ── */}
      {saveToast && (
        <div
          className={`flex-shrink-0 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
            saveToast.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {saveToast.type === "success" ? (
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{saveToast.msg}</span>
          <button onClick={() => setSaveToast(null)} className="ml-auto opacity-60 hover:opacity-100">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Save Query Modal ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSaveModal(false)}
          />
          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save Query</h3>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Query preview */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  language === "sql"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                }`}>
                  {language}
                </span>
                <span className="text-xs text-gray-400">{queryInput.split("\n").length} line{queryInput.split("\n").length !== 1 ? "s" : ""}</span>
              </div>
              <pre className="max-h-20 overflow-hidden font-mono text-xs text-gray-600 dark:text-gray-400 truncate whitespace-pre-wrap line-clamp-3">
                {queryInput.slice(0, 200)}{queryInput.length > 200 ? "…" : ""}
              </pre>
            </div>

            {/* Name field */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Query Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                // onKeyDown={(e) => { if (e.key === "Enter" && saveName.trim()) handleSaveQuery(); }}
                placeholder="e.g. Critical Events Last 24h"
                autoFocus
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-emerald-400"
              />
            </div>

            {/* Description field */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                placeholder="What does this query do?"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-emerald-400"
              />
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                disabled={!saveName.trim()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 dark:text-red-300">Execution Error</h4>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-sm text-red-700 dark:text-red-400">{error}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && result.success && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-shrink-0 rounded-t-lg border border-b-0 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab("logs")} className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "logs" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"}`}>Logs</button>
                <button onClick={() => setActiveTab("raw")} className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "raw" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"}`}>_raw</button>
                <button onClick={() => setActiveTab("table")} className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "table" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"}`}>Table</button>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>{result.row_count} {result.row_count === 1 ? "row" : "rows"}</span>
                {result.execution_time && <span>Executed in {(result.execution_time / 1000).toFixed(2)}s</span>}
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 rounded-b-lg border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600 overflow-hidden">
            {result.data && renderEvents(result.data)}
          </div>
        </div>
      )}
    </div>
  );
}
