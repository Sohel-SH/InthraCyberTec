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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [topUsers, setTopUsers] = useState<Array<{ user: string; risk_score?: number }>>([
    { user: 'CCP0001', risk_score: 95 }
  ]);
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

  // ============================================================================
  // TEST MODE CONFIGURATION
  // ============================================================================
  // Set USE_LOCAL_TEST_MODE = true to use LOCAL_GRAPH_MAP test data
  // Set USE_LOCAL_TEST_MODE = false to use real API calls
  // When switching to API mode, the code will automatically call:
  //   - Endpoint: API_CONFIG.QUERY_ENDPOINT
  //   - Method: API_CONFIG.METHOD (default: POST)
  //   - Body: { node_id: nodeId }
  // ============================================================================
  const USE_LOCAL_TEST_MODE = false;

  // Local graph data for testing - matches your API response format exactly
  // Your API should return data in this exact format:
  // {
  //   nodes: [{ id, type, label }, ...],
  //   edges: [{ src, dst, type, timestamp, properties }, ...]
  // }
  const LOCAL_GRAPH_MAP = {
    nodes: [
      { id: "40.83.138.250", type: "IP", label: "40.83.138.250" },
      { id: "CCP0001", type: "User", label: "CCP0001" },
      { id: "Service Admin", type: "Department", label: "Service Admin" },
      { id: "hamsan.yektanet.com", type: "WebDomain", label: "hamsan.yektanet.com" },
      { id: "cdn.example.org", type: "WebDomain", label: "cdn.example.org" },
      { id: "192.0.2.45", type: "IP", label: "192.0.2.45" },
      { id: "ISP-Example", type: "ISP", label: "ISP-Example" },
      { id: "Geo-US", type: "Location", label: "Geo-US" },
      { id: "admin.jane", type: "User", label: "admin.jane" },
      { id: "admin.bob", type: "User", label: "admin.bob" }
    ],
    edges: [
      { src: "CCP0001", dst: "hamsan.yektanet.com", type: "ACCESSED_URL", timestamp: "2021-06-17T09:23:16+00:00", properties: '{"status":"200","requestsize":"574","responsesize":"65","transactionsize":"639","pagerisk":"0"}' },
      { src: "CCP0001", dst: "40.83.138.250", type: "USED_IP", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' },
      { src: "CCP0001", dst: "Service Admin", type: "MEMBER_OF", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' },
      { src: "hamsan.yektanet.com", dst: "cdn.example.org", type: "REDIRECTS_TO", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' },
      { src: "hamsan.yektanet.com", dst: "192.0.2.45", type: "RESOLVES_TO", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' },
      { src: "40.83.138.250", dst: "ISP-Example", type: "PROVIDED_BY", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' },
      { src: "40.83.138.250", dst: "Geo-US", type: "LOCATED_IN", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' },
      { src: "admin.jane", dst: "Service Admin", type: "MEMBER_OF", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' },
      { src: "admin.bob", dst: "Service Admin", type: "MEMBER_OF", timestamp: "2021-06-17T09:23:16+00:00", properties: '{}' }
    ]
  };

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
  const fetchGraph = useCallback(async (nodeId: string, expand = false) => {
    setLoading(true);
    setError(null);

    try {
      let data: any;
      
      if (USE_LOCAL_TEST_MODE) {
        // Local test mode: use the full graph data
        data = LOCAL_GRAPH_MAP;
        console.log('Using local test data for node:', nodeId);
      } else {
        // Real API call
        const res = await fetch(API_CONFIG.QUERY_ENDPOINT + "/api/graph" + "?node_id=" + nodeId, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        data = await res.json();
      }
      
      // Preserve raw response for testing/inspection
      setRawResponse(data);

      // Normalize response: accept either `links` or `edges` (with src/dst)
      const allNodes = Array.isArray(data.nodes) ? data.nodes : [];
      let allEdges: any[] = [];
      if (Array.isArray(data.links)) allEdges = data.links;
      else if (Array.isArray(data.edges)) allEdges = data.edges;

      let relevantNodes: any[];
      let links: any[];

      if (expand) {
        // When expanding: show the node and its direct neighbors
        const relevantEdges = allEdges.filter((e: any) => {
          const src = e.src ?? e.source;
          const dst = e.dst ?? e.target;
          return src === nodeId || dst === nodeId;
        });

        // Get IDs of nodes connected to the clicked node
        const connectedNodeIds = new Set<string>([nodeId]);
        relevantEdges.forEach((e: any) => {
          const src = e.src ?? e.source;
          const dst = e.dst ?? e.target;
          connectedNodeIds.add(src);
          connectedNodeIds.add(dst);
        });

        // Filter nodes to only include the clicked node and its neighbors
        relevantNodes = allNodes.filter((n: any) => connectedNodeIds.has(n.id));

        // Convert edges to links format
        links = relevantEdges.map((e: any) => ({
          source: e.src ?? e.source,
          target: e.dst ?? e.target
        }));
      } else {
        // Initial load: show only the single node, no connections
        relevantNodes = allNodes.filter((n: any) => n.id === nodeId);
        links = [];
      }

      // Validate normalized data
      if (!Array.isArray(relevantNodes)) {
        throw new Error('Invalid graph data format');
      }

      const normalized = {
        nodes: relevantNodes.map((n: any) => ({ 
          id: String(n.id), 
          label: n.label ?? String(n.id),
          type: n.type 
        })),
        links
      };

      if (expand) {
        setGraphData(prev => mergeGraphData(prev, normalized));
      } else {
        setGraphData(normalized);
      }

      // Don't mark as expanded on initial load, only when actually expanding
      if (expand) {
        setExpandedNodes(prev => new Set(prev).add(nodeId));
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to load graph';
      setError(errorMsg);
      console.error('Graph fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [mergeGraphData]);

    const expandGraph = useCallback(async (nodeId: string, expand = false) => {
    setLoading(true);
    setError(null);

    try {
      let data: any;
      
      if (USE_LOCAL_TEST_MODE) {
        // Local test mode: use the full graph data
        data = LOCAL_GRAPH_MAP;
        console.log('Using local test data for node:', nodeId);
      } else {
        // Real API call
        const res = await fetch(API_CONFIG.QUERY_ENDPOINT + "/api/graph/expand" + "?node_id=" + nodeId, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        data = await res.json();
      }
      
      // Preserve raw response for testing/inspection
      setRawResponse(data);

      // Normalize response: accept either `links` or `edges` (with src/dst)
      const allNodes = Array.isArray(data.nodes) ? data.nodes : [];
      let allEdges: any[] = [];
      if (Array.isArray(data.links)) allEdges = data.links;
      else if (Array.isArray(data.edges)) allEdges = data.edges;

      let relevantNodes: any[];
      let links: any[];

      if (expand) {
        // When expanding: show the node and its direct neighbors
        const relevantEdges = allEdges.filter((e: any) => {
          const src = e.src ?? e.source;
          const dst = e.dst ?? e.target;
          return src === nodeId || dst === nodeId;
        });

        // Get IDs of nodes connected to the clicked node
        const connectedNodeIds = new Set<string>([nodeId]);
        relevantEdges.forEach((e: any) => {
          const src = e.src ?? e.source;
          const dst = e.dst ?? e.target;
          connectedNodeIds.add(src);
          connectedNodeIds.add(dst);
        });

        // Filter nodes to only include the clicked node and its neighbors
        relevantNodes = allNodes.filter((n: any) => connectedNodeIds.has(n.id));

        // Convert edges to links format
        links = relevantEdges.map((e: any) => ({
          source: e.src ?? e.source,
          target: e.dst ?? e.target
        }));
      } else {
        // Initial load: show only the single node, no connections
        relevantNodes = allNodes.filter((n: any) => n.id === nodeId);
        links = [];
      }

      // Validate normalized data
      if (!Array.isArray(relevantNodes)) {
        throw new Error('Invalid graph data format');
      }

      const normalized = {
        nodes: relevantNodes.map((n: any) => ({ 
          id: String(n.id), 
          label: n.label ?? String(n.id),
          type: n.type 
        })),
        links
      };

      if (expand) {
        setGraphData(prev => mergeGraphData(prev, normalized));
      } else {
        setGraphData(normalized);
      }

      // Don't mark as expanded on initial load, only when actually expanding
      if (expand) {
        setExpandedNodes(prev => new Set(prev).add(nodeId));
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to load graph';
      setError(errorMsg);
      console.error('Graph fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [mergeGraphData]);

  // Initial load removed — now triggered by user input/button

  // Using hardcoded top user list for now

  // Handle node click to expand
  const handleNodeClick = useCallback((node: NodeType) => {
    if (!expandedNodes.has(node.id)) {
      console.log('Expanding node:', node.id);
      expandGraph(node.id, true);
    }
  }, [expandedNodes, expandGraph]);

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
                      fetchGraph(u.user);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {u.user} {u.risk_score ? `(${u.risk_score})` : null}
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

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-gray-600 dark:text-gray-400">Loading graph...</div>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && graphData.nodes.length === 0 && (
              <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                No graph data available
              </div>
            )}

            {/* Graph Canvas */}
            {graphData.nodes.length > 0 && (
              <div
                style={{
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
                <ForceGraph2D
                  ref={fgRef}
                  graphData={graphData}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  nodeLabel="label"
                  nodeRelSize={8}
                  nodeVal={(node: any) => {
                    // Make expanded nodes larger
                    return expandedNodes.has(node.id) ? 12 : 8;
                  }}
                  nodeColor={(node: any) => {
                    // Color coding by node type
                    const n = node as any;
                    if (expandedNodes.has(n.id)) return '#3b82f6'; // Blue for expanded
                    return '#94a3b8'; // Gray for unexpanded
                  }}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    const nodeRadius = (expandedNodes.has(node.id) ? 12 : 8) / globalScale;
                    
                    // Draw circular node with smooth scaling
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = expandedNodes.has(node.id) ? '#3b82f6' : '#94a3b8';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();

                    // Draw label with background
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
                    
                    // Add expansion indicator for unexpanded nodes
                    if (!expandedNodes.has(node.id)) {
                      ctx.beginPath();
                      ctx.arc(node.x, node.y, nodeRadius * 0.4, 0, 2 * Math.PI, false);
                      ctx.fillStyle = '#fff';
                      ctx.fill();
                      ctx.strokeStyle = '#94a3b8';
                      ctx.lineWidth = 1.5 / globalScale;
                      ctx.stroke();
                      
                      // Plus sign
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
            )}
          
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