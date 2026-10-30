import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronDown, Shield, FileText, X, Clock, User, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AUDIT_LOG, MODEL_VERSIONS, AuditEntry, ModelVersion, UserRole } from '../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────

function roleBadge(role: UserRole) {
  const map: Record<UserRole, string> = {
    analyst: 'chip chip-blue',
    lead: 'chip chip-purple',
    admin: 'chip chip-orange',
    auditor: 'chip chip-green',
  };
  return <span className={map[role]}>{role}</span>;
}

function actionTypeBadge(type: AuditEntry['actionType']) {
  const map: Record<string, string> = {
    Login: 'chip chip-green',
    Logout: 'chip',
    Decision: 'chip chip-blue',
    'Rule Change': 'chip chip-orange',
    'Model Promotion': 'chip chip-purple',
    'User Change': 'chip chip-orange',
    'Data Export': 'chip',
    Assignment: 'chip chip-blue',
    System: 'chip',
  };
  return <span className={map[type] ?? 'chip'}>{type}</span>;
}

function modelStatusBadge(status: ModelVersion['status']) {
  const map = { Active: 'chip chip-green', Staging: 'chip chip-blue', Archived: 'chip' };
  return <span className={map[status]}>{status}</span>;
}

// ─── Case Dossier Modal ───────────────────────────────────────

interface DossierModalProps {
  entry: AuditEntry;
  onClose: () => void;
}

