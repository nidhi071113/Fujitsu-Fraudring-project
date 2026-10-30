import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, ChevronRight, Shield, TrendingUp, Clock } from 'lucide-react';
import { ACCOUNTS, Account, RiskLevel } from '../data/mockData';

const RISK_BADGE: Record<RiskLevel, string> = {
  Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low',
};
const RISK_COLOR: Record<RiskLevel, string> = {
  Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e',
};

function RiskRing({ score, level }: { score: number; level: RiskLevel }) {
  const r = 12, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle cx="16" cy="16" r={r} fill="none" stroke={RISK_COLOR[level]} strokeWidth="3"
          strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <span className="text-sm font-bold" style={{ color: RISK_COLOR[level] }}>{score}</span>
    </div>
  );
}

export default function AccountsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState<Account | null>(null);

  const filtered = useMemo(() => ACCOUNTS.filter(a => {
    if (riskFilter !== 'All' && a.riskLevel !== riskFilter) return false;
    if (typeFilter !== 'All' && a.type !== typeFilter) return false;
    if (search && !a.id.toLowerCase().includes(search.toLowerCase()) && !a.customerId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, riskFilter, typeFilter]);

  const types = [...new Set(ACCOUNTS.map(a => a.type))];

  return (
    <div className="p-6 space-y-5 flex gap-5">
      {/* Main */}
      <div className="flex-1 space-y-5 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-400" /> Accounts
            </h1>
            <p className="text-surface-400 text-sm mt-0.5">Pseudonymous account profiles — all PII removed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
            <input className="input-dark pl-8 w-full" placeholder="Search ACC-XXXX or CUST-XXXX..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Filter className="w-3.5 h-3.5 text-surface-500" />
          <select className="input-dark text-xs py-1.5" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
            {['All','Critical','High','Medium','Low'].map(o => <option key={o}>{o === 'All' ? 'All Risk Levels' : o}</option>)}
          </select>
          <select className="input-dark text-xs py-1.5" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
          <span className="text-xs text-surface-500 ml-auto">{filtered.length} accounts</span>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account ID</th><th>Customer ID</th><th>Type</th><th>Age</th>
                <th>Risk Score</th><th>Risk Level</th><th>Ring</th><th>Volume</th><th>Devices</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(acc => (
                <tr key={acc.id} className="cursor-pointer" onClick={() => setSelected(acc)}>
                  <td><span className="font-mono text-brand-400 font-semibold">{acc.id}</span></td>
                  <td><span className="font-mono text-surface-300 text-sm">{acc.customerId}</span></td>
                  <td><span className="text-surface-400 text-sm">{acc.type}</span></td>
                  <td>
                    <div className="flex items-center gap-1 text-surface-500 text-xs">
                      <Clock className="w-3 h-3" />{acc.age}d
                    </div>
                  </td>
                  <td><RiskRing score={acc.riskScore} level={acc.riskLevel} /></td>
                  <td><span className={RISK_BADGE[acc.riskLevel]}>{acc.riskLevel}</span></td>
                  <td>
                    {acc.ring
                      ? <button onClick={e => { e.stopPropagation(); navigate(`/fraud-rings/${acc.ring}`); }}
                          className="font-mono text-brand-400 text-xs hover:underline flex items-center gap-1">
                          <Shield className="w-3 h-3" />{acc.ring}
                        </button>
                      : <span className="text-surface-600 text-xs">—</span>}
                  </td>
                  <td><span className="text-surface-300 text-sm">${(acc.totalVolume / 1000).toFixed(0)}K</span></td>
                  <td><span className="text-surface-400 text-sm">{acc.deviceCount}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Sidebar */}
      {selected && (
        <div className="w-80 shrink-0 glass-card p-5 space-y-4 animate-slide-in-right self-start sticky top-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-surface-100">{selected.id}</h3>
            <button onClick={() => setSelected(null)} className="text-surface-500 hover:text-surface-300 text-lg leading-none">×</button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Customer ID</span>
              <span className="font-mono text-surface-200">{selected.customerId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Account Type</span>
              <span className="text-surface-200">{selected.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Account Age</span>
              <span className="text-surface-200">{selected.age} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Total Volume</span>
              <span className="text-surface-200">${selected.totalVolume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Inflow</span>
              <span className="text-green-400">${selected.inflow.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Outflow</span>
              <span className="text-red-400">${selected.outflow.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Risk Score</span>
              <span className="font-bold" style={{ color: RISK_COLOR[selected.riskLevel] }}>{selected.riskScore}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Risk Level</span>
              <span className={RISK_BADGE[selected.riskLevel]}>{selected.riskLevel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Connected Devices</span>
              <span className="text-surface-200">{selected.deviceCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Transactions</span>
              <span className="text-surface-200">{selected.transactionCount}</span>
            </div>
            {selected.ring && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Current Ring</span>
                <button onClick={() => navigate(`/fraud-rings/${selected.ring}`)} className="font-mono text-brand-400 hover:underline flex items-center gap-1">
                  <Shield className="w-3 h-3" />{selected.ring}
                </button>
              </div>
            )}
            {selected.role && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Role in Ring</span>
                <span className="chip chip-orange">{selected.role}</span>
              </div>
            )}
          </div>
          {selected.ring && (
            <button onClick={() => navigate(`/fraud-rings/${selected.ring}`)} className="btn-primary w-full text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> View Ring Detail <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
