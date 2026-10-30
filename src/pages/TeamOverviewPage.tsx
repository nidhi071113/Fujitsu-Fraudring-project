import React, { useState } from 'react';
import {
  Users, AlertTriangle, Clock, TrendingUp, CheckCircle,
  ChevronDown, ChevronUp, Download, UserCheck, X, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FRAUD_RINGS, ANALYST_WORKLOAD, FraudRing } from '../data/mockData';

// ─── Constants ────────────────────────────────────────────────
const ANALYSTS = ['Aiko Tanaka', 'Michael J.', 'Anna S.', 'Ravi K.'];

const OUTCOME_DATA = [
  { name: 'Confirmed', value: 82, pct: 64, color: '#ef4444' },
  { name: 'Dismissed', value: 30, pct: 24, color: '#64748b' },
  { name: 'Escalated', value: 8, pct: 6, color: '#f97316' },
  { name: 'Open', value: 8, pct: 6, color: '#3b82f6' },
];

const MAX_WORKLOAD = 10;

// ─── Sub-components ───────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  sub?: string;
}> = ({ label, value, icon, colorClass, sub }) => (
  <div className="kpi-card flex-1 min-w-[180px]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-2 rounded-lg bg-surface-800 ${colorClass}`}>{icon}</div>
    </div>
  </div>
);

const WorkloadBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}
      />
    </div>
    <span className="text-xs text-slate-300 w-4 text-right">{value}</span>
  </div>
);

const EscalationNote: React.FC<{ note: string; by: string }> = ({ note, by }) => (
  <div className="my-2 px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10">
    <div className="flex items-start gap-2">
      <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-xs font-semibold text-amber-400">Escalated by {by}: </span>
        <span className="text-xs text-amber-200">{note}</span>
      </div>
    </div>
  </div>
);

interface AssignModalProps {
  selectedIds: string[];
  onClose: () => void;
  onAssign: (analyst: string) => void;
}

const AssignModal: React.FC<AssignModalProps> = ({ selectedIds, onClose, onAssign }) => {
  const [chosen, setChosen] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Assign {selectedIds.length} Alert{selectedIds.length > 1 ? 's' : ''}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-xs text-slate-400 mb-3">Rings: {selectedIds.join(', ')}</p>
        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Select Analyst</label>
        <select
          className="input-dark w-full mb-4"
          value={chosen}
          onChange={e => setChosen(e.target.value)}
        >
          <option value="">— choose analyst —</option>
          {ANALYSTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
          <button
            disabled={!chosen}
            onClick={() => { if (chosen) { onAssign(chosen); onClose(); } }}
            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UserCheck size={14} className="inline mr-1" />Assign
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Custom Tooltip for Donut ─────────────────────────────────
const DonutTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="font-semibold" style={{ color: d.color }}>{d.name}</p>
      <p className="text-slate-300">{d.value} alerts · {d.pct}%</p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const TeamOverviewPage: React.FC = () => {
  const escalatedRings = FRAUD_RINGS.filter(r => r.status === 'Escalated');
  const unassignedRings = FRAUD_RINGS.filter(r => !r.assignedTo && r.status !== 'Dismissed');

  const [expandedRings, setExpandedRings] = useState<Set<string>>(new Set());
  const [selectedUnassigned, setSelectedUnassigned] = useState<Set<string>>(new Set());
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRings(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedUnassigned(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUnassigned.size === unassignedRings.length) {
      setSelectedUnassigned(new Set());
    } else {
      setSelectedUnassigned(new Set(unassignedRings.map(r => r.id)));
    }
  };

  const handleAssign = (analyst: string) => {
    const newAssignments: Record<string, string> = {};
    selectedUnassigned.forEach(id => { newAssignments[id] = analyst; });
    setAssignments(prev => ({ ...prev, ...newAssignments }));
    setSelectedUnassigned(new Set());
    setToastMsg(`${Object.keys(newAssignments).length} alert(s) assigned to ${analyst}`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExportReport = () => {
    const csv = [
      'Ring ID,Risk Score,Pattern,Status,Assigned To,Volume',
      ...FRAUD_RINGS.map(r =>
        `${r.id},${r.riskScore},${r.pattern},${r.status},${r.assignedTo ?? 'Unassigned'},${r.totalVolume}`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-weekly-report-Oct-2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const riskBadge = (level: FraudRing['riskLevel']) => {
    const map: Record<string, string> = {
      Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low'
    };
    return <span className={`chip ${map[level] ?? ''}`}>{level}</span>;
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg shadow-xl text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Team Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Financial Crime Compliance · Kenji Sato</p>
        </div>
        <button onClick={handleExportReport} className="btn-outline flex items-center gap-2 text-sm">
          <Download size={14} />
          Weekly Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="flex flex-wrap gap-4">
        <KpiCard
          label="Unassigned Alerts"
          value={18}
          icon={<AlertTriangle size={18} />}
          colorClass="text-orange-400"
          sub="Requires assignment"
        />
        <KpiCard
          label="Escalations Waiting"
          value={6}
          icon={<AlertCircle size={18} />}
          colorClass="text-red-400"
          sub="Awaiting lead decision"
        />
        <KpiCard
          label="Alerts &gt;24h Open"
          value={9}
          icon={<Clock size={18} />}
          colorClass="text-amber-400"
          sub="Breaching SLA"
        />
        <KpiCard
          label="Confirm Rate"
          value="82%"
          icon={<TrendingUp size={18} />}
          colorClass="text-green-400"
          sub="Last 30 days"
        />
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Analyst Workload */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Analyst Workload</h2>
          </div>
          <div className="data-table">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Analyst</th>
                  <th className="text-center py-2 px-2 text-xs text-slate-400 font-medium uppercase tracking-wider">Open</th>
                  <th className="text-center py-2 px-2 text-xs text-slate-400 font-medium uppercase tracking-wider">In Review</th>
                  <th className="text-center py-2 px-2 text-xs text-slate-400 font-medium uppercase tracking-wider">Resolved</th>
                  <th className="py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Workload</th>
                </tr>
              </thead>
              <tbody>
                {ANALYST_WORKLOAD.map((row, i) => (
                  <tr key={i} className="border-t border-surface-700 hover:bg-surface-800/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300">
                          {row.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-slate-200 text-xs">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`text-xs font-semibold ${row.open > 4 ? 'text-orange-400' : 'text-slate-300'}`}>{row.open}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="text-xs font-semibold text-blue-400">{row.inReview}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="text-xs font-semibold text-green-400">{row.resolved}</span>
                    </td>
                    <td className="py-2.5 px-3 w-32">
                      <WorkloadBar
                        value={row.open + row.inReview}
                        max={MAX_WORKLOAD}
                        color={row.open + row.inReview > 7 ? '#f97316' : row.open + row.inReview > 4 ? '#eab308' : '#22c55e'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT — Alert Outcomes Donut */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Alert Outcomes</h2>
            <span className="ml-auto text-xs text-slate-500">Last 30 days · 128 alerts</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={OUTCOME_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {OUTCOME_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
              <Legend
                formatter={(value, entry: any) => (
                  <span className="text-xs text-slate-300">{value} <span className="text-slate-500">({entry.payload.pct}%)</span></span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {OUTCOME_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface-800/50">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-slate-400">{d.name}</span>
                <span className="ml-auto text-xs font-semibold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Escalations Queue */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Escalations Queue</h2>
          <span className="ml-auto chip chip-red">{escalatedRings.length} pending</span>
        </div>
        <div className="space-y-3">
          {escalatedRings.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">No escalations pending.</p>
          )}
          {escalatedRings.map(ring => (
            <div key={ring.id} className="border border-surface-700 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-800/60 transition-colors"
                onClick={() => toggleExpand(ring.id)}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-white">{ring.id}</span>
                    {riskBadge(ring.riskLevel)}
                    <span className="text-xs text-slate-400">{ring.pattern}</span>
                    <span className="text-xs text-slate-500">· {ring.accountCount} accts · ¥{ring.totalVolume.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5">First seen: {ring.firstSeen} · Assigned: {ring.assignedTo ?? '—'}</span>
                </div>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  <button
                    className="btn-primary text-xs px-3 py-1.5"
                    onClick={e => { e.stopPropagation(); }}
                  >
                    Review &amp; Decide
                  </button>
                  {expandedRings.has(ring.id) ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </div>
              {expandedRings.has(ring.id) && (
                <div className="px-4 pb-4 border-t border-surface-700 bg-surface-900/40">
                  {ring.escalatedNote && ring.escalatedBy && (
                    <EscalationNote note={ring.escalatedNote} by={ring.escalatedBy} />
                  )}
                  <p className="text-xs text-slate-400 mt-2">{ring.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ring.rulesFired.map(r => <span key={r} className="chip chip-blue text-xs">{r}</span>)}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-primary text-xs px-3 py-1.5">Confirm Fraud</button>
                    <button className="btn-outline text-xs px-3 py-1.5">Dismiss</button>
                    <button className="btn-ghost text-xs px-3 py-1.5">Request Info</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unassigned Alerts */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-orange-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Unassigned Alerts</h2>
          <span className="ml-auto chip chip-orange">{unassignedRings.length} unassigned</span>
          {selectedUnassigned.size > 0 && (
            <button
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
              onClick={() => setAssignModalOpen(true)}
            >
              <UserCheck size={13} />
              Assign to Analyst ({selectedUnassigned.size})
            </button>
          )}
        </div>

        <div className="data-table">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-3 w-8">
                  <input
                    type="checkbox"
                    className="accent-blue-500 cursor-pointer"
                    checked={selectedUnassigned.size === unassignedRings.length && unassignedRings.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Ring ID</th>
                <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Risk</th>
                <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Pattern</th>
                <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Volume</th>
                <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">First Seen</th>
                <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {unassignedRings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 text-sm">All alerts are assigned.</td>
                </tr>
              )}
              {unassignedRings.map(ring => {
                const assignedAnalyst = assignments[ring.id];
                return (
                  <tr key={ring.id} className={`border-t border-surface-700 transition-colors ${selectedUnassigned.has(ring.id) ? 'bg-blue-900/20' : 'hover:bg-surface-800/50'}`}>
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        className="accent-blue-500 cursor-pointer"
                        checked={selectedUnassigned.has(ring.id)}
                        onChange={() => toggleSelect(ring.id)}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs font-bold text-white">{ring.id}</td>
                    <td className="py-2.5 px-3">{riskBadge(ring.riskLevel)}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-300">{ring.pattern}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-300">¥{ring.totalVolume.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-400">{ring.firstSeen}</td>
                    <td className="py-2.5 px-3 text-xs">
                      {assignedAnalyst
                        ? <span className="text-green-400 font-medium">{assignedAnalyst}</span>
                        : <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedUnassigned.size === 0 && unassignedRings.length > 0 && (
          <p className="text-xs text-slate-500 mt-3">Select rows above then click <strong className="text-slate-400">Assign to Analyst</strong>.</p>
        )}
      </div>

      {/* Assign Modal */}
      {assignModalOpen && (
        <AssignModal
          selectedIds={Array.from(selectedUnassigned)}
          onClose={() => setAssignModalOpen(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
};

export default TeamOverviewPage;