const CaseDossierModal: React.FC<DossierModalProps> = ({ entry, onClose }) => {
  const now = new Date('2026-10-30T10:00:00');
  const entryDate = new Date(entry.timestamp);
  const elapsed = Math.round((now.getTime() - entryDate.getTime()) / 60000);
  const elapsedStr = elapsed > 60 ? `${Math.round(elapsed / 60)}h ${elapsed % 60}m` : `${elapsed}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-surface-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-800">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Case Dossier — Read Only</h2>
              <p className="text-surface-400 text-sm">{entry.entity ?? 'N/A'} · {entry.timestamp}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Alert metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-800 rounded-lg p-4">
              <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Alert Time</p>
              <p className="text-white font-medium">{entry.timestamp}</p>
            </div>
            <div className="bg-surface-800 rounded-lg p-4">
              <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Time Elapsed</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-surface-400" />
                {elapsedStr} ago
              </p>
            </div>
            <div className="bg-surface-800 rounded-lg p-4">
              <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Entity</p>
              <p className="text-white font-medium">{entry.entity ?? '—'}</p>
            </div>
            <div className="bg-surface-800 rounded-lg p-4">
              <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Action Type</p>
              {actionTypeBadge(entry.actionType)}
            </div>
          </div>

          {/* Evidence snapshot */}
          <div className="bg-surface-800 rounded-lg p-4">
            <p className="text-surface-400 text-xs uppercase tracking-wider mb-3">Evidence Snapshot</p>
            <p className="text-white text-sm leading-relaxed">{entry.details}</p>
          </div>

          {/* Decision chain */}
          <div className="bg-surface-800 rounded-lg p-4">
            <p className="text-surface-400 text-xs uppercase tracking-wider mb-3">Decision Chain</p>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs text-white font-medium">
                  {entry.user.split(' ').map(w => w[0]).join('')}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">{entry.user}</span>
                  {roleBadge(entry.role)}
                </div>
                <p className="text-surface-300 text-sm">{entry.action}</p>
                {entry.comment && (
                  <p className="text-surface-400 text-xs mt-1 italic">"{entry.comment}"</p>
                )}
                <p className="text-surface-500 text-xs mt-1">{entry.timestamp}</p>
              </div>
            </div>
          </div>

          {/* Auditor note */}
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Auditor View — Read Only</span>
            </div>
            <p className="text-surface-300 text-xs">
              This dossier is a read-only snapshot for audit purposes. No investigation controls are available from this view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

type Tab = 'audit' | 'models';

const ACTION_TYPES: AuditEntry['actionType'][] = [
  'Login', 'Logout', 'Decision', 'Rule Change', 'Model Promotion', 'User Change', 'Data Export', 'Assignment', 'System',
];

const AuditLogPage: React.FC = () => {
  const { auditLog } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('audit');

  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // Dossier modal
  const [dossierEntry, setDossierEntry] = useState<AuditEntry | null>(null);

  const uniqueUsers = useMemo(() => Array.from(new Set(auditLog.map(e => e.user))).sort(), [auditLog]);

  const filtered = useMemo(() => {
    return auditLog.filter(e => {
      if (userFilter && e.user !== userFilter) return false;
      if (typeFilter && e.actionType !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.user.toLowerCase().includes(q) && !e.action.toLowerCase().includes(q) && !(e.entity ?? '').toLowerCase().includes(q) && !e.details.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [auditLog, userFilter, typeFilter, search, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Action Type', 'Entity', 'Details', 'Comment'];
    const rows = filtered.map(e => [e.id, e.timestamp, e.user, e.role, e.action, e.actionType, e.entity ?? '', e.details, e.comment]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-surface-400 text-sm mt-1">Immutable record of all system activity · Read-only view</p>
        </div>
        <button onClick={handleExportCSV} className="btn-outline flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-800 rounded-lg w-fit">
        {([['audit', 'Audit Log'], ['models', 'Model Registry']] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-surface-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── AUDIT LOG TAB ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="glass-card p-4 rounded-xl flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search user, action, entity…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-dark pl-9 w-full"
              />
            </div>

            {/* User dropdown */}
            <div className="relative">
              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                className="input-dark pr-8 appearance-none cursor-pointer"
              >
                <option value="">All Users</option>
                {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            </div>

            {/* Action type dropdown */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="input-dark pr-8 appearance-none cursor-pointer"
              >
                <option value="">All Action Types</option>
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            </div>

            {/* Date range */}
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-dark" />
            <span className="text-surface-500 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-dark" />

            {(userFilter || typeFilter || search || dateFrom || dateTo) && (
              <button
                onClick={() => { setUserFilter(''); setTypeFilter(''); setSearch(''); setDateFrom(''); setDateTo(''); }}
                className="btn-ghost text-sm flex items-center gap-1"
              >
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
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>Comment</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-surface-500 py-12">No audit entries match the current filters.</td>
                    </tr>
                  ) : (
                    filtered.map(entry => (
                      <tr key={entry.id} className="hover:bg-surface-800/50 transition-colors">
                        <td className="text-surface-300 whitespace-nowrap text-xs">{entry.timestamp}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                              {entry.user.split(' ').map(w => w[0]).join('')}
                            </div>
                            <span className="text-white text-sm whitespace-nowrap">{entry.user}</span>
                          </div>
                        </td>
                        <td>{roleBadge(entry.role)}</td>
                        <td>
                          {entry.actionType === 'Decision' && entry.entity ? (
                            <button
                              onClick={() => setDossierEntry(entry)}
                              className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 text-left"
                            >
                              {entry.action}
                            </button>
                          ) : (
                            <span className="text-white text-sm">{entry.action}</span>
                          )}
                        </td>
                        <td>
                          {entry.entity ? (
                            <span className="chip chip-blue text-xs">{entry.entity}</span>
                          ) : (
                            <span className="text-surface-500">—</span>
                          )}
                        </td>
                        <td className="text-surface-300 text-xs max-w-[250px] truncate" title={entry.details}>
                          {entry.details}
                        </td>
                        <td className="text-surface-400 text-xs max-w-[200px] truncate italic" title={entry.comment}>
                          {entry.comment || '—'}
                        </td>
                        <td>{actionTypeBadge(entry.actionType)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-surface-700 text-surface-500 text-xs">
              Showing {filtered.length} of {auditLog.length} entries
            </div>
          </div>
        </div>
      )}

      {/* ── MODEL REGISTRY TAB ── */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm">Auditor view — Model promotion and rollback controls are not available from this interface.</p>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Model Name</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Trained On</th>
                    <th>Promoted By</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1</th>
                    <th>AUC-PR</th>
                    <th>Training Labels</th>
                    <th>Dataset Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_VERSIONS.map(mv => (
                    <tr key={mv.id} className="hover:bg-surface-800/50 transition-colors">
                      <td className="text-white font-medium">{mv.name}</td>
                      <td><span className="chip">{mv.version}</span></td>
                      <td>{modelStatusBadge(mv.status)}</td>
                      <td className="text-surface-300 text-sm whitespace-nowrap">{mv.trainedOn}</td>
                      <td className="text-surface-300 text-sm">{mv.promotedBy ?? '—'}</td>
                      <td>
                        <span className={mv.precision >= 0.85 ? 'text-green-400 font-medium' : mv.precision >= 0.75 ? 'text-yellow-400' : 'text-red-400'}>
                          {(mv.precision * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={mv.recall >= 0.80 ? 'text-green-400 font-medium' : mv.recall >= 0.70 ? 'text-yellow-400' : 'text-red-400'}>
                          {(mv.recall * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-white">{mv.f1.toFixed(3)}</td>
                      <td className="text-white">{mv.aucPR.toFixed(3)}</td>
                      <td className="text-surface-300">{mv.labelCount.toLocaleString()}</td>
                      <td className="text-surface-400 font-mono text-xs">{mv.datasetHash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dossier Modal */}
      {dossierEntry && (
        <CaseDossierModal entry={dossierEntry} onClose={() => setDossierEntry(null)} />
      )}
    </div>
  );
};

export default AuditLogPage;
