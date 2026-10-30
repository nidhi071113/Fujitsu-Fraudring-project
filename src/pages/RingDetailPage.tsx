import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Network,
  Users,
  GitBranch,
  FileText,
  PlayCircle,
  Clock,
  Shield,
  TrendingUp,
  ArrowRight,
  Send,
  BarChart2,
  Info,
} from 'lucide-react';
import { FRAUD_RINGS, ACCOUNTS, TRANSACTIONS, FraudRing, Account, Transaction } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const getRiskColor = (score: number): string => {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 25) return '#eab308';
  return '#22c55e';
};

const getRiskBg = (score: number): string => {
  if (score >= 75) return 'bg-red-500/20 text-red-400';
  if (score >= 50) return 'bg-orange-500/20 text-orange-400';
  if (score >= 25) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-green-500/20 text-green-400';
};

const getRoleBadge = (role?: string) => {
  switch (role) {
    case 'Collector': return 'chip chip-red';
    case 'Source': return 'chip chip-orange';
    case 'Pass-through': return 'chip chip-blue';
    default: return 'chip chip-purple';
  }
};

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastProps { message: string; type: 'success' | 'error'; }
const Toast: React.FC<ToastProps & { onDismiss: () => void }> = ({ message, type, onDismiss }) => (
  <div
    className={`fixed bottom-32 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border transition-all
      ${type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-300' : 'bg-red-900/90 border-red-500/50 text-red-300'}`}
  >
    {type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
  </div>
);

// ─── Horizontal Bar Chart ──────────────────────────────────────────────────────
const MODEL_DRIVERS = [
  { name: 'Degree Centrality', key: 'degree_centrality', value: 0.18, color: '#3b82f6' },
  { name: 'Device Overlap', key: 'device_overlap', value: 0.16, color: '#8b5cf6' },
  { name: 'Circular Flow Score', key: 'circular_flow_score', value: 0.14, color: '#ef4444' },
  { name: 'Transaction Velocity', key: 'transaction_velocity', value: 0.12, color: '#f97316' },
];

const ModelDriversChart: React.FC = () => (
  <div className="space-y-3">
    {MODEL_DRIVERS.map(d => (
      <div key={d.key}>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-300">{d.name}</span>
          <span className="text-slate-400 font-mono">{d.value.toFixed(2)}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(d.value / 0.22) * 100}%`, backgroundColor: d.color }}
          />
        </div>
      </div>
    ))}
  </div>
);

// ─── Ring SVG Graph ──────────────────────────────────────────────────────────
interface RingGraphProps { ring: FraudRing; timeStep: number; }

const RING_ACCOUNTS = [
  { id: 'ACC-1021', angle: 0 },
  { id: 'ACC-1187', angle: 51.4 },
  { id: 'ACC-1342', angle: 102.9 },
  { id: 'ACC-1519', angle: 154.3 },
  { id: 'ACC-1611', angle: 205.7 },
  { id: 'ACC-1660', angle: 257.1 },
  { id: 'ACC-1678', angle: 308.6 },
];

const RING_EDGES = [
  { from: 'ACC-1021', to: 'ACC-1187', step: 0 },
  { from: 'ACC-1187', to: 'ACC-1342', step: 1 },
  { from: 'ACC-1342', to: 'ACC-1519', step: 2 },
  { from: 'ACC-1519', to: 'ACC-1611', step: 3 },
  { from: 'ACC-1611', to: 'ACC-1660', step: 4 },
  { from: 'ACC-1660', to: 'ACC-1678', step: 5 },
  { from: 'ACC-1678', to: 'ACC-1021', step: 6 },
];

const toRad = (deg: number) => (deg * Math.PI) / 180;

const RingGraph: React.FC<RingGraphProps> = ({ ring, timeStep }) => {
  const cx = 320, cy = 230, r = 160;
  const devX = cx, devY = cy;
  const NODE_R = 22;

  const positions: Record<string, { x: number; y: number }> = {};
  RING_ACCOUNTS.forEach(({ id, angle }) => {
    positions[id] = {
      x: cx + r * Math.cos(toRad(angle - 90)),
      y: cy + r * Math.sin(toRad(angle - 90)),
    };
  });

  const arrowId = (from: string, to: string) => `arr-${from}-${to}`;

  return (
    <svg viewBox="0 0 640 460" className="w-full h-full" style={{ minHeight: 400 }}>
      <defs>
        {RING_EDGES.map(e => (
          <marker
            key={arrowId(e.from, e.to)}
            id={arrowId(e.from, e.to)}
            markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"
          >
            <path
              d="M0,0 L0,6 L8,3 z"
              fill={timeStep >= e.step ? '#3b82f6' : '#334155'}
            />
          </marker>
        ))}
        <marker id="arr-dev" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#eab308" />
        </marker>
      </defs>

      {/* Device dashed lines */}
      {RING_ACCOUNTS.map(({ id }) => {
        const p = positions[id];
        return (
          <line
            key={`dev-${id}`}
            x1={devX} y1={devY} x2={p.x} y2={p.y}
            stroke="#eab308" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.55"
          />
        );
      })}

      {/* Transfer edges */}
      {RING_EDGES.map(e => {
        const from = positions[e.from];
        const to = positions[e.to];
        const active = timeStep >= e.step;

        // Offset the line slightly for arrow placement
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        const x1 = from.x + ux * (NODE_R + 2);
        const y1 = from.y + uy * (NODE_R + 2);
        const x2 = to.x - ux * (NODE_R + 10);
        const y2 = to.y - uy * (NODE_R + 10);

        return (
          <line
            key={`edge-${e.from}-${e.to}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={active ? '#3b82f6' : '#334155'}
            strokeWidth={active ? 2.5 : 1.5}
            markerEnd={`url(#${arrowId(e.from, e.to)})`}
            style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
          />
        );
      })}

      {/* Account nodes */}
      {RING_ACCOUNTS.map(({ id }) => {
        const p = positions[id];
        const acc = ACCOUNTS.find(a => a.id === id);
        const score = acc?.riskScore ?? 30;
        const col = getRiskColor(score);
        return (
          <g key={id}>
            <circle cx={p.x} cy={p.y} r={NODE_R + 4} fill={col} opacity="0.15" />
            <circle cx={p.x} cy={p.y} r={NODE_R} fill="#1e293b" stroke={col} strokeWidth="2.5" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill={col} fontSize="8" fontWeight="700" fontFamily="monospace">
              {id.split('-')[1]}
            </text>
            <text x={p.x} y={p.y + cy * 0} />
            <text
              x={p.x}
              y={p.y > cy ? p.y + NODE_R + 14 : p.y - NODE_R - 4}
              textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace"
            >
              {id}
            </text>
          </g>
        );
      })}

      {/* DEV-883 center square */}
      <g>
        <rect x={devX - 18} y={devY - 18} width={36} height={36} rx={4}
          fill="#1e293b" stroke="#eab308" strokeWidth="2.5" />
        <text x={devX} y={devY + 4} textAnchor="middle" fill="#eab308" fontSize="8" fontWeight="700" fontFamily="monospace">
          DEV
        </text>
        <text x={devX} y={devY + cy * 0} />
        <text x={devX} y={devY - 26} textAnchor="middle" fill="#eab308" fontSize="10" fontFamily="monospace">
          DEV-883
        </text>
      </g>
    </svg>
  );
};

