import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, X, ClipboardCheck, AlertTriangle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FRAUD_RINGS, FraudRing, RingStatus } from '../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────

function statusBadge(status: RingStatus) {
  const map: Record<RingStatus, string> = {
    'New': 'status-new',
    'In review': 'status-in-review',
    'Escalated': 'status-escalated',
    'Confirmed': 'status-confirmed',
    'Dismissed': 'status-dismissed',
  };
  return <span className={map[status]}>{status}</span>;
}

function riskBadge(level: string) {
  const map: Record<string, string> = {
    Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical',
  };
  return <span className={map[level] ?? 'chip'}>{level}</span>;
}

function formatVolume(v: number) {
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`;
}

function calcDuration(firstSeen: string, status: RingStatus): string {
  if (status === 'New') return '—';
  const start = new Date(firstSeen.replace(',', ''));
  const end = new Date('2026-10-30');
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  return `${days}d`;
}

// ─── Quality Review Modal ─────────────────────────────────────

interface QRModalProps {
  ring: FraudRing;
  onClose: () => void;
}

const QualityReviewModal: React.FC<QRModalProps> = ({ ring, onClose }) => {
  const { addAuditEntry, user } = useAuth();
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!note.trim()) return;
    addAuditEntry({
      user: user?.name ?? 'Kenji Sato',
      role: user?.role ?? 'lead',
      action: 'Quality Review',
      actionType: 'Decision',
      entity: ring.id,
      details: `Spot-check quality review completed for ring ${ring.id}.`,
      comment: note.trim(),
    });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg rounded-xl border border-surface-700">
        <div className="flex items-center justify-between p-6 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-semibold">Quality Review — {ring.id}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-medium">Quality review submitted</p>
            <p className="text-surface-400 text-sm">Review note logged to audit trail.</p>
            <button onClick={onClose} className="btn-primary mt-4">Close</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-surface-800 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-400">Pattern</span>
                <span className="text-white">{ring.pattern}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Status</span>
                {statusBadge(ring.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Analyst</span>
                <span className="text-white">{ring.assignedTo ?? 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Volume</span>
                <span className="text-white">{formatVolume(ring.totalVolume)}</span>
              </div>
            </div>

            <div>
              <label className="block text-surface-400 text-sm mb-1">Review Note</label>
              <textarea
                rows={4}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="input-dark w-full resize-none"
                placeholder="Enter quality review observations…"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={!note.trim()} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                Submit Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

const ALL_PATTERNS = Array.from(new Set(FRAUD_RINGS.map(r => r.pattern)));
const ALL_STATUSES: RingStatus[] = ['New', 'In review', 'Escalated', 'Confirmed', 'Dismissed'];
const REASON_CODES = ['fan_in', 'circular_flow_3hop', 'rapid_pass_through', 'mule_chain_5hop', 'structuring_below_10k', 'layering_8hop', 'cross_border_velocity'];

const InvestigationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLead = user?.role === 'lead' || user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [analystFilter, setAnalystFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [qrRing, setQrRing] = useState<FraudRing | null>(null);
  const [exportToast, setExportToast] = useState(false);

  const analysts = Array.from(new Set(FRAUD_RINGS.filter(r => r.assignedTo).map(r => r.assignedTo!))).sort();

  const filtered = useMemo(() => {
    return FRAUD_RINGS.filter(r => {
      if (analystFilter && r.assignedTo !== analystFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (reasonFilter && !r.rulesFired.includes(reasonFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !r.pattern.toLowerCase().includes(q) && !(r.assignedTo ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, analystFilter, statusFilter, reasonFilter, dateFrom, dateTo]);

  const confirmed = filtered.filter(r => r.status === 'Confirmed');

  const handleExportPDF = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  const clearFilters = () => { setSearch(''); setAnalystFilter(''); setStatusFilter(''); setReasonFilter(''); setDateFrom(''); setDateTo(''); };
  const hasFilters = search || analystFilter || statusFilter || reasonFilter || dateFrom || dateTo;

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {exportToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-surface-800 border border-green-500/40 text-green-400 px-4 py-3 rounded-lg shadow-lg">
          <Check className="w-4 h-4" />
          PDF export prepared ({confirmed.length} confirmed cases).
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investigations</h1>
          <p className="text-surface-400 text-sm mt-1">
            {filtered.length} investigation{filtered.length !== 1 ? 's' : ''} · {FRAUD_RINGS.filter(r => r.status === 'In review').length} in review
          </p>
        </div>
        <button onClick={handleExportPDF} className="btn-outline flex items-center gap-2" disabled={confirmed.length === 0}>
          <Download className="w-4 h-4" />
          Export PDF ({confirmed.length} confirmed)
        </button>
      </div>

      {/* Filter bar */}
      <div className="glass-card p-4 rounded-xl flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search ring, pattern…" value={search} onChange={e => setSearch(e.target.value)} className="input-dark pl-9 w-full" />
        </div>

        <div className="relative">
          <select value={analystFilter} onChange={e => setAnalystFilter(e.target.value)} className="input-dark pr-8 appearance-none cursor-pointer">
            <option value="">All Analysts</option>
            {analysts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-dark pr-8 appearance-none cursor-pointer">
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)} className="input-dark pr-8 appearance-none cursor-pointer">
            <option value="">All Reason Codes</option>
            {REASON_CODES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        </div>

        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-dark" />
        <span className="text-surface-500 text-sm">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-dark" />

        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost text-sm flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Ring ID</th>
                <th>Analyst</th>
                <th>Status</th>
                <th>Pattern</th>
                <th>Risk</th>
                <th>Volume</th>
                <th>Opened</th>
                <th>Duration</th>
                <th>Reason Codes</th>
                {isLead && <th>Quality Review</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isLead ? 10 : 9} className="text-center text-surface-500 py-12">
                    No investigations match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map(ring => (
                  <tr key={ring.id} className="hover:bg-surface-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/ring/${ring.id}`)}>
                    <td>
                      <span className="text-blue-400 font-medium hover:text-blue-300">{ring.id}</span>
                    </td>
                    <td>
                      {ring.assignedTo ? (
                        <span className="text-white text-sm">{ring.assignedTo}</span>
                      ) : (
                        <span className="text-surface-500 text-sm italic">Unassigned</span>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>{statusBadge(ring.status)}</td>
                    <td className="text-surface-300 text-sm">{ring.pattern}</td>
                    <td onClick={e => e.stopPropagation()}>{riskBadge(ring.riskLevel)}</td>
                    <td className="text-white font-medium">{formatVolume(ring.totalVolume)}</td>
                    <td className="text-surface-400 text-xs whitespace-nowrap">{ring.firstSeen}</td>
                    <td className="text-surface-300 text-sm">{calcDuration(ring.firstSeen, ring.status)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        {ring.status === 'Dismissed'
                          ? ring.rulesFired.slice(0, 2).map(r => <span key={r} className="chip text-xs">{r}</span>)
                          : ring.keyReasons.slice(0, 1).map(r => <span key={r} className="chip chip-blue text-xs">{r}</span>)
                        }
                      </div>
                    </td>
                    {isLead && (
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setQrRing(ring)}
                          className="btn-ghost text-xs flex items-center gap-1 px-3 py-1.5"
                        >
                          <ClipboardCheck className="w-3 h-3" />
                          Spot-check
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-surface-700 text-surface-500 text-xs">
          {filtered.length} of {FRAUD_RINGS.length} investigations shown
        </div>
      </div>

      {/* Quality Review Modal */}
      {qrRing && (
        <QualityReviewModal ring={qrRing} onClose={() => setQrRing(null)} />
      )}
    </div>
  );
};

export default InvestigationsPage;
