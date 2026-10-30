import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Filter,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ExternalLink,
  GitMerge,
  Smartphone,
  Phone,
  Globe,
  ChevronDown,
  RefreshCw,
  ArrowUpRight,
  Circle,
  Square,
} from 'lucide-react';
import { GRAPH_NODES, GRAPH_EDGES, ACCOUNTS, GraphNode, GraphEdge } from '../data/mockData';

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_COLORS = {
  account: { low: '#22c55e', medium: '#eab308', high: '#f97316', critical: '#ef4444', default: '#64748b' },
  device: '#eab308',
  phone: '#3b82f6',
  ip: '#a855f7',
  hub: '#ef4444',
};

const EDGE_COLORS: Record<string, string> = {
  transfer: '#3b82f6',
  shared_device: '#eab308',
  shared_phone: '#14b8a6',
  shared_ip: '#a855f7',
};

const EDGE_DASH: Record<string, string> = {
  transfer: 'none',
  shared_device: '6,4',
  shared_phone: '4,3',
  shared_ip: '8,4',
};

const ENTITY_TYPES = ['All', 'Account', 'Device', 'Phone', 'IP'] as const;
const RISK_LEVELS = ['All', 'Low', 'Medium', 'High', 'Critical'] as const;
const RELATIONSHIP_TYPES = ['All', 'Transfer', 'Shared Device', 'Shared Phone', 'Shared IP'] as const;