// ─── Money Flow SVG ──────────────────────────────────────────────────────────
const FLOW_ACCOUNTS = ['ACC-1021', 'ACC-1187', 'ACC-1342', 'ACC-1519', 'ACC-1611', 'ACC-1660', 'ACC-1678', 'ACC-1021'];

const MoneyFlowDiagram: React.FC = () => {
  const nodes = FLOW_ACCOUNTS.slice(0, 7);
  const nodeW = 72, nodeH = 36, gap = 64, totalW = nodes.length * nodeW + (nodes.length - 1) * gap;
  const svgW = Math.max(totalW + 80, 900);
  const svgH = 100;
  const startX = (svgW - totalW) / 2;
  const nodeY = (svgH - nodeH) / 2;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minHeight: 90, maxHeight: 110 }}>
      <defs>
        <marker id="flow-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
        </marker>
      </defs>
      {nodes.map((id, i) => {
        const x = startX + i * (nodeW + gap);
        const next = i < nodes.length - 1 ? startX + (i + 1) * (nodeW + gap) : null;
        const isFirst = i === 0;
        const isLast = i === nodes.length - 1;
        return (
          <g key={`${id}-${i}`}>
            <rect x={x} y={nodeY} width={nodeW} height={nodeH} rx={6}
              fill={isFirst || isLast ? '#1e3a5f' : '#1e293b'}
              stroke={isFirst || isLast ? '#3b82f6' : '#475569'}
              strokeWidth="1.5"
            />
            <text x={x + nodeW / 2} y={nodeY + nodeH / 2 + 4} textAnchor="middle"
              fill={isFirst || isLast ? '#93c5fd' : '#94a3b8'}
              fontSize="10" fontFamily="monospace" fontWeight={isFirst || isLast ? '700' : '400'}
            >
              {id}
            </text>
            {next !== null && (
              <line
                x1={x + nodeW + 2} y1={nodeY + nodeH / 2}
                x2={next - 10} y2={nodeY + nodeH / 2}
                stroke="#3b82f6" strokeWidth="2" markerEnd="url(#flow-arr)"
              />
            )}
          </g>
        );
      })}
      {/* Return arrow at end */}
      <path
        d={`M ${startX + (nodes.length - 1) * (nodeW + gap) + nodeW} ${nodeY + nodeH / 2 + 2}
            Q ${svgW / 2} ${svgH + 10} ${startX + nodeW / 2} ${nodeY + nodeH / 2 + 2}`}
        fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4"
        markerEnd="url(#flow-arr)"
      />
      <text x={svgW / 2} y={svgH - 2} textAnchor="middle" fill="#ef4444" fontSize="9">
        ↩ funds cycle back
      </text>
    </svg>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'summary' | 'graph' | 'members' | 'flow' | 'notes';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'summary', label: 'Summary', icon: <BarChart2 size={15} /> },
  { id: 'graph', label: 'Graph', icon: <Network size={15} /> },
  { id: 'members', label: 'Members', icon: <Users size={15} /> },
  { id: 'flow', label: 'Money Flow', icon: <GitBranch size={15} /> },
  { id: 'notes', label: 'Notes & History', icon: <FileText size={15} /> },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
