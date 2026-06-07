// ============================================================
//  savedQueriesService.ts
//
//  Data-access layer for "Saved Queries".
//
//  CURRENT BACKEND : localStorage (browser)
//
//  FUTURE BACKEND  : FastAPI
//  When your FastAPI is ready, replace each method's body
//  with a fetch() call to the corresponding endpoint:
//
//    GET    /api/saved-queries          → getAll()
//    POST   /api/saved-queries          → save()
//    PUT    /api/saved-queries/:id      → update()
//    DELETE /api/saved-queries/:id      → remove()
//
//  Note: Every outbound HTTP request targeting the Backend API 
//  must include the token in the headers:
//  Authorization: Bearer <YOUR_JWT_TOKEN>
//
//  Recommended: If calling from a React component, use the 
//  `useApiClient` hook to automatically handle headers.
//
//  The interface and method signatures stay the same, so the
//  rest of the codebase won't need any changes.
// ============================================================

// ── Types ────────────────────────────────────────────────────

export type QueryLanguage = "sql" | "pyspark";

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  language: QueryLanguage;
  createdAt: string;   // ISO-8601
  updatedAt?: string;  // ISO-8601, set on edit
}

export interface CreateSavedQueryPayload {
  name: string;
  description?: string;
  query: string;
  language: QueryLanguage;
}

export interface UpdateSavedQueryPayload {
  name?: string;
  description?: string;
  query?: string;
  language?: QueryLanguage;
}

// ── Internal localStorage key ─────────────────────────────────
const STORAGE_KEY = "inthra_saved_queries";

// ── Pending-load key ──────────────────────────────────────────
//  Used to hand a saved query from the Alerts page → Query page.
//  The Query page reads & clears this on mount.
const PENDING_LOAD_KEY = "inthra_pending_query_load";

// ── Helpers ───────────────────────────────────────────────────

/** Read the entire saved-query list from localStorage. */
function readAll(): SavedQuery[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist the entire list back to localStorage. */
function writeAll(queries: SavedQuery[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
}

/** Generate a simple unique id (crypto.randomUUID when available). */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `sq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Public Service API ────────────────────────────────────────

/**
 * Return all saved queries, newest first.
 *
 * FastAPI swap-in:
 *   const res = await fetch("/api/saved-queries");
 *   return res.json();
 */
function getAll(): SavedQuery[] {
  const queries = readAll();
  return [...queries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Save a new query and return the created record.
 *
 * FastAPI swap-in:
 *   const res = await fetch("/api/saved-queries", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(payload),
 *   });
 *   return res.json();
 */
function save(payload: CreateSavedQueryPayload): SavedQuery {
  const queries = readAll();
  const newQuery: SavedQuery = {
    id: generateId(),
    name: payload.name.trim(),
    description: payload.description?.trim(),
    query: payload.query,
    language: payload.language,
    createdAt: new Date().toISOString(),
  };
  writeAll([...queries, newQuery]);
  return newQuery;
}

/**
 * Update an existing saved query by id.
 * Returns the updated record, or null if not found.
 *
 * FastAPI swap-in:
 *   const res = await fetch(`/api/saved-queries/${id}`, {
 *     method: "PUT",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(updates),
 *   });
 *   return res.json();
 */
function update(id: string, updates: UpdateSavedQueryPayload): SavedQuery | null {
  const queries = readAll();
  const idx = queries.findIndex((q) => q.id === id);
  if (idx === -1) return null;

  const updated: SavedQuery = {
    ...queries[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  queries[idx] = updated;
  writeAll(queries);
  return updated;
}

/**
 * Delete a saved query by id.
 * Returns true if deleted, false if not found.
 *
 * FastAPI swap-in:
 *   const res = await fetch(`/api/saved-queries/${id}`, {
 *     method: "DELETE",
 *   });
 *   return res.ok;
 */
function remove(id: string): boolean {
  const queries = readAll();
  const filtered = queries.filter((q) => q.id !== id);
  if (filtered.length === queries.length) return false;
  writeAll(filtered);
  return true;
}

/**
 * Find a single saved query by id.
 *
 * FastAPI swap-in:
 *   const res = await fetch(`/api/saved-queries/${id}`);
 *   return res.ok ? res.json() : null;
 */
function getById(id: string): SavedQuery | null {
  return readAll().find((q) => q.id === id) ?? null;
}

// ── Pending-load helpers (cross-page query hand-off) ──────────

/**
 * Signal the Query page to load a specific saved query on next mount.
 * Called from the Alerts / Custom-Queries tab when the user clicks
 * "Open in Query Editor".
 */
function setPendingLoad(query: SavedQuery): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify(query));
}

/**
 * The Query page calls this on mount.
 * Returns the pending query (if any) and clears it immediately.
 */
function consumePendingLoad(): SavedQuery | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_LOAD_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(PENDING_LOAD_KEY);
    return JSON.parse(raw) as SavedQuery;
  } catch {
    window.localStorage.removeItem(PENDING_LOAD_KEY);
    return null;
  }
}

// ── Named export (service object) ────────────────────────────

export const savedQueriesService = {
  getAll,
  save,
  update,
  remove,
  getById,
  setPendingLoad,
  consumePendingLoad,
} as const;