type EntityFilter = typeof ENTITY_TYPES[number];
type RiskFilter = typeof RISK_LEVELS[number];
type RelFilter = typeof RELATIONSHIP_TYPES[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const getNodeColor = (node: GraphNode): string => {
  if (node.type === 'device') return NODE_COLORS.device;
  if (node.type === 'phone') return NODE_COLORS.phone;
  if (node.type === 'ip') return NODE_COLORS.ip;
  if (node.type === 'hub') return NODE_COLORS.hub;
  if (node.type === 'account') {
    const lvl = node.riskLevel;
    if (lvl === 'Critical') return NODE_COLORS.account.critical;
    if (lvl === 'High') return NODE_COLORS.account.high;
    if (lvl === 'Medium') return NODE_COLORS.account.medium;
    if (lvl === 'Low') return NODE_COLORS.account.low;
  }
  return NODE_COLORS.account.default;
};

const getRiskBg = (score: number) => {
  if (score >= 75) return 'bg-red-500/20 text-red-400';
  if (score >= 50) return 'bg-orange-500/20 text-orange-400';
  if (score >= 25) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-green-500/20 text-green-400';
};

// ─── Node Shape Renderer (SVG) ────────────────────────────────────────────────
interface NodeShapeProps {
  node: GraphNode & { x: number; y: number };
  selected: boolean;
  highlighted: boolean;
  onClick: () => void;
}

const NODE_SIZE = 18;

const NodeShape: React.FC<NodeShapeProps> = ({ node, selected, highlighted, onClick }) => {
  const col = getNodeColor(node);
  const glow = selected ? col : highlighted ? col + '80' : 'transparent';
  const opacity = highlighted || selected ? 1 : 0.82;

  const pulse = selected
    ? <circle cx={node.x} cy={node.y} r={NODE_SIZE + 10} fill="none" stroke={col} strokeWidth="1.5" opacity="0.35" />
    : null;

  const selRing = selected
    ? <circle cx={node.x} cy={node.y} r={NODE_SIZE + 6} fill="none" stroke={col} strokeWidth="2" opacity="0.7" />
    : null;

  const label = (
    <text
      x={node.x}
      y={node.y + NODE_SIZE + 14}
      textAnchor="middle"
      fill={selected ? col : '#94a3b8'}
      fontSize="10"
      fontFamily="monospace"
      fontWeight={selected ? '700' : '400'}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      {node.label}
    </text>
  );

  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); onClick(); };

  if (node.type === 'account' || node.type === 'hub') {
    return (
      <g opacity={opacity} onClick={handleClick} style={{ cursor: 'pointer' }}>
        {pulse}
        {selRing}
        <circle cx={node.x} cy={node.y} r={NODE_SIZE + 3} fill={col} opacity="0.15" />
        <circle cx={node.x} cy={node.y} r={NODE_SIZE} fill="#1e293b" stroke={col} strokeWidth="2.5" />
        <text
          x={node.x} y={node.y + 4} textAnchor="middle"
          fill={col} fontSize="8" fontWeight="700" fontFamily="monospace"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.id.split('-')[1]?.slice(0, 4)}
        </text>
        {label}
      </g>
    );
  }

  if (node.type === 'device') {
    const s = NODE_SIZE;
    return (
      <g opacity={opacity} onClick={handleClick} style={{ cursor: 'pointer' }}>
        {selRing}
        <rect x={node.x - s - 3} y={node.y - s - 3} width={(s + 3) * 2} height={(s + 3) * 2} rx={3}
          fill={col} opacity="0.12" />
        <rect x={node.x - s} y={node.y - s} width={s * 2} height={s * 2} rx={3}
          fill="#1e293b" stroke={col} strokeWidth="2.5" />
        <text x={node.x} y={node.y + 4} textAnchor="middle"
          fill={col} fontSize="8" fontWeight="700" fontFamily="monospace"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          DEV
        </text>
        {label}
      </g>
    );
  }

  if (node.type === 'phone') {
    // Hexagon
    const s = NODE_SIZE;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${node.x + s * Math.cos(a)},${node.y + s * Math.sin(a)}`;
    }).join(' ');
    return (
      <g opacity={opacity} onClick={handleClick} style={{ cursor: 'pointer' }}>
        {selRing}
        <polygon points={pts} fill="#1e293b" stroke={col} strokeWidth="2.5" />
        <text x={node.x} y={node.y + 4} textAnchor="middle"
          fill={col} fontSize="7" fontWeight="700" fontFamily="monospace"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          TEL
        </text>
        {label}
      </g>
    );
  }

  if (node.type === 'ip') {
    // Diamond
    const s = NODE_SIZE + 2;
    const pts = `${node.x},${node.y - s} ${node.x + s},${node.y} ${node.x},${node.y + s} ${node.x - s},${node.y}`;
    return (
      <g opacity={opacity} onClick={handleClick} style={{ cursor: 'pointer' }}>
        {selRing}
        <polygon points={pts} fill="#1e293b" stroke={col} strokeWidth="2.5" />
        <text x={node.x} y={node.y + 4} textAnchor="middle"
          fill={col} fontSize="7" fontWeight="700" fontFamily="monospace"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          IP
        </text>
        {label}
      </g>
    );
  }

  // Fallback circle
  return (
    <g opacity={opacity} onClick={handleClick} style={{ cursor: 'pointer' }}>
      <circle cx={node.x} cy={node.y} r={NODE_SIZE} fill="#1e293b" stroke={col} strokeWidth="2" />
      {label}
    </g>
  );
};

// ─── Edge Renderer ────────────────────────────────────────────────────────────
interface EdgeRendererProps {
  edge: GraphEdge;
  nodes: GraphNode[];
  highlighted: boolean;
  animStep: number;
}

const EdgeRenderer: React.FC<EdgeRendererProps> = ({ edge, nodes, highlighted, animStep }) => {
  const src = nodes.find(n => n.id === edge.source);
  const tgt = nodes.find(n => n.id === edge.target);
  if (!src || !tgt) return null;

  const col = EDGE_COLORS[edge.type] ?? '#64748b';
  const dash = EDGE_DASH[edge.type] ?? 'none';
  const opacity = highlighted ? 1 : 0.35;

  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const x1 = src.x + ux * (NODE_SIZE + 2);
  const y1 = src.y + uy * (NODE_SIZE + 2);
  const x2 = tgt.x - ux * (NODE_SIZE + 10);
  const y2 = tgt.y - uy * (NODE_SIZE + 10);

  const markerId = `arr-${edge.id}`;

  return (
    <g opacity={opacity}>
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={col} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={col}
        strokeWidth={highlighted ? 2.5 : 1.5}
        strokeDasharray={dash}
        markerEnd={edge.type === 'transfer' ? `url(#${markerId})` : undefined}
      />
      {edge.amount && highlighted && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          textAnchor="middle"
          fill={col}
          fontSize="9"
          fontFamily="monospace"
        >
          {fmtCurrency(edge.amount)}
        </text>
      )}
    </g>
  );
};