const RingDetailPage: React.FC = () => {
  const { ringId } = useParams<{ ringId: string }>();
  const navigate = useNavigate();
  const { user, addAuditEntry } = useAuth();

  const ring = FRAUD_RINGS.find(r => r.id === ringId) ?? FRAUD_RINGS[0];
  const ringAccounts = ACCOUNTS.filter(a => ring.accounts.includes(a.id));
  const ringTxns = TRANSACTIONS.filter(t => t.ring === ring.id);

  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [timeStep, setTimeStep] = useState(7);
  const [comment, setComment] = useState('');
  const [dismissReason, setDismissReason] = useState('false_positive_legit');
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [noteText, setNoteText] = useState('');
  const [ringNotes, setRingNotes] = useState(ring.notes);

  const showToast = (message: string, type: ToastProps['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = (action: 'confirm' | 'dismiss' | 'escalate') => {
    if (!comment.trim()) {
      showToast('A comment is required before taking action.', 'error');
      return;
    }

    const actionLabels: Record<string, string> = {
      confirm: 'Confirmed Fraud',
      dismiss: 'Dismissed (False Positive)',
      escalate: 'Escalated to Lead',
    };

    addAuditEntry({
      user: user?.name ?? 'Unknown',
      role: user?.role ?? 'analyst',
      action: actionLabels[action],
      actionType: 'Decision',
      entity: ring.id,
      details: `Ring ${ring.id} — ${actionLabels[action]}`,
      comment: comment.trim(),
    });

    showToast(`${actionLabels[action]} — action recorded.`);
    setComment('');

    // Navigate to next ring after short delay
    const idx = FRAUD_RINGS.findIndex(r => r.id === ring.id);
    const nextRing = FRAUD_RINGS[(idx + 1) % FRAUD_RINGS.length];
    setTimeout(() => navigate(`/rings/${nextRing.id}`), 1800);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newNote = {
      id: `n${Date.now()}`,
      author: user?.name ?? 'Unknown',
      role: user?.role ?? 'analyst',
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      content: noteText.trim(),
      action: 'Note added',
    };
    setRingNotes(prev => [...prev, newNote]);
    setNoteText('');
  };

  const statusClass: Record<string, string> = {
    'New': 'status-new',
    'In review': 'status-in-review',
    'Escalated': 'status-escalated',
    'Confirmed': 'status-confirmed',
    'Dismissed': 'status-dismissed',
  };

  // ─── Tab: Summary ───────────────────────────────────────────────────────────
  const SummaryTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: main content */}
      <div className="xl:col-span-2 space-y-5">
        {/* Plain language explanation */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-300 mb-1">What was detected</p>
              <p className="text-sm text-slate-300 leading-relaxed">{ring.description}</p>
            </div>
          </div>
        </div>

        {/* Key Insight amber banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">Key Insight</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Individual transaction scores for these {ring.accountCount} accounts were all below 40.
                The ring was only visible through graph connections — no single transaction was suspicious in isolation.
              </p>
            </div>
          </div>
        </div>

        {/* Rules Fired */}
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Shield size={15} className="text-blue-400" /> Rules Fired
          </p>
          <div className="flex flex-wrap gap-2">
            {ring.rulesFired.map(rule => (
              <div key={rule} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                <span className="font-mono text-xs text-slate-200">{rule}</span>
                <span className="badge-critical text-xs px-2 py-0.5 rounded-full">Triggered</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Drivers Chart */}
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-purple-400" /> Top Model Feature Drivers
          </p>
          <ModelDriversChart />
        </div>
      </div>

      {/* Right: reason chips panel */}
      <div className="space-y-5">
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-3">Key Risk Reasons</p>
          <div className="flex flex-wrap gap-2">
            {ring.keyReasons.map((r, i) => (
              <span key={i} className="chip chip-red text-xs">{r}</span>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-3">Ring Metadata</p>
          <div className="space-y-2.5">
            {[
              { label: 'Ring ID', value: ring.id },
              { label: 'Pattern', value: ring.pattern },
              { label: 'Accounts', value: ring.accountCount },
              { label: 'Devices', value: ring.devices.join(', ') || '—' },
              { label: 'First Seen', value: ring.firstSeen },
              { label: 'Assigned To', value: ring.assignedTo ?? 'Unassigned' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className="text-xs text-slate-200 font-mono text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {ring.escalatedBy && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/25 p-4">
            <p className="text-xs font-semibold text-purple-300 mb-1">Escalated by {ring.escalatedBy}</p>
            <p className="text-xs text-slate-400">{ring.escalatedNote}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Tab: Graph ──────────────────────────────────────────────────────────────
  const GraphTab = () => (
    <div className="space-y-5">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-200">Network Graph — Ring {ring.id}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={13} />
            <span>Time: {timeStep === 7 ? '2h (full)' : `${Math.round((timeStep / 7) * 120)}m`}</span>
          </div>
        </div>
        <div className="w-full" style={{ height: 460 }}>
          <RingGraph ring={ring} timeStep={timeStep} />
        </div>

        {/* Time Slider */}
        <div className="mt-3 px-4">
          <label className="text-xs text-slate-400 mb-1 block">Time Slider — scrub to reveal edges chronologically</label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">0h</span>
            <input
              type="range" min={0} max={7} step={1} value={timeStep}
              onChange={e => setTimeStep(Number(e.target.value))}
              className="flex-1 h-2 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-500 font-mono">2h</span>
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-600">
            {RING_EDGES.map((e, i) => (
              <span key={i} className={i <= timeStep ? 'text-blue-400' : 'text-slate-600'}>|</span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-blue-400 bg-slate-800" />
            <span>Account node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-amber-400 bg-slate-800" />
            <span>Device node (DEV-883)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500" />
            <span>Transfer (circular flow)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-amber-400" style={{ borderTop: '2px dashed #eab308' }} />
            <span>Shared device link</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Tab: Members ─────────────────────────────────────────────────────────────
  const MembersTab = () => (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-slate-700/60">
        <p className="text-sm font-semibold text-slate-200">{ring.accountCount} Accounts in Ring {ring.id}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Customer ID</th>
              <th>Risk Score</th>
              <th>Role in Ring</th>
              <th>Account Age</th>
              <th>Devices</th>
              <th>Total Volume</th>
              <th>Explore</th>
            </tr>
          </thead>
          <tbody>
            {ringAccounts.map(acc => (
              <tr key={acc.id}>
                <td className="font-mono text-blue-400">{acc.id}</td>
                <td className="font-mono text-slate-400">{acc.customerId}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${getRiskBg(acc.riskScore)}`}>
                    {acc.riskScore}
                  </span>
                </td>
                <td>
                  <span className={getRoleBadge(acc.role)}>
                    {acc.role ?? 'Unknown'}
                  </span>
                </td>
                <td className="text-slate-400">{acc.age}d</td>
                <td className="text-slate-400">{acc.deviceCount}</td>
                <td className="font-mono text-slate-300">{fmtCurrency(acc.totalVolume)}</td>
                <td>
                  <Link
                    to="/network"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Explore <ArrowUpRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── Tab: Money Flow ─────────────────────────────────────────────────────────
  const MoneyFlowTab = () => {
    const sortedTxns = [...ringTxns].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
      <div className="space-y-6">
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <GitBranch size={15} className="text-blue-400" /> Fund Flow Diagram
          </p>
          <MoneyFlowDiagram />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-slate-700/60">
            <p className="text-sm font-semibold text-slate-200">Transaction Timeline</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Timestamp</th>
                  <th>Risk Score</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {sortedTxns.map((txn, i) => {
                  const prev = i > 0 ? sortedTxns[i - 1] : null;
                  const latencyMs = prev
                    ? new Date(txn.timestamp).getTime() - new Date(prev.timestamp).getTime()
                    : null;
                  const latencyMin = latencyMs ? Math.round(latencyMs / 60000) : null;
                  return (
                    <tr key={txn.id}>
                      <td className="font-mono text-blue-400">{txn.id}</td>
                      <td className="font-mono text-slate-400">{txn.from}</td>
                      <td className="font-mono text-slate-400">{txn.to}</td>
                      <td className="font-mono text-slate-200">{fmtCurrency(txn.amount)}</td>
                      <td className="text-slate-400 text-xs">{txn.timestamp}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${getRiskBg(txn.riskScore)}`}>
                          {txn.riskScore}
                        </span>
                      </td>
                      <td className="text-slate-500 text-xs">
                        {latencyMin !== null ? `+${latencyMin}m` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── Tab: Notes & History ────────────────────────────────────────────────────
  const NotesTab = () => (
    <div className="space-y-5">
      <div className="glass-card divide-y divide-slate-700/50">
        {ringNotes.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">No notes yet for this ring.</div>
        )}
        {ringNotes.map(note => (
          <div key={note.id} className="p-4 flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 mt-0.5">
              {note.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-200">{note.author}</span>
                <span className="chip chip-blue text-xs">{note.role}</span>
                {note.action && (
                  <span className="chip chip-purple text-xs">{note.action}</span>
                )}
                <span className="text-xs text-slate-500 ml-auto">{note.timestamp}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{note.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add note */}
      <div className="glass-card p-5">
        <p className="text-sm font-semibold text-slate-200 mb-3">Add a Note</p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          rows={3}
          placeholder="Write your observation or finding here..."
          className="input-dark w-full resize-none text-sm"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} /> Add Note
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-950 pb-48">
      {/* Breadcrumb */}
      <div className="px-6 pt-5 pb-1">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/rings" className="hover:text-slate-300 transition-colors">Fraud Rings</Link>
          <ChevronRight size={12} />
          <span className="text-slate-300 font-mono">{ring.id}</span>
        </nav>
      </div>

      {/* Page Header */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono">{ring.id}</h1>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
                style={{ background: `${getRiskColor(ring.riskScore)}25`, color: getRiskColor(ring.riskScore), border: `1px solid ${getRiskColor(ring.riskScore)}50` }}
              >
                <Shield size={13} /> {ring.riskScore} {ring.riskLevel}
              </div>
              <span className={statusClass[ring.status] ?? 'chip'}>{ring.status}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('notes')}
            className="btn-primary flex items-center gap-2"
          >
            <PlayCircle size={16} /> Start Investigation
          </button>
        </div>

        {/* Metadata strip */}
        <div className="flex flex-wrap gap-6 mt-4 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          {[
            { label: 'Pattern', value: ring.pattern },
            { label: 'Accounts', value: ring.accountCount },
            { label: 'Total Volume', value: fmtCurrency(ring.totalVolume) },
            { label: 'First Seen', value: ring.firstSeen },
            { label: 'Assigned To', value: ring.assignedTo ?? 'Unassigned' },
          ].map(item => (
            <div key={item.label}>
              <span className="block text-xs text-slate-500">{item.label}</span>
              <span className="text-sm font-semibold text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-1 border-b border-slate-700/60 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'graph' && <GraphTab />}
        {activeTab === 'members' && <MembersTab />}
        {activeTab === 'flow' && <MoneyFlowTab />}
        {activeTab === 'notes' && <NotesTab />}
      </div>

      {/* Decision Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-900/95 backdrop-blur-md border-t border-slate-700/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-64">
            <label className="block text-xs text-slate-400 mb-1.5">
              Decision Comment <span className="text-red-400">*</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder="Required: document your reasoning before taking action..."
              className="input-dark w-full resize-none text-sm"
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Dismiss Reason</label>
              <select
                value={dismissReason}
                onChange={e => setDismissReason(e.target.value)}
                className="input-dark text-sm py-2 pr-8"
              >
                <option value="false_positive_legit">False Positive — Legitimate Activity</option>
                <option value="false_positive_b2b">False Positive — B2B Payments</option>
                <option value="false_positive_family">False Positive — Family Sharing</option>
                <option value="insufficient_evidence">Insufficient Evidence</option>
                <option value="duplicate_ring">Duplicate Ring</option>
              </select>
            </div>

            <button
              onClick={() => handleAction('confirm')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
            >
              <CheckCircle2 size={15} /> Confirm Fraud
            </button>

            <button
              onClick={() => handleAction('dismiss')}
              className="btn-outline flex items-center gap-2 text-sm"
            >
              <XCircle size={15} /> Dismiss
            </button>

            <button
              onClick={() => handleAction('escalate')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
            >
              <ArrowRight size={15} /> Escalate to Lead
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default RingDetailPage;
