"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { API_CONFIG } from "@/config/api";
import T from "@/components/i18n/T";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

type NodeType = {
  id: string;
  label: string;
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


export default function ThreatHunt() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [initialLoading, setInitialLoading] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [topUsers, setTopUsers] = useState<Array<{ user: string; count_datetime: number; node_id: string }>>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 835, height: 600 });

  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      // Restart the force simulation with smooth animation
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
      const res = await fetch(API_CONFIG.QUERY_ENDPOINT + "/api/users/top", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch top users: ${res.status} ${res.statusText}`);
      }

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

  // Helper to merge new nodes/links into existing graph
  const mergeGraphData = useCallback((oldData: GraphData, newData: GraphData) => {
    const nodeMap = new Map(oldData.nodes.map(n => [n.id, n]));
    newData.nodes.forEach(n => {
      if (!nodeMap.has(n.id)) {
        nodeMap.set(n.id, n);
      }
    });
    
    const linkSet = new Set(oldData.links.map(l => `${l.source}->${l.target}`));
    const newLinks: LinkType[] = [];
    
    newData.links.forEach(l => {
      const key = `${l.source}->${l.target}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        newLinks.push(l);
      }
    });
    
    return {
      nodes: Array.from(nodeMap.values()),
      links: [...oldData.links, ...newLinks]
    };
  }, []);

  // Fetch graph data for a node
  // const fetchGraph = useCallback(async (nodeId: string, expand = false) => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     let data: any;
      
  //     if (USE_LOCAL_TEST_MODE) {
  //       // Local test mode: use the full graph data
  //       data = LOCAL_GRAPH_MAP;
  //       console.log('Using local test data for node:', nodeId);
  //     } else {
  //       // Real API call
  //       const res = await fetch(API_CONFIG.QUERY_ENDPOINT + "/api/graph" + "?node_id=" + nodeId, {
  //         method: 'GET',
  //         headers: { 'Content-Type': 'application/json' }
  //       });

  //       if (!res.ok) {
  //         throw new Error(`API error: ${res.status} ${res.statusText}`);
  //       }

  //       data = await res.json();
  //     }
      
  //     // Preserve raw response for testing/inspection
  //     setRawResponse(data);

  //     // Normalize response: accept either `links` or `edges` (with src/dst)
  //     const allNodes = Array.isArray(data.nodes) ? data.nodes : [];
  //     let allEdges: any[] = [];
  //     if (Array.isArray(data.links)) allEdges = data.links;
  //     else if (Array.isArray(data.edges)) allEdges = data.edges;

  //     let relevantNodes: any[];
  //     let links: any[];

  //     if (expand) {
  //       // When expanding: show the node and its direct neighbors
  //       const relevantEdges = allEdges.filter((e: any) => {
  //         const src = e.src ?? e.source;
  //         const dst = e.dst ?? e.target;
  //         return src === nodeId || dst === nodeId;
  //       });

  //       // Get IDs of nodes connected to the clicked node
  //       const connectedNodeIds = new Set<string>([nodeId]);
  //       relevantEdges.forEach((e: any) => {
  //         const src = e.src ?? e.source;
  //         const dst = e.dst ?? e.target;
  //         connectedNodeIds.add(src);
  //         connectedNodeIds.add(dst);
  //       });

  //       // Filter nodes to only include the clicked node and its neighbors
  //       relevantNodes = allNodes.filter((n: any) => connectedNodeIds.has(n.id));

  //       // Convert edges to links format
  //       links = relevantEdges.map((e: any) => ({
  //         source: e.src ?? e.source,
  //         target: e.dst ?? e.target
  //       }));
  //     } else {
  //       // Initial load: show only the single node, no connections
  //       relevantNodes = allNodes.filter((n: any) => n.id === nodeId);
  //       links = [];
  //     }

  //     // Validate normalized data
  //     if (!Array.isArray(relevantNodes)) {
  //       throw new Error('Invalid graph data format');
  //     }

  //     const normalized = {
  //       nodes: relevantNodes.map((n: any) => ({ 
  //         id: String(n.id), 
  //         label: n.label ?? String(n.id),
  //         type: n.type 
  //       })),
  //       links
  //     };

  //     if (expand) {
  //       setGraphData(prev => mergeGraphData(prev, normalized));
  //     } else {
  //       setGraphData(normalized);
  //     }

  //     // Don't mark as expanded on initial load, only when actually expanding
  //     if (expand) {
  //       setExpandedNodes(prev => new Set(prev).add(nodeId));
  //     }
  //   } catch (e) {
  //     const errorMsg = e instanceof Error ? e.message : 'Failed to load graph';
  //     setError(errorMsg);
  //     console.error('Graph fetch error:', e);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [mergeGraphData]);

  const fetchGraph = useCallback(async (nodeId: string, expand = false) => {
    if (expand) {
      setExpanding(true);
    } else {
      setInitialLoading(true);
    }
    setError(null);

    try {
      let data: any;

      if (USE_LOCAL_TEST_MODE) {
        data = LOCAL_GRAPH_MAP;
      } else {
        const res = await fetch("http://localhost:8000/api/graph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node_id: nodeId }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        data = await res.json();
      }

      setRawResponse(data);

      const allNodes: any[] = Array.isArray(data.nodes) ? data.nodes : [];
      const allEdges: any[] = Array.isArray(data.edges) ? data.edges : [];

      let relevantNodes: any[];
      let links: LinkType[];

      if (expand) {
        const relevantEdges = allEdges.filter((e: any) =>
          e.source === nodeId || e.target === nodeId
        );

        const connectedIds = new Set<string>([nodeId]);
        relevantEdges.forEach((e: any) => {
          connectedIds.add(e.source);
          connectedIds.add(e.target);
        });

        // Nodes that exist in the response
        const foundNodes = allNodes.filter((n: any) => connectedIds.has(n.id));
        const foundNodeIds = new Set(foundNodes.map((n: any) => n.id));

        // ✅ Create placeholder nodes for any IDs referenced in edges but missing from nodes array
        const placeholderNodes = Array.from(connectedIds)
          .filter(id => !foundNodeIds.has(id))
          .map(id => ({
            id,
            // Derive a readable label: strip prefix like "usr:", "host:", "ip:"
            label: id.includes(':') ? id.split(':').slice(1).join(':') : id,
            type: id.includes(':') ? id.split(':')[0].toUpperCase() : 'UNKNOWN',
          }));

        relevantNodes = [...foundNodes, ...placeholderNodes];
        links = relevantEdges.map((e: any) => ({
          source: e.source,
          target: e.target,
        }));
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

  // Handle node click to expand
  const handleNodeClick = useCallback((node: NodeType) => {
    if (!expandedNodes.has(node.id)) {
      // Set wait cursor on the graph container
      if (containerRef.current) {
        containerRef.current.style.cursor = 'wait';
      }
      fetchGraph(node.id, true).finally(() => {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      });
    }
  }, [expandedNodes, fetchGraph]);

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          <T k="threatHunt.title" />
        </h3>
        
        <div className="flex gap-6">
          {/* Sidebar List */}
          <div className="w-1/4 p-4 bg-gray-50 dark:bg-gray-900 rounded" 
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}
          >
            <h4 className="mb-3 font-semibold">Top 10 High Risk</h4>
            {topUsers.length === 0 ? (
              <div className="text-sm text-gray-500">No users</div>
            ) : (
              <div className="space-y-2">
                {topUsers.map(u => (
                  <button
                    key={u.user}
                    onClick={() => {
                      setGraphData({ nodes: [], links: [] });
                      setExpandedNodes(new Set());
                      fetchGraph(u.node_id);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {u.user}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Graph Area */}
          <div className="w-3/4" ref={containerRef}>
            {/* Error Display */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                Error: {error}
              </div>
            )}

            {/* Initial Loading — only shown before any graph is rendered */}
            {initialLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-gray-600 dark:text-gray-400">Loading graph...</div>
              </div>
            )}

            {/* Empty state */}
            {!initialLoading && !error && graphData.nodes.length === 0 && (
              <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                No graph data available
              </div>
            )}

            {/* Graph Canvas — stays mounted, no layout shift */}
            {/* ✅ expanding spinner overlaid, not replacing the canvas */}
            <div
              style={{
                display: graphData.nodes.length > 0 ? 'block' : 'none',
                position: 'relative',
                height: '70vh',
                minHeight: 500,
                width: '100%',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fafafa'
              }}
              className="dark:border-gray-700 dark:bg-gray-900/50"
            >
              {/* Subtle overlay spinner during expansion — doesn't shift layout */}
              {expanding && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 10,
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: '#475569',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                }}>
                  Expanding…
                </div>
              )}

              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                width={canvasSize.width}
                height={canvasSize.height}
                nodeLabel="label"
                nodeRelSize={8}
                nodeVal={(node: any) => expandedNodes.has(node.id) ? 12 : 8}
                nodeColor={(node: any) => expandedNodes.has(node.id) ? '#3b82f6' : '#94a3b8'}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.label;
                  const fontSize = 12 / globalScale;
                  const nodeRadius = (expandedNodes.has(node.id) ? 12 : 8) / globalScale;

                  ctx.beginPath();
                  ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = expandedNodes.has(node.id) ? '#3b82f6' : '#94a3b8';
                  ctx.fill();
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 2 / globalScale;
                  ctx.stroke();

                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth + fontSize * 0.4, fontSize + fontSize * 0.4];

                  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                  ctx.fillRect(
                    node.x - bckgDimensions[0] / 2,
                    node.y + nodeRadius + 5 / globalScale,
                    bckgDimensions[0],
                    bckgDimensions[1]
                  );

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = expandedNodes.has(node.id) ? '#1e40af' : '#475569';
                  ctx.fillText(label, node.x, node.y + nodeRadius + 7 / globalScale);

                  if (!expandedNodes.has(node.id)) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, nodeRadius * 0.4, 0, 2 * Math.PI, false);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 1.5 / globalScale;
                    ctx.stroke();

                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 1.5 / globalScale;
                    ctx.beginPath();
                    ctx.moveTo(node.x - nodeRadius * 0.2, node.y);
                    ctx.lineTo(node.x + nodeRadius * 0.2, node.y);
                    ctx.moveTo(node.x, node.y - nodeRadius * 0.2);
                    ctx.lineTo(node.x, node.y + nodeRadius * 0.2);
                    ctx.stroke();
                  }
                }}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkWidth={2}
                linkColor={() => '#cbd5e1'}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.004}
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
          
            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">
                <div>Nodes: {graphData.nodes.length}</div>
                <div>links: {graphData.links.length}</div>
                <div>Expanded: {expandedNodes.size}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}