import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Filter, ChevronRight, AlertTriangle, Users, DollarSign, Clock } from 'lucide-react';
import { FRAUD_RINGS, FraudRing, RiskLevel, RingStatus } from '../data/mockData';

const RISK_COLORS: Record<RiskLevel, string> = {
  Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e',
};

function RiskBadge({ score, level }: { score: number; level: RiskLevel }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none" stroke={RISK_COLORS[level]} strokeWidth="3"
            strokeDasharray={`${(score / 100) * 81.7} 81.7`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{score}</span>
      </div>
      <span className={`badge-${level.toLowerCase() as 'critical'|'high'|'medium'|'low'}`}>{level}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: RingStatus }) {
  const cls: Record<RingStatus, string> = {
    'New': 'status-new', 'In review': 'status-in-review', 'Escalated': 'status-escalated',
    'Confirmed': 'status-confirmed', 'Dismissed': 'status-dismissed',
  };
  return <span className={cls[status]}>{status}</span>;
}

const STATUS_OPTIONS: (RingStatus | 'All')[] = ['All', 'New', 'In review', 'Escalated', 'Confirmed', 'Dismissed'];
const RISK_OPTIONS: (RiskLevel | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];
const PATTERN_OPTIONS = ['All', 'Circular Flow', 'Mule Chain', 'Shared Identity', 'Fan-Out', 'Layering', 'Pass-Through'];

export default function FraudRingsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [patternFilter, setPatternFilter] = useState<string>('All');

  const filtered = useMemo(() => FRAUD_RINGS.filter(r => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (riskFilter !== 'All' && r.riskLevel !== riskFilter) return false;
    if (patternFilter !== 'All' && r.pattern !== patternFilter) return false;
    if (search && !r.id.toLowerCase().includes(search.toLowerCase()) && !r.pattern.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, statusFilter, riskFilter, patternFilter]);

  const counts = useMemo(() => ({
    total: FRAUD_RINGS.length,
    new: FRAUD_RINGS.filter(r => r.status === 'New').length,
    inReview: FRAUD_RINGS.filter(r => r.status === 'In review').length,
    escalated: FRAUD_RINGS.filter(r => r.status === 'Escalated').length,
    confirmed: FRAUD_RINGS.filter(r => r.status === 'Confirmed').length,
    dismissed: FRAUD_RINGS.filter(r => r.status === 'Dismissed').length,
  }), []);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" /> Fraud Rings
          </h1>
          <p className="text-surface-400 text-sm mt-0.5">Detected ring structures — click any row to investigate</p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total', value: counts.total, cls: 'text-surface-300' },
          { label: 'New', value: counts.new, cls: 'text-blue-400' },
          { label: 'In Review', value: counts.inReview, cls: 'text-amber-400' },
          { label: 'Escalated', value: counts.escalated, cls: 'text-purple-400' },
          { label: 'Confirmed', value: counts.confirmed, cls: 'text-red-400' },
          { label: 'Dismissed', value: counts.dismissed, cls: 'text-surface-500' },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-surface-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input className="input-dark pl-8 w-full" placeholder="Search ring ID or pattern..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-surface-500" />
          <select className="input-dark text-xs py-1.5" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o === 'All' ? 'All Statuses' : o}</option>)}
          </select>
          <select className="input-dark text-xs py-1.5" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
            {RISK_OPTIONS.map(o => <option key={o} value={o}>{o === 'All' ? 'All Risk Levels' : o}</option>)}
          </select>
          <select className="input-dark text-xs py-1.5" value={patternFilter} onChange={e => setPatternFilter(e.target.value)}>
            {PATTERN_OPTIONS.map(o => <option key={o} value={o}>{o === 'All' ? 'All Patterns' : o}</option>)}
          </select>
        </div>
        <span className="text-xs text-surface-500 ml-auto">{filtered.length} rings</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ring ID</th><th>Risk</th><th>Pattern</th><th>Accounts</th>
              <th>Volume</th><th>Key Reasons</th><th>Status</th><th>First Seen</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ring => (
              <tr key={ring.id} className="cursor-pointer" onClick={() => navigate(`/fraud-rings/${ring.id}`)}>
                <td>
                  <span className="font-mono font-semibold text-brand-400">{ring.id}</span>
                </td>
                <td><RiskBadge score={ring.riskScore} level={ring.riskLevel} /></td>
                <td className="text-surface-300 text-sm">{ring.pattern}</td>
                <td>
                  <div className="flex items-center gap-1 text-surface-300 text-sm">
                    <Users className="w-3.5 h-3.5 text-surface-500" />{ring.accountCount}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1 text-surface-300 text-sm">
                    <DollarSign className="w-3 h-3 text-surface-500" />
                    {(ring.totalVolume / 1000).toFixed(0)}K
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {ring.keyReasons.slice(0, 2).map(r => (
                      <span key={r} className="chip chip-orange text-[10px]">{r}</span>
                    ))}
                    {ring.keyReasons.length > 2 && <span className="chip text-[10px]">+{ring.keyReasons.length - 2}</span>}
                  </div>
                </td>
                <td><StatusBadge status={ring.status} /></td>
                <td>
                  <div className="flex items-center gap-1 text-surface-500 text-xs">
                    <Clock className="w-3 h-3" />{ring.firstSeen.split(' ')[0]} {ring.firstSeen.split(' ')[1]}
                  </div>
                </td>
                <td>
                  <button className="btn-ghost py-1 px-2 text-xs">
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12 text-surface-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No rings match the current filters
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
