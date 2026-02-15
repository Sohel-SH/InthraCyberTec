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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [topUsers, setTopUsers] = useState<Array<{ user: string; risk_score?: number }>>([
    { user: 'CCP0001', risk_score: 95 }
  ]);


    const fgRef = useRef<any>(null);

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
      const res = await fetch(API_CONFIG.QUERY_ENDPOINT + "/graph", {
        method: "GET",
        headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ node_id: nodeId })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      // Normalize response: accept either `links` or `edges` (with src/dst)
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];
      let links: any[] = [];
      if (Array.isArray(data.links)) links = data.links;
      else if (Array.isArray(data.edges)) {
        links = data.edges.map((e: any) => ({ source: e.src ?? e.source, target: e.dst ?? e.target }));
      }

      // Validate normalized data
      if (!Array.isArray(nodes) || !Array.isArray(links)) {
        throw new Error('Invalid graph data format');
      }

      const normalized = {
        nodes: nodes.map((n: any) => ({ id: String(n.id), label: n.label ?? String(n.id) })),
        links
      };

      if (expand) {
        setGraphData(prev => mergeGraphData(prev, normalized));
      } else {
        setGraphData(normalized);
      }

      setExpandedNodes(prev => new Set(prev).add(nodeId));
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
      fetchGraph(node.id, true);
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
          <div className="w-1/4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
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
          <div className="w-3/4">
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
                  height: 600,
                  width: '100%',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <ForceGraph2D
                  ref={fgRef}
                  graphData={graphData}
                  nodeLabel="label"
                  nodeAutoColorBy="id"
                  nodeRelSize={6}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(
                      node.x - bckgDimensions[0] / 2,
                      node.y - bckgDimensions[1] / 2,
                      bckgDimensions[0],
                      bckgDimensions[1]
                    );

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000';
                    ctx.fillText(label, node.x, node.y);
                  }}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={1}
                  linkWidth={2}
                  linkColor={() => '#999'}
                  onNodeClick={(node) => handleNodeClick(node as NodeType)}
                  enableNodeDrag={true}
                  enableZoomInteraction={true}
                  enablePanInteraction={true}
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