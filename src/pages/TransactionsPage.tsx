import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Search, Filter, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { TRANSACTIONS, Transaction } from '../data/mockData';

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold w-7 text-right" style={{ color }}>{score}</span>
      <div className="w-16 h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

const STATUS_CLS: Record<string, string> = {
  'Flagged': 'badge-high', 'Under Review': 'status-in-review', 'Normal': 'badge-low',
};

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => TRANSACTIONS.filter(t => {
    if (typeFilter !== 'All' && t.type !== typeFilter) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!t.id.toLowerCase().includes(s) && !t.from.toLowerCase().includes(s) && !t.to.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [search, typeFilter, statusFilter]);

  const types = [...new Set(TRANSACTIONS.map(t => t.type))];
  const statuses = [...new Set(TRANSACTIONS.map(t => t.status))];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-400" /> Transactions
          </h1>
          <p className="text-surface-400 text-sm mt-0.5">All pseudonymous — no real names or PII displayed</p>
        </div>
        <div className="flex gap-2 text-xs text-surface-500">
          <span className="badge-high">{TRANSACTIONS.filter(t => t.status === 'Flagged').length} Flagged</span>
          <span className="status-in-review">{TRANSACTIONS.filter(t => t.status === 'Under Review').length} In Review</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input className="input-dark pl-8 w-full" placeholder="Search TXN-XXXX, ACC-XXXX..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Filter className="w-3.5 h-3.5 text-surface-500" />
        <select className="input-dark text-xs py-1.5" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input-dark text-xs py-1.5" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-surface-500 ml-auto">{filtered.length} transactions</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>TXN ID</th><th>From → To</th><th>Amount</th>
              <th>Risk Score</th><th>Ring</th><th>Type</th><th>Status</th><th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(txn => (
              <tr key={txn.id}>
                <td><span className="font-mono text-surface-400 text-sm">{txn.id}</span></td>
                <td>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-mono text-surface-200">{txn.from}</span>
                    <ArrowRight className="w-3 h-3 text-surface-500 shrink-0" />
                    <span className="font-mono text-surface-200">{txn.to}</span>
                  </div>
                </td>
                <td>
                  <span className="text-surface-200 font-semibold text-sm">
                    ${txn.amount.toLocaleString()}
                  </span>
                </td>
                <td><RiskBar score={txn.riskScore} /></td>
                <td>
                  {txn.ring
                    ? <button onClick={() => navigate(`/fraud-rings/${txn.ring}`)}
                        className="font-mono text-brand-400 text-xs hover:underline flex items-center gap-1">
                        <Shield className="w-3 h-3" />{txn.ring}
                      </button>
                    : <span className="text-surface-600 text-xs">—</span>}
                </td>
                <td><span className="text-surface-400 text-sm">{txn.type}</span></td>
                <td>
                  <span className={STATUS_CLS[txn.status] ?? 'text-surface-400 text-xs'}>{txn.status}</span>
                </td>
                <td><span className="text-surface-500 text-xs">{txn.timestamp}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-surface-500">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No transactions match the current filters
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