// ─── Node Detail Panel ────────────────────────────────────────────────────────
interface NodeDetailPanelProps {
  node: GraphNode;
  edges: GraphEdge[];
  onClose: () => void;
  onExpandHop: () => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, edges, onClose, onExpandHop }) => {
  const navigate = useNavigate();
  const account = node.type === 'account' ? ACCOUNTS.find(a => a.id === node.id) : null;
  const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const col = getNodeColor(node);

  return (
    <div className="w-80 bg-surface-900 border-l border-slate-700/60 flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
        <div>
          <p className="text-sm font-bold text-white font-mono">{node.label}</p>
          <p className="text-xs text-slate-400 capitalize">{node.type} node</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Risk Score */}
        {node.riskScore !== undefined && (
          <div className="px-4 py-3 border-b border-slate-700/40">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Risk Score</span>
              <span
                className="px-2.5 py-0.5 rounded-full text-sm font-bold font-mono"
                style={{ background: `${col}25`, color: col, border: `1px solid ${col}50` }}
              >
                {node.riskScore} {node.riskLevel}
              </span>
            </div>
          </div>
        )}

        {/* Ring membership */}
        {node.ring && (
          <div className="px-4 py-3 border-b border-slate-700/40">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Ring</span>
              <button
                onClick={() => navigate(`/rings/${node.ring}`)}
                className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 transition-colors"
              >
                {node.ring} <ExternalLink size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Account details */}
        {account && (
          <div className="px-4 py-3 border-b border-slate-700/40 space-y-2.5">
            <p className="text-xs font-semibold text-slate-300 mb-2">Account Details</p>
            {[
              { label: 'Customer ID', value: account.customerId },
              { label: 'Account Type', value: account.type },
              { label: 'Account Age', value: `${account.age} days` },
              { label: 'Status', value: account.status },
            ].map(item => (
              <div key={item.label} className="flex justify-between gap-2">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className="text-xs text-slate-200 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Volume */}
        {account && (
          <div className="px-4 py-3 border-b border-slate-700/40 space-y-2.5">
            <p className="text-xs font-semibold text-slate-300 mb-2">Volume</p>
            {[
              { label: 'Total Volume', value: fmtCurrency(account.totalVolume) },
              { label: 'Inflow', value: fmtCurrency(account.inflow) },
              { label: 'Outflow', value: fmtCurrency(account.outflow) },
              { label: 'Transactions', value: account.transactionCount },
            ].map(item => (
              <div key={item.label} className="flex justify-between gap-2">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className="text-xs text-slate-200 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Connections */}
        <div className="px-4 py-3 border-b border-slate-700/40">
          <p className="text-xs font-semibold text-slate-300 mb-2">Connections ({connectedEdges.length})</p>
          <div className="space-y-1.5">
            {connectedEdges.slice(0, 12).map(edge => {
              const other = edge.source === node.id ? edge.target : edge.source;
              const dir = edge.source === node.id ? '→' : '←';
              return (
                <div key={edge.id} className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    {dir} <span className="text-slate-200">{other}</span>
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: `${EDGE_COLORS[edge.type]}20`, color: EDGE_COLORS[edge.type] }}
                  >
                    {edge.type.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
            {connectedEdges.length > 12 && (
              <p className="text-xs text-slate-500">+{connectedEdges.length - 12} more connections</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-700/60 space-y-2">
        <button
          onClick={() => account && navigate(`/rings/${account.ring}`)}
          disabled={!account?.ring}
          className="w-full btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ExternalLink size={14} /> View Account Ring
        </button>
        <button
          onClick={onExpandHop}
          className="w-full btn-outline flex items-center justify-center gap-2 text-sm"
        >
          <GitMerge size={14} /> Expand 1 Hop
        </button>
      </div>
    </div>
  );
};

// ─── Legend Panel ─────────────────────────────────────────────────────────────
const LegendPanel: React.FC = () => (
  <div className="absolute bottom-4 left-4 z-10 bg-surface-900/90 backdrop-blur border border-slate-700/60 rounded-xl p-4 text-xs">
    <p className="font-semibold text-slate-300 mb-3">Legend</p>

    <p className="text-slate-500 mb-1.5 uppercase tracking-wide text-[10px]">Node Types</p>
    <div className="space-y-1.5 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-green-400 bg-slate-800" />
        <span className="text-slate-400">Account (Low)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-orange-400 bg-slate-800" />
        <span className="text-slate-400">Account (High)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border-2 border-yellow-400 bg-slate-800" />
        <span className="text-slate-400">Device</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon points="9,1 17,5 17,13 9,17 1,13 1,5" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
        </svg>
        <span className="text-slate-400">Phone</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon points="9,1 17,9 9,17 1,9" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
        </svg>
        <span className="text-slate-400">IP Address</span>
      </div>
    </div>

    <p className="text-slate-500 mb-1.5 uppercase tracking-wide text-[10px]">Edge Types</p>
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#3b82f6" strokeWidth="2" /></svg>
        <span className="text-slate-400">Transfer</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#eab308" strokeWidth="2" strokeDasharray="5,3" /></svg>
        <span className="text-slate-400">Shared Device</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#14b8a6" strokeWidth="2" strokeDasharray="4,3" /></svg>
        <span className="text-slate-400">Shared Phone</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#a855f7" strokeWidth="2" strokeDasharray="7,3" /></svg>
        <span className="text-slate-400">Shared IP</span>
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const NetworkExplorerPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('All');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All');
  const [relFilter, setRelFilter] = useState<RelFilter>('All');
  const [timeRange, setTimeRange] = useState('7d');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Graph state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [animating, setAnimating] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Extra expanded nodes from "Expand 1 Hop"
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return GRAPH_NODES.filter(n => {
      if (entityFilter !== 'All') {
        const map: Record<EntityFilter, GraphNode['type'][]> = {
          'All': [],
          'Account': ['account', 'hub'],
          'Device': ['device'],
          'Phone': ['phone'],
          'IP': ['ip'],
        };
        if (!map[entityFilter].includes(n.type)) return false;
      }
      if (riskFilter !== 'All' && n.riskLevel && n.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [entityFilter, riskFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // Filtered edges
  const filteredEdges = useMemo(() => {
    const relMap: Record<RelFilter, string> = {
      'All': '',
      'Transfer': 'transfer',
      'Shared Device': 'shared_device',
      'Shared Phone': 'shared_phone',
      'Shared IP': 'shared_ip',
    };
    return GRAPH_EDGES.filter(e => {
      if (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)) return false;
      if (relFilter !== 'All' && e.type !== relMap[relFilter]) return false;
      return true;
    });
  }, [filteredNodeIds, relFilter]);

  // Highlight logic: when a node is selected, highlight connected nodes and edges
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>();
    filteredEdges.forEach(e => {
      if (e.source === selectedNode.id) ids.add(e.target);
      if (e.target === selectedNode.id) ids.add(e.source);
    });
    ids.add(selectedNode.id);
    return ids;
  }, [selectedNode, filteredEdges]);

  const connectedEdgeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>();
    filteredEdges.forEach(e => {
      if (e.source === selectedNode.id || e.target === selectedNode.id) ids.add(e.id);
    });
    return ids;
  }, [selectedNode, filteredEdges]);

  // Animation
  const toggleAnimation = useCallback(() => {
    if (animating) {
      if (animRef.current) clearInterval(animRef.current);
      setAnimating(false);
    } else {
      setAnimating(true);
      setAnimStep(0);
      animRef.current = setInterval(() => {
        setAnimStep(prev => {
          if (prev >= filteredEdges.length) {
            clearInterval(animRef.current!);
            setAnimating(false);
            return 0;
          }
          return prev + 1;
        });
      }, 400);
    }
  }, [animating, filteredEdges.length]);

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).closest('[data-node]')) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
    e.preventDefault();
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning.current) return;
    const dx = (e.clientX - panStart.current.x) / zoom;
    const dy = (e.clientY - panStart.current.y) / zoom;
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.3), 3));
  }, []);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z * 0.8, 0.3));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleExpandHop = useCallback(() => {
    if (!selectedNode) return;
    const newIds = new Set(expandedNodeIds);
    filteredEdges
      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
      .forEach(e => { newIds.add(e.source); newIds.add(e.target); });
    setExpandedNodeIds(newIds);
  }, [selectedNode, filteredEdges, expandedNodeIds]);

  // Viewbox
  const VB_W = 1000, VB_H = 680;

  return (
    <div className="flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 bg-surface-900 border-b border-slate-700/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 mr-2">
            <Network size={18} className="text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">Network Explorer</span>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          {/* Entity Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Entity:</span>
            <div className="flex gap-1">
              {ENTITY_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setEntityFilter(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                    ${entityFilter === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          {/* Risk Level */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Risk:</span>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as RiskFilter)}
              className="input-dark text-xs py-1 px-2"
            >
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Relationship */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Edge:</span>
            <select
              value={relFilter}
              onChange={e => setRelFilter(e.target.value as RelFilter)}
              className="input-dark text-xs py-1 px-2"
            >
              {RELATIONSHIP_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Time:</span>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="input-dark text-xs py-1 px-2"
            >
              <option value="1d">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <button
            onClick={() => setShowMoreFilters(p => !p)}
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            <Filter size={13} /> More Filters <ChevronDown size={12} className={showMoreFilters ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Stats */}
            <span className="text-xs text-slate-500">
              {filteredNodes.length} nodes · {filteredEdges.length} edges
            </span>

            <div className="w-px h-5 bg-slate-700" />

            {/* Animation */}
            <button
              onClick={toggleAnimation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${animating ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'btn-outline'}`}
            >
              {animating ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
            </button>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button onClick={handleZoomIn} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
                <ZoomIn size={14} />
              </button>
              <button onClick={handleZoomOut} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
                <ZoomOut size={14} />
              </button>
              <button onClick={handleReset} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors" title="Reset view">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* More Filters row */}
        {showMoreFilters && (
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-700/40">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" className="accent-blue-500" defaultChecked />
              Show labels
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" className="accent-blue-500" />
              Only flagged rings
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" className="accent-blue-500" defaultChecked />
              Show edge amounts
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" className="accent-blue-500" />
              Highlight ring members only
            </label>
            <button
              onClick={() => { setEntityFilter('All'); setRiskFilter('All'); setRelFilter('All'); setTimeRange('7d'); setShowMoreFilters(false); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw size={12} /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Main canvas + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* SVG Canvas */}
        <div className="relative flex-1 overflow-hidden bg-slate-950">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full h-full"
            style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={() => setSelectedNode(null)}
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
              {/* Edges */}
              {filteredEdges.map((edge, idx) => {
                const isHighlighted = selectedNode
                  ? connectedEdgeIds.has(edge.id)
                  : animating
                    ? idx < animStep
                    : true;
                return (
                  <EdgeRenderer
                    key={edge.id}
                    edge={edge}
                    nodes={filteredNodes}
                    highlighted={isHighlighted}
                    animStep={animStep}
                  />
                );
              })}

              {/* Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isHighlighted = selectedNode
                  ? connectedNodeIds.has(node.id)
                  : true;
                return (
                  <g key={node.id} data-node="true">
                    <NodeShape
                      node={node}
                      selected={isSelected}
                      highlighted={isHighlighted}
                      onClick={() => setSelectedNode(isSelected ? null : node)}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <LegendPanel />

          {/* Zoom indicator */}
          <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-400">
            {Math.round(zoom * 100)}%
          </div>

          {/* Empty state */}
          {filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network size={48} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No nodes match the current filters</p>
                <p className="text-slate-600 text-sm mt-1">Try adjusting the entity type or risk level filter</p>
              </div>
            </div>
          )}

          {/* Instructions overlay */}
          {!selectedNode && filteredNodes.length > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur border border-slate-700/40 rounded-lg px-3 py-1.5 text-xs text-slate-500 pointer-events-none">
              Click a node to inspect · Drag to pan · Scroll to zoom
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            edges={filteredEdges}
            onClose={() => setSelectedNode(null)}
            onExpandHop={handleExpandHop}
          />
        )}
      </div>
    </div>
  );
};

export default NetworkExplorerPage;
