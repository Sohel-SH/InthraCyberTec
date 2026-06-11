"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { API_CONFIG } from "@/config/api";
import T from "@/components/i18n/T";
import { useTheme } from "@/context/ThemeContext";
import { useApiClient } from "@/hooks/useApiClient";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

type NodeType = {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
};

type LinkType = {
  source: string;
  target: string;
};

type GraphData = {
  nodes: NodeType[];
  links: LinkType[];
};

// ─── Node type config ────────────────────────────────────────────────────────
const NODE_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  USER:     { color: '#6366f1', bg: '#eef2ff', border: '#818cf8' },
  HOSTNAME: { color: '#0ea5e9', bg: '#e0f2fe', border: '#38bdf8' },
  IP:       { color: '#10b981', bg: '#d1fae5', border: '#34d399' },
  FIREWALL: { color: '#f59e0b', bg: '#fef3c7', border: '#fbbf24' },
  EMAIL:    { color: '#ec4899', bg: '#fce7f3', border: '#f472b6' },
  WEB_URL:  { color: '#8b5cf6', bg: '#ede9fe', border: '#a78bfa' },
  UNKNOWN:  { color: '#94a3b8', bg: '#f1f5f9', border: '#cbd5e1' },
};

function getTypeConfig(type?: string) {
  if (!type) return NODE_TYPE_CONFIG.UNKNOWN;
  const key = type.toUpperCase().replace(/[\s-]/g, '_');
  return NODE_TYPE_CONFIG[key] ?? NODE_TYPE_CONFIG.UNKNOWN;
}

/**
 * Draw a type-specific icon inside the node circle using canvas primitives.
 * All coordinates are relative to (cx, cy) — the node center.
 */
function drawNodeIcon(ctx: CanvasRenderingContext2D, type: string | undefined, cx: number, cy: number, r: number) {
  const t = (type ?? '').toUpperCase().replace(/[\s-]/g, '_');
  const s = r * 0.55; // icon scale factor
  ctx.lineWidth = r * 0.13;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (t) {
    case 'USER': {
      // Head circle
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.35, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      // Body arc
      ctx.beginPath();
      ctx.arc(cx, cy + s * 0.65, s * 0.65, Math.PI, 0, false);
      ctx.fill();
      break;
    }
    case 'HOSTNAME': {
      // Monitor rectangle
      const w = s * 1.1, h = s * 0.8;
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - h / 2 - s * 0.1, w, h, r * 0.08);
      ctx.fill();
      // Stand
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2 - s * 0.1);
      ctx.lineTo(cx, cy + h / 2 + s * 0.25);
      ctx.moveTo(cx - s * 0.35, cy + h / 2 + s * 0.25);
      ctx.lineTo(cx + s * 0.35, cy + h / 2 + s * 0.25);
      ctx.stroke();
      break;
    }
    case 'IP': {
      // Network node — circle with 4 radiating dots
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      dirs.forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(cx + dx * s * 0.75, cy + dy * s * 0.75, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + dx * s * 0.32, cy + dy * s * 0.32);
        ctx.lineTo(cx + dx * s * 0.57, cy + dy * s * 0.57);
        ctx.stroke();
      });
      break;
    }
    case 'FIREWALL': {
      // Shield shape
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.85);
      ctx.lineTo(cx + s * 0.65, cy - s * 0.45);
      ctx.lineTo(cx + s * 0.65, cy + s * 0.1);
      ctx.quadraticCurveTo(cx + s * 0.65, cy + s * 0.75, cx, cy + s * 0.95);
      ctx.quadraticCurveTo(cx - s * 0.65, cy + s * 0.75, cx - s * 0.65, cy + s * 0.1);
      ctx.lineTo(cx - s * 0.65, cy - s * 0.45);
      ctx.closePath();
      ctx.fill();
      // Lock bar inside shield — draw in white/light
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.05, s * 0.22, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(cx - s * 0.28, cy - s * 0.08, s * 0.56, s * 0.45, r * 0.07);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'EMAIL': {
      // Envelope
      const ew = s * 1.1, eh = s * 0.75;
      const ex = cx - ew / 2, ey = cy - eh / 2;
      ctx.beginPath();
      ctx.roundRect(ex, ey, ew, eh, r * 0.08);
      ctx.fill();
      // Flap V
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.0)';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(ex + 2, ey + 2);
      ctx.lineTo(cx, ey + eh * 0.55);
      ctx.lineTo(ex + ew - 2, ey + 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'WEB_URL': {
      // Globe — circle with latitude/longitude lines
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = r * 0.1;
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.7, cy);
      ctx.lineTo(cx + s * 0.7, cy);
      ctx.stroke();
      // Vertical ellipse
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 0.3, s * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    default: {
      // Generic: question mark
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${s * 1.1}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', cx, cy + s * 0.05);
      ctx.restore();
      break;
    }
  }
}


