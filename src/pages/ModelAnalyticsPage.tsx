import React, { useState } from 'react';
import {
  Brain, TrendingUp, RotateCcw, Play, ChevronUp, ChevronDown,
  CheckCircle, AlertTriangle, Info, X, Loader2, Award,
  ArrowUpCircle, BarChart3, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { MODEL_VERSIONS, ALERT_PRECISION_TREND, ModelVersion } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────
const computeF1 = (precision: number, recall: number): number => {
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
};

const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;

const activeModel = MODEL_VERSIONS.find(m => m.status === 'Active')!;

// ─── Drift Indicator ──────────────────────────────────────────
const DriftIndicator: React.FC<{ drift: number }> = ({ drift }) => {
  let label: string, cls: string;
  if (drift < 0.05) { label = 'Stable'; cls = 'chip chip-green'; }
  else if (drift < 0.1) { label = 'Slight'; cls = 'chip chip-orange'; }
  else { label = 'High'; cls = 'chip chip-red'; }
  return (
    <span className={`${cls} flex items-center gap-1 w-fit`}>
      <span className="font-mono">{drift.toFixed(3)}</span>
      <span>{label}</span>
    </span>
  );
};

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: ModelVersion['status'] }> = ({ status }) => {
  const map: Record<ModelVersion['status'], string> = {
    Active: 'chip chip-green',
    Staging: 'chip chip-blue',
    Archived: 'chip chip-purple',
  };
  return <span className={map[status]}>{status}</span>;
};

