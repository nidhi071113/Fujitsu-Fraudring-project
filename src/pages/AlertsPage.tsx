import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Filter, ChevronRight, Shield, Clock, Search } from 'lucide-react';
import { FRAUD_RINGS, RiskLevel, RingStatus } from '../data/mockData';

const RISK_COLORS: Record<RiskLevel, string> = {
  Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low',
};
const STATUS_CLS: Record<RingStatus, string> = {
  'New': 'status-new', 'In review': 'status-in-review', 'Escalated': 'status-escalated',
  'Confirmed': 'status-confirmed', 'Dismissed': 'status-dismissed',
};

interface Alert {
  id: string; ringId: string; severity: RiskLevel; pattern: string;
  raised: string; status: RingStatus; assignedTo?: string;
}

const ALERTS: Alert[] = FRAUD_RINGS.map((r, i) => ({
  id: `ALT-${String(2001 + i).padStart(4, '0')}`,
  ringId: r.id, severity: r.riskLevel, pattern: r.pattern,
  raised: r.firstSeen, status: r.status, assignedTo: r.assignedTo,
}));

export default function AlertsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = ALERTS.filter(a => {
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (search && !a.id.toLowerCase().includes(search.toLowerCase()) && !a.ringId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-400" /> Alerts
          </h1>
          <p className="text-surface-400 text-sm mt-0.5">Active system alerts — each linked to a detected fraud ring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-critical">{ALERTS.filter(a => a.severity === 'Critical').length} Critical</span>
          <span className="badge-high">{ALERTS.filter(a => a.severity === 'High').length} High</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input className="input-dark pl-8 w-full" placeholder="Search alert ID or ring..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Filter className="w-3.5 h-3.5 text-surface-500" />
        <select className="input-dark text-xs py-1.5" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(o => <option key={o}>{o === 'All' ? 'All Severities' : o}</option>)}
        </select>
        <select className="input-dark text-xs py-1.5" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {['All', 'New', 'In review', 'Escalated', 'Confirmed', 'Dismissed'].map(o => <option key={o}>{o === 'All' ? 'All Statuses' : o}</option>)}
        </select>
        <span className="text-xs text-surface-500 ml-auto">{filtered.length} alerts</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th><th>Ring</th><th>Severity</th><th>Pattern</th>
              <th>Raised</th><th>Assigned To</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(alert => (
              <tr key={alert.id} className="cursor-pointer" onClick={() => navigate(`/fraud-rings/${alert.ringId}`)}>
                <td><span className="font-mono text-sm text-surface-300">{alert.id}</span></td>
                <td><span className="font-mono text-brand-400 font-semibold text-sm">{alert.ringId}</span></td>
                <td><span className={RISK_COLORS[alert.severity]}>{alert.severity}</span></td>
                <td><span className="text-surface-300 text-sm">{alert.pattern}</span></td>
                <td>
                  <div className="flex items-center gap-1 text-surface-500 text-xs">
                    <Clock className="w-3 h-3" />{alert.raised}
                  </div>
                </td>
                <td>
                  {alert.assignedTo
                    ? <span className="text-surface-300 text-sm">{alert.assignedTo}</span>
                    : <span className="text-surface-600 text-sm italic">Unassigned</span>}
                </td>
                <td><span className={STATUS_CLS[alert.status]}>{alert.status}</span></td>
                <td>
                  <button className="btn-ghost py-1 px-2 text-xs">
                    <Shield className="w-3.5 h-3.5" /> Investigate <ChevronRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-surface-500">No alerts match current filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