import { getEncryptedStorage, setEncryptedStorage } from "@/utils/storage";

const THREAT_HUNT_STORAGE_KEY = "inthra-threat-hunt-state";

interface PersistedThreatHuntState {
  selectedUserId: string | null;
  graphData: GraphData;
  expandedNodes: string[];
}

const defaultThreatHuntState: PersistedThreatHuntState = {
  selectedUserId: null,
  graphData: { nodes: [], links: [] },
  expandedNodes: [],
};

const loadThreatHuntState = (): PersistedThreatHuntState => {
  try {
    const stored = getEncryptedStorage<PersistedThreatHuntState>(THREAT_HUNT_STORAGE_KEY);
    if (!stored) return defaultThreatHuntState;
    return { ...defaultThreatHuntState, ...stored };
  } catch {
    return defaultThreatHuntState;
  }
};

const saveThreatHuntState = (state: Partial<PersistedThreatHuntState>) => {
  try {
    const current = loadThreatHuntState();
    const next = { ...current, ...state };
    setEncryptedStorage(THREAT_HUNT_STORAGE_KEY, next);
  } catch {
    // Ignore storage errors
  }
};

export default function ThreatHunt() {
  const { resolvedTheme } = useTheme();
  const { fetchWithAuth } = useApiClient();
  const isDark = resolvedTheme === "dark";
  const [persistedState] = useState<PersistedThreatHuntState>(loadThreatHuntState);

  const [graphData, setGraphData] = useState<GraphData>(persistedState.graphData);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(persistedState.selectedUserId);
  const [initialLoading, setInitialLoading] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(persistedState.expandedNodes));
  const [topUsers, setTopUsers] = useState<Array<{ user: string; count_datetime: number; node_id: string }>>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 835, height: 600 });

  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist state changes to localStorage
  useEffect(() => {
    saveThreatHuntState({
      selectedUserId,
      graphData,
      expandedNodes: Array.from(expandedNodes),
    });
  }, [selectedUserId, graphData, expandedNodes]);

  // Update canvas size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.max(500, window.innerHeight * 0.7);
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Reheat simulation smoothly when new nodes are added
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  const USE_LOCAL_TEST_MODE = false;

  const LOCAL_GRAPH_MAP = {
    nodes: [
      { id: "host:hamsan.yektanet.com", label: "hamsan.yektanet.com", type: "HOSTNAME", flags: [], properties: { cat: "Corporate Marketing" }, source: "Zscaler_Proxy" },
      { id: "usr:CCP0001", label: "CCP0001", type: "USER", flags: [], properties: { dept: "Service Admin", loc: "Road Warrior" }, source: "Zscaler_Proxy" },
      { id: "usr:CCP0002", label: "gd", type: "USER", flags: [], properties: { dept: "Service Admin", loc: "Road Warrior" }, source: "Zscaler_Proxy" },
      { id: "ip:40.83.138.250", label: "40.83.138.250", type: "IP", flags: [], properties: {}, source: "Zscaler_Proxy" },
    ],
    edges: [
      { id: "edge001", source: "usr:CCP0001", target: "host:hamsan.yektanet.com", label: "ACCESSED", ts: "2026-02-05T16:35:04", properties: { action: "Allowed", status: "200" } },
      { id: "edge002", source: "usr:CCP0001", target: "ip:40.83.138.250", label: "USED_IP", ts: "2026-02-05T16:35:04", properties: { useragent: "Mozilla/5.0" } },
      { id: "edge003", source: "usr:CCP0002", target: "ip:93.137.163.165", label: "USED_IP", ts: "2026-02-05T16:35:04", properties: { useragent: "Mozilla/5.0" } },
      { id: "edge004", source: "usr:CCP0002", target: "host:hamsan.yektanet.com", label: "ACCESSED", ts: "2026-02-05T16:35:04", properties: { action: "Allowed", status: "200" } },
    ]
  };

  const LOCAL_TOP_USERS = [
    { user: "CCP0001", count_datetime: 158, node_id: "usr:CCP0001" },
    { user: "CCP0002", count_datetime: 136, node_id: "usr:CCP0002" },
    { user: "CCP0003", count_datetime: 131, node_id: "usr:CCP0003" },
    { user: "CCP0004", count_datetime: 125, node_id: "usr:CCP0004" },
    { user: "CCP0005", count_datetime: 118, node_id: "usr:CCP0005" },
    { user: "CCP0006", count_datetime: 104, node_id: "usr:CCP0006" },
    { user: "CCP0007", count_datetime: 97,  node_id: "usr:CCP0007" },
    { user: "CCP0008", count_datetime: 89,  node_id: "usr:CCP0008" },
    { user: "CCP0009", count_datetime: 76,  node_id: "usr:CCP0009" },
    { user: "CCP0010", count_datetime: 61,  node_id: "usr:CCP0010" },
  ];

  useEffect(() => {
    const loadTopUsers = async () => {
      if (USE_LOCAL_TEST_MODE) {
        setTopUsers(LOCAL_TOP_USERS);
        return;
      }
      try {
        const res = await fetchWithAuth(API_CONFIG.QUERY_ENDPOINT + "/api/users/top", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to fetch top users: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setTopUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load top users:", e);
        setTopUsers([]);
      }
    };
    loadTopUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mergeGraphData = useCallback((oldData: GraphData, newData: GraphData) => {
    const nodeMap = new Map(oldData.nodes.map(n => [n.id, n]));
    newData.nodes.forEach(n => { if (!nodeMap.has(n.id)) nodeMap.set(n.id, n); });
    const linkSet = new Set(oldData.links.map(l => `${l.source}->${l.target}`));
    const newLinks: LinkType[] = [];
    newData.links.forEach(l => {
      const key = `${l.source}->${l.target}`;
      if (!linkSet.has(key)) { linkSet.add(key); newLinks.push(l); }
    });
    return { nodes: Array.from(nodeMap.values()), links: [...oldData.links, ...newLinks] };
  }, []);

  const fetchGraph = useCallback(async (nodeId: string, expand = false) => {
    if (expand) setExpanding(true);
    else setInitialLoading(true);
    setError(null);

    try {
      let data: any;
      if (USE_LOCAL_TEST_MODE) {
        data = LOCAL_GRAPH_MAP;
      } else {
        const res = await fetchWithAuth(API_CONFIG.QUERY_ENDPOINT + "/api/graph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node_id: nodeId }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
        data = await res.json();
      }

      setRawResponse(data);

      const allNodes: any[] = Array.isArray(data.nodes) ? data.nodes : [];
      const allEdges: any[] = Array.isArray(data.edges) ? data.edges : [];

      let relevantNodes: any[];
      let links: LinkType[];

      if (expand) {
        const relevantEdges = allEdges.filter((e: any) => e.source === nodeId || e.target === nodeId);
        const connectedIds = new Set<string>([nodeId]);
        relevantEdges.forEach((e: any) => { connectedIds.add(e.source); connectedIds.add(e.target); });

        const foundNodes = allNodes.filter((n: any) => connectedIds.has(n.id));
        const foundNodeIds = new Set(foundNodes.map((n: any) => n.id));
        const placeholderNodes = Array.from(connectedIds)
          .filter(id => !foundNodeIds.has(id))
          .map(id => ({
            id,
            label: id.includes(':') ? id.split(':').slice(1).join(':') : id,
            type: id.includes(':') ? id.split(':')[0].toUpperCase() : 'UNKNOWN',
          }));

        relevantNodes = [...foundNodes, ...placeholderNodes];
        links = relevantEdges.map((e: any) => ({ source: e.source, target: e.target }));
      } else {
        relevantNodes = allNodes.filter((n: any) => n.id === nodeId);
        links = [];
      }

      const normalized: GraphData = {
        nodes: relevantNodes.map((n: any) => ({
          id: String(n.id),
          label: n.label ?? String(n.id),
          type: n.type,
        })),
        links,
      };

      if (expand) {
        setGraphData(prev => mergeGraphData(prev, normalized));
        setExpandedNodes(prev => new Set(prev).add(nodeId));
      } else {
        setGraphData(normalized);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to load graph';
      setError(errorMsg);
      console.error('Graph fetch error:', e);
    } finally {
      setInitialLoading(false);
      setExpanding(false);
    }
  }, [mergeGraphData]);

  const handleNodeClick = useCallback((node: NodeType) => {
    if (!expandedNodes.has(node.id)) {
      if (containerRef.current) containerRef.current.style.cursor = 'wait';
      fetchGraph(node.id, true).finally(() => {
        if (containerRef.current) containerRef.current.style.cursor = 'default';
      });
    }
  }, [expandedNodes, fetchGraph]);

  // ─── Node renderer ──────────────────────────────────────────────────────────
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isExpanded = expandedNodes.has(node.id);
    const cfg = getTypeConfig(node.type);
    // Larger base node sizes — divided by globalScale so they stay consistent in world units
    const r = (isExpanded ? 20 : 15) / globalScale;
    const cx: number = node.x;
    const cy: number = node.y;

    // Glow / shadow ring for expanded nodes
    if (isExpanded) {
      ctx.save();
      ctx.shadowColor = cfg.color + '88';
      ctx.shadowBlur = 16 / globalScale;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3 / globalScale, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color + '18';
      ctx.fill();
      ctx.restore();
    }

    // Outer border ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = cfg.border;
    ctx.fill();

    // Inner filled circle
    const borderW = 2.5 / globalScale;
    const innerR = r - borderW;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = cfg.bg;
    ctx.fill();

    // Icon in the node's main color
    ctx.save();
    ctx.fillStyle = cfg.color;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = r * 0.12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawNodeIcon(ctx, node.type, cx, cy, innerR);
    ctx.restore();

    // Label — font size is purely world-space (scales with zoom naturally)
    // Keep it noticeably smaller than the node radius
    const fontSize = r * 0.55;
    ctx.font = `${isExpanded ? '600' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    const label = node.label;
    const textWidth = ctx.measureText(label).width;
    const padH = fontSize * 0.4;
    const padV = fontSize * 0.3;
    const bgW = textWidth + padH * 2;
    const bgH = fontSize + padV * 2;
    const bgX = cx - bgW / 2;
    const bgY = cy + r + 3 / globalScale;

    // Pill background
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bgX, bgY, bgW, bgH, bgH / 2);
    } else {
      ctx.rect(bgX, bgY, bgW, bgH);
    }
    ctx.fillStyle = isExpanded ? cfg.color : (isDark ? 'rgba(20,24,35,0.90)' : 'rgba(255,255,255,0.93)');
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isExpanded ? '#ffffff' : (isDark ? '#e2e8f0' : cfg.color);
    ctx.fillText(label, cx, bgY + bgH / 2);

    // Small amber dot = unexpanded indicator (top-right of node)
    if (!isExpanded) {
      const dotR = r * 0.2;
      ctx.beginPath();
      ctx.arc(cx + r * 0.7, cy - r * 0.7, dotR, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#0f1117' : '#ffffff';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }
  }, [expandedNodes, isDark]);

  // ─── Legend ─────────────────────────────────────────────────────────────────
  const LEGEND_ITEMS = [
    { type: 'USER',     label: 'User' },
    { type: 'HOSTNAME', label: 'Hostname' },
    { type: 'IP',       label: 'IP Address' },
    { type: 'FIREWALL', label: 'Firewall' },
    { type: 'EMAIL',    label: 'Email' },
    { type: 'WEB_URL',  label: 'Web URL' },
  ];

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-2xl font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          <T k="threatHunt.title" />
        </h3>

        <div className="flex gap-6">
          {/* Sidebar List */}
          <div
            className="w-1/4 p-4 rounded"
            style={{
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
            }}
          >
            <h4 className="mb-3 font-semibold text-gray-800 dark:text-white/90">Top 10 High Risk</h4>
            {topUsers.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No users</div>
            ) : (
              <div className="space-y-1">
                {topUsers.map(u => {
                  const isSelected = selectedUserId === u.node_id;
                  return (
                    <button
                      key={u.user}
                      onClick={() => {
                        setSelectedUserId(u.node_id);
                        setGraphData({ nodes: [], links: [] });
                        setExpandedNodes(new Set());
                        fetchGraph(u.node_id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isSelected 
                          ? 'text-white bg-gradient-to-r from-[#37C7DA] to-[#5452EB] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.13)]' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#37C7DA] hover:to-[#5452EB] hover:shadow-[0px_4px_10px_0px_rgba(0,0,0,0.13)]'
                      }`}
                    >
                      {u.user}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4" style={{ borderTop: isDark ? '1px solid #374151' : '1px solid #e5e7eb' }}>
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Node Types</h5>
              <div className="space-y-1.5">
                {LEGEND_ITEMS.map(({ type, label }) => {
                  const cfg = getTypeConfig(type);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: cfg.bg,
                          border: `2px solid ${cfg.border}`,
                          flexShrink: 0,
                        }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 pt-1">
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Unexpanded node</span>
                </div>
              </div>
            </div>
          </div>

          {/* Graph Area */}
          <div className="w-3/4" ref={containerRef}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300 mb-3">
                Error: {error}
              </div>
            )}

            <div
              style={{
                position: 'relative',
                height: '70vh',
                minHeight: 500,
                width: '100%',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
              }}
            >
              {graphData.nodes.length === 0 && !initialLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm pointer-events-none">
                  {selectedUserId ? 'No graph data available' : 'Select a user to view the graph'}
                </div>
              )}
              {initialLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm pointer-events-none">
                  Loading graph…
                </div>
              )}
              {expanding && (
                <div style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 10,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
                  borderRadius: '8px', padding: '4px 10px', fontSize: '12px',
                  color: isDark ? '#94a3b8' : '#475569', boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                }}>
                  Expanding…
                </div>
              )}

              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                width={canvasSize.width}
                height={canvasSize.height}
                nodeLabel=""
                nodeRelSize={6}
                nodeVal={(node: any) => expandedNodes.has(node.id) ? 26 : 15}
                nodeCanvasObject={nodeCanvasObject}
                nodeCanvasObjectMode={() => 'replace'}
                nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const isExpanded = expandedNodes.has(node.id);
                  const r = (isExpanded ? 20 : 15) / globalScale;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
                  ctx.fillStyle = color;
                  ctx.fill();
                }}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkWidth={1.5}
                linkColor={() => isDark ? '#334155' : '#cbd5e1'}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.004}
                linkDirectionalParticleColor={() => '#6366f1'}
                onNodeClick={(node) => handleNodeClick(node as NodeType)}
                enableNodeDrag={true}
                enableZoomInteraction={true}
                enablePanInteraction={true}
                d3AlphaDecay={0.015}
                d3VelocityDecay={0.2}
                d3AlphaMin={0.001}
                warmupTicks={0}
                cooldownTicks={200}
                cooldownTime={15000}
              />
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">
                <div>Nodes: {graphData.nodes.length}</div>
                <div>Links: {graphData.links.length}</div>
                <div>Expanded: {expandedNodes.size}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