// ─── Promote Tooltip Wrapper ──────────────────────────────────
const PromoteButton: React.FC<{
  model: ModelVersion;
  onPromote: (model: ModelVersion) => void;
}> = ({ model, onPromote }) => {
  const [showTip, setShowTip] = useState(false);
  const eligible = model.aucPR >= activeModel.aucPR - 0.01;
  const isActive = model.status === 'Active';

  if (isActive) return (
    <span className="text-xs text-slate-600 italic">Current</span>
  );

  return (
    <div className="relative inline-block">
      <button
        disabled={!eligible}
        onClick={() => eligible && onPromote(model)}
        onMouseEnter={() => !eligible && setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={`btn-primary text-xs px-2 py-1.5 flex items-center gap-1 transition-all
          ${!eligible ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <ArrowUpCircle size={12} />Promote
      </button>
      {showTip && !eligible && (
        <div className="absolute bottom-full left-0 mb-2 w-52 px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 shadow-xl z-20 text-xs text-slate-300">
          <Info size={11} className="inline mr-1 text-amber-400" />
          AUC-PR {model.aucPR.toFixed(3)} is more than 0.01 below active model ({activeModel.aucPR.toFixed(3)}). Promotion blocked.
        </div>
      )}
    </div>
  );
};

// ─── Train New Model Modal ────────────────────────────────────
const TrainModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phase, setPhase] = useState<'config' | 'running' | 'done'>('config');
  const [progress, setProgress] = useState(0);

  const handleStart = () => {
    setPhase('running');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase('done');
          return 100;
        }
        return prev + 2;
      });
    }, 80);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Brain size={16} className="text-purple-400" />
            Train New Model
          </h3>
          {phase !== 'running' && (
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
          )}
        </div>

        {phase === 'config' && (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Model Architecture</label>
                <select className="input-dark w-full">
                  <option>Graph Neural Network (GNN)</option>
                  <option>XGBoost Ensemble</option>
                  <option>Isolation Forest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Train/Val/Test Split</label>
                <select className="input-dark w-full">
                  <option>Temporal 70/15/15</option>
                  <option>Random 80/20</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Include Labels</label>
                <input className="input-dark w-full" defaultValue="All confirmed rings (Oct 2026)" readOnly />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Training Note</label>
                <textarea className="input-dark w-full h-16 resize-none" placeholder="e.g. Retrain after new analyst batch…" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
              <button onClick={handleStart} className="btn-primary text-sm flex items-center gap-1.5">
                <Play size={13} />Start Training
              </button>
            </div>
          </>
        )}

        {phase === 'running' && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 size={24} className="text-purple-400 animate-spin" />
              <span className="text-sm text-slate-300">Training GNN… {progress}%</span>
            </div>
            <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress < 30 && <p className="text-xs text-center text-slate-500">Loading graph features…</p>}
            {progress >= 30 && progress < 65 && <p className="text-xs text-center text-slate-500">Training epoch {Math.floor((progress - 30) / 3.5) + 1}/10…</p>}
            {progress >= 65 && progress < 90 && <p className="text-xs text-center text-slate-500">Evaluating on validation set…</p>}
            {progress >= 90 && <p className="text-xs text-center text-slate-500">Computing final metrics…</p>}
          </div>
        )}

        {phase === 'done' && (
          <div className="py-4 text-center space-y-4">
            <CheckCircle size={40} className="text-green-400 mx-auto" />
            <div>
              <p className="text-base font-bold text-white">Training Complete!</p>
              <p className="text-xs text-slate-400 mt-1">New model staged for review</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Precision', value: '89.2%' },
                { label: 'Recall', value: '83.1%' },
                { label: 'AUC-PR', value: '0.921' },
              ].map(m => (
                <div key={m.label} className="bg-surface-800 rounded-xl p-3">
                  <p className="text-base font-bold text-green-400">{m.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="btn-primary w-full flex items-center justify-center gap-2">
              <CheckCircle size={14} />View in Model Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Promote Confirm Modal ────────────────────────────────────
const PromoteModal: React.FC<{
  model: ModelVersion;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ model, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="glass-card w-full max-w-sm p-6 shadow-2xl">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-500/20">
          <Award size={18} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Promote {model.name} {model.version}?</h3>
          <p className="text-xs text-slate-400 mt-0.5">AUC-PR: {model.aucPR.toFixed(3)} vs current {activeModel.aucPR.toFixed(3)}</p>
        </div>
      </div>
      <p className="text-xs text-slate-300 mb-4">
        Promoting this model will replace the current active model ({activeModel.version}). The previous model will be archived. This action is logged.
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
        <button onClick={onConfirm} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5">
          <ArrowUpCircle size={13} />Promote
        </button>
      </div>
    </div>
  </div>
);

// ─── Custom Chart Tooltip ─────────────────────────────────────
const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-slate-300">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{formatPct(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const ModelAnalyticsPage: React.FC = () => {
  const { addAuditEntry, user } = useAuth();
  const [models, setModels] = useState<ModelVersion[]>(MODEL_VERSIONS);
  const [trainModalOpen, setTrainModalOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<ModelVersion | null>(null);
  const [sortKey, setSortKey] = useState<keyof ModelVersion>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSort = (key: keyof ModelVersion) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortedModels = [...models].sort((a, b) => {
    const av = a[sortKey] as any;
    const bv = b[sortKey] as any;
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon: React.FC<{ field: keyof ModelVersion }> = ({ field }) => {
    if (sortKey !== field) return <ChevronDown size={11} className="text-slate-600" />;
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-blue-400" />
      : <ChevronDown size={11} className="text-blue-400" />;
  };

  const handlePromoteConfirm = () => {
    if (!promoteTarget) return;
    const target = promoteTarget;

    setModels(prev =>
      prev.map(m => {
        if (m.status === 'Active') return { ...m, status: 'Archived' };
        if (m.id === target.id) return { ...m, status: 'Active', promotedBy: user?.name ?? 'Mei Lin' };
        return m;
      })
    );

    addAuditEntry({
      user: user?.name ?? 'Mei Lin',
      role: user?.role ?? 'admin',
      action: 'Model Promotion',
      actionType: 'Model Promotion',
      entity: `${target.name} ${target.version}`,
      details: `Promoted ${target.name} ${target.version} (AUC-PR: ${target.aucPR}). Previous model ${activeModel.version} archived.`,
      comment: `Model promoted after performance review. AUC-PR ${target.aucPR} ≥ ${(activeModel.aucPR - 0.01).toFixed(3)}.`,
    });

    showToast(`${target.name} ${target.version} promoted to Active.`);
    setPromoteTarget(null);
  };

  const handleRollBack = (model: ModelVersion) => {
    addAuditEntry({
      user: user?.name ?? 'Mei Lin',
      role: user?.role ?? 'admin',
      action: 'Model Roll Back',
      actionType: 'Model Promotion',
      entity: `${model.name} ${model.version}`,
      details: `Initiated rollback to ${model.name} ${model.version}.`,
      comment: 'Rollback requested via Model Analytics dashboard.',
    });
    showToast(`Rollback to ${model.version} initiated (demo).`);
  };

  const thCls = "text-left py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider select-none";
  const thBtn = (field: keyof ModelVersion) => (
    <button
      className="flex items-center gap-1 hover:text-slate-200 transition-colors"
      onClick={() => handleSort(field)}
    >
      {field.charAt(0).toUpperCase() + field.slice(1)} <SortIcon field={field} />
    </button>
  );

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg shadow-xl text-sm flex items-center gap-2">
          <CheckCircle size={16} />{toastMsg}
        </div>
      )}

      {/* Modals */}
      {trainModalOpen && <TrainModal onClose={() => setTrainModalOpen(false)} />}
      {promoteTarget && (
        <PromoteModal
          model={promoteTarget}
          onConfirm={handlePromoteConfirm}
          onClose={() => setPromoteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-400" />
            Model Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Infrastructure &amp; ML Ops · Mei Lin</p>
        </div>
        <button
          onClick={() => setTrainModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Play size={14} />Train New Model
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="flex flex-wrap gap-4">
        <div className="kpi-card flex-1 min-w-[150px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Active Model</p>
          <p className="text-base font-bold text-white">{activeModel.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{activeModel.version}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[150px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">AUC-PR</p>
          <p className="text-3xl font-bold text-purple-400">{activeModel.aucPR.toFixed(3)}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[150px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Precision</p>
          <p className="text-3xl font-bold text-green-400">{formatPct(activeModel.precision)}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[150px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Recall</p>
          <p className="text-3xl font-bold text-blue-400">{formatPct(activeModel.recall)}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[150px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">F1 Score</p>
          <p className="text-3xl font-bold text-amber-400">
            {formatPct(computeF1(activeModel.precision, activeModel.recall))}
          </p>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={15} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Model Comparison</h2>
          <span className="ml-auto text-xs text-slate-500">Click column headers to sort · F1 = 2PR/(P+R)</span>
        </div>
        <div className="data-table overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr>
                <th className={thCls}>{thBtn('name')}</th>
                <th className={thCls}>Version</th>
                <th className={thCls}>{thBtn('precision')}</th>
                <th className={thCls}>{thBtn('recall')}</th>
                <th className={thCls}>F1</th>
                <th className={thCls}>{thBtn('aucPR')}</th>
                <th className={thCls}>Ring Recall</th>
                <th className={thCls}>Labels</th>
                <th className={thCls}>Split</th>
                <th className={thCls}>Drift</th>
                <th className={thCls}>{thBtn('status')}</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map(model => {
                const f1 = computeF1(model.precision, model.recall);
                const isActive = model.status === 'Active';
                const isArchived = model.status === 'Archived';
                return (
                  <tr
                    key={model.id}
                    className={`border-t border-surface-700 transition-colors
                      ${isActive ? 'bg-purple-900/10 hover:bg-purple-900/20' : 'hover:bg-surface-800/40'}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isActive && <Award size={13} className="text-purple-400 shrink-0" />}
                        <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {model.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{model.version}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold ${model.precision >= 0.85 ? 'text-green-400' : model.precision >= 0.75 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatPct(model.precision)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold ${model.recall >= 0.80 ? 'text-green-400' : model.recall >= 0.70 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatPct(model.recall)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold ${f1 >= 0.82 ? 'text-green-400' : f1 >= 0.75 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatPct(f1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-300 font-semibold">
                      {model.aucPR.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">{formatPct(model.ringRecall)}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{model.labelCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{model.split}</td>
                    <td className="py-3 px-4"><DriftIndicator drift={model.drift} /></td>
                    <td className="py-3 px-4"><StatusBadge status={model.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {!isActive && !isArchived && (
                          <PromoteButton model={model} onPromote={setPromoteTarget} />
                        )}
                        {isActive && (
                          <span className="text-xs text-slate-600 italic">Active</span>
                        )}
                        {isArchived && (
                          <button
                            onClick={() => handleRollBack(model)}
                            className="btn-outline text-xs px-2 py-1.5 flex items-center gap-1 text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                          >
                            <RotateCcw size={11} />Roll Back
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Precision Trend Chart */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={15} className="text-green-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Alert Precision &amp; Recall Trend</h2>
          <span className="ml-auto text-xs text-slate-500">Weeks W38–W44, 2026 · Active model</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={ALERT_PRECISION_TREND} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              domain={[0.6, 1.0]}
              tickFormatter={v => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-slate-300 capitalize">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="precision"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              name="Precision"
            />
            <Line
              type="monotone"
              dataKey="recall"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              name="Recall"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Drift + Dataset Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Model Drift Summary</h2>
          </div>
          <div className="space-y-3">
            {models.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-medium truncate">{m.name}</span>
                    <span className="text-xs text-slate-600 font-mono">{m.version}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.drift < 0.05 ? 'bg-green-500' : m.drift < 0.1 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(m.drift * 500, 100)}%` }}
                    />
                  </div>
                </div>
                <DriftIndicator drift={m.drift} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={15} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Dataset Details — Active Model</h2>
          </div>
          <dl className="space-y-2.5">
            {[
              { label: 'Model', value: `${activeModel.name} ${activeModel.version}` },
              { label: 'Trained On', value: activeModel.trainedOn },
              { label: 'Promoted By', value: activeModel.promotedBy ?? '—' },
              { label: 'Label Count', value: activeModel.labelCount.toLocaleString() },
              { label: 'Train/Val/Test Split', value: activeModel.split },
              { label: 'Dataset Hash', value: activeModel.datasetHash },
              { label: 'Ring Recall', value: formatPct(activeModel.ringRecall) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-slate-200 font-medium font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Footer Note */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 text-xs text-slate-400">
        <Clock size={13} className="text-blue-400 mt-0.5 shrink-0" />
        All model promotion and rollback actions are recorded in the audit log with timestamp, user, and model metrics. Promotion is blocked if the candidate model's AUC-PR is more than 0.01 below the current active model.
      </div>
    </div>
  );
};

export default ModelAnalyticsPage;
