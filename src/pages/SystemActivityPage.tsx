import React, { useState, useRef } from 'react';
import {
  Server, Database, Cpu, Activity, Upload, CheckCircle2,
  Play, RefreshCw, Eye, AlertTriangle, Clock, ChevronRight,
  Circle, Loader2, XCircle, CheckCircle, Zap
} from 'lucide-react';
import { SYSTEM_JOBS, MODEL_VERSIONS, SystemJob } from '../data/mockData';

// ─── Types ───────────────────────────────────────────────────
type ServiceStatus = 'Healthy' | 'Degraded' | 'Down';
type PipelineStage = 'idle' | 'validate' | 'clean' | 'hash' | 'load' | 'done' | 'error';
type JobStatus = 'Completed' | 'Running' | 'Failed';

interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  detail: string;
  icon: React.ReactNode;
}

// ─── Constants ───────────────────────────────────────────────
const SERVICES: ServiceHealth[] = [
  { name: 'API Server', status: 'Healthy', detail: 'Latency 42ms', icon: <Server size={18} /> },
  { name: 'Neo4j Graph DB', status: 'Healthy', detail: '1.2M nodes', icon: <Database size={18} /> },
  { name: 'SQL Database', status: 'Healthy', detail: 'Replica lag 0ms', icon: <Database size={18} /> },
  { name: 'ML Model Service', status: 'Healthy', detail: 'GNN v2.3.1 active', icon: <Cpu size={18} /> },
];

const PIPELINE_STAGES: { key: PipelineStage; label: string; duration: number }[] = [
  { key: 'validate', label: 'Validate', duration: 1200 },
  { key: 'clean', label: 'Clean', duration: 1400 },
  { key: 'hash', label: 'Hash Personal Data', duration: 1000 },
  { key: 'load', label: 'Load into Graph', duration: 1800 },
];

const ACTIVE_MODEL = MODEL_VERSIONS.find(m => m.status === 'Active')!;

// ─── Helper: Status Badge ─────────────────────────────────────
const JobBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const map: Record<JobStatus, { cls: string; icon: React.ReactNode }> = {
    Completed: { cls: 'chip chip-green', icon: <CheckCircle2 size={11} /> },
    Running: { cls: 'chip chip-blue', icon: <Loader2 size={11} className="animate-spin" /> },
    Failed: { cls: 'chip chip-red', icon: <XCircle size={11} /> },
  };
  const { cls, icon } = map[status];
  return <span className={`${cls} flex items-center gap-1 w-fit`}>{icon}{status}</span>;
};

const ServiceStatusPill: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  if (status === 'Healthy') return (
    <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      Healthy
    </span>
  );
  if (status === 'Degraded') return (
    <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
      <Circle size={8} className="fill-amber-400" />Degraded
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
      <Circle size={8} className="fill-red-400" />Down
    </span>
  );
};

// ─── Detection Job Result Modal ──────────────────────────────
const DetectionResultModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="glass-card w-full max-w-md p-8 text-center shadow-2xl">
      <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Detection Complete</h3>
      <p className="text-slate-400 text-sm mb-6">The detection job finished successfully.</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-orange-400">15</p>
          <p className="text-xs text-slate-400 mt-1">Rings Found</p>
        </div>
        <div className="bg-surface-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-red-400">42</p>
          <p className="text-xs text-slate-400 mt-1">Alerts Raised</p>
        </div>
      </div>
      <button onClick={onClose} className="btn-primary w-full">Dismiss</button>
    </div>
  </div>
);

// ─── Running Detection Modal ──────────────────────────────────
const RunningModal: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="glass-card w-full max-w-sm p-8 text-center shadow-2xl">
      <Loader2 size={48} className="text-blue-400 animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Running Detection…</h3>
      <p className="text-slate-400 text-sm">GNN v2.3.1 · Scanning transaction graph</p>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────
const SystemActivityPage: React.FC = () => {
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle');
  const [fileDropped, setFileDropped] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [detectionRunning, setDetectionRunning] = useState(false);
  const [detectionDone, setDetectionDone] = useState(false);
  const [jobList, setJobList] = useState<SystemJob[]>(SYSTEM_JOBS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Pipeline Simulation ──────────────────────────────────
  const runPipeline = (fileName: string) => {
    setFileDropped(fileName);
    const stageKeys: PipelineStage[] = ['validate', 'clean', 'hash', 'load', 'done'];
    let total = 0;
    PIPELINE_STAGES.forEach((s, i) => {
      total += s.duration;
      setTimeout(() => setPipelineStage(stageKeys[i]), total - s.duration);
    });
    setTimeout(() => setPipelineStage('done'), total);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setPipelineStage('idle'); runPipeline(file.name); }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPipelineStage('idle'); runPipeline(file.name); }
  };

  const handleImportClick = () => {
    if (pipelineStage === 'idle' || pipelineStage === 'done' || pipelineStage === 'error') {
      fileInputRef.current?.click();
    }
  };

  // ─── Detection Simulation ─────────────────────────────────
  const handleRunDetection = () => {
    const jobId = `JOB-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newJob: SystemJob = {
      id: jobId,
      type: 'Run Detection',
      status: 'Running',
      startTime: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      duration: '—',
      records: 0,
    };
    setJobList(prev => [newJob, ...prev]);
    setDetectionRunning(true);

    setTimeout(() => {
      setDetectionRunning(false);
      setDetectionDone(true);
      setJobList(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: 'Completed', duration: '5m 47s', records: 98350 } : j
      ));
    }, 3000);
  };

  // ─── Stage Indicator ─────────────────────────────────────
  const stageIndex = PIPELINE_STAGES.findIndex(s => s.key === pipelineStage);

  const getStageStatus = (idx: number): 'done' | 'active' | 'pending' => {
    if (pipelineStage === 'done') return 'done';
    if (stageIndex === -1) return 'pending';
    if (idx < stageIndex) return 'done';
    if (idx === stageIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {detectionRunning && <RunningModal />}
      {detectionDone && <DetectionResultModal onClose={() => setDetectionDone(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">System Activity</h1>
          <p className="text-sm text-slate-400 mt-0.5">Infrastructure &amp; ML Ops · Mei Lin</p>
        </div>
        <button
          onClick={handleRunDetection}
          disabled={detectionRunning}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {detectionRunning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Run Detection
        </button>
      </div>

      {/* Health Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map(svc => (
          <div key={svc.name} className="glass-card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-surface-800 text-slate-400">{svc.icon}</div>
              <ServiceStatusPill status={svc.status} />
            </div>
            <p className="text-sm font-semibold text-white">{svc.name}</p>
            <p className="text-xs text-slate-500">{svc.detail}</p>
          </div>
        ))}
      </div>

      {/* Active Model Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/30">
              <Cpu size={22} className="text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{ACTIVE_MODEL.name}</h2>
                <span className="chip chip-purple">{ACTIVE_MODEL.version}</span>
                <span className="chip chip-green text-xs">Active</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Trained {ACTIVE_MODEL.trainedOn} · Promoted by {ACTIVE_MODEL.promotedBy}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{(ACTIVE_MODEL.precision * 100).toFixed(0)}%</p>
              <p className="text-xs text-slate-500">Precision</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{(ACTIVE_MODEL.recall * 100).toFixed(0)}%</p>
              <p className="text-xs text-slate-500">Recall</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{ACTIVE_MODEL.aucPR.toFixed(3)}</p>
              <p className="text-xs text-slate-500">AUC-PR</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-bold text-green-400">{ACTIVE_MODEL.drift.toFixed(3)}</p>
                <span className="chip chip-green text-xs">Stable</span>
              </div>
              <p className="text-xs text-slate-500">Drift Score</p>
            </div>
            <button className="btn-outline flex items-center gap-1.5 text-sm">
              <Eye size={14} />View Details
            </button>
          </div>
        </div>
      </div>

      {/* Two-column: Data Import + Job History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Data Import Panel */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Data Import</h2>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={handleImportClick}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${dragOver ? 'border-blue-400 bg-blue-900/20' : 'border-surface-600 hover:border-blue-500/60 hover:bg-surface-800/40'}`}
          >
            <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-blue-400' : 'text-slate-500'}`} />
            <p className="text-sm text-slate-300 font-medium">
              {fileDropped ? fileDropped : 'Drop CSV / Parquet file here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.parquet,.json"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Pipeline Stages */}
          <div className="flex items-center gap-1 mt-1">
            {PIPELINE_STAGES.map((stage, idx) => {
              const status = getStageStatus(idx);
              return (
                <React.Fragment key={stage.key}>
                  <div className={`flex flex-col items-center gap-1 flex-1`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all
                      ${status === 'done' ? 'bg-green-500/30 border border-green-500/60 text-green-400'
                        : status === 'active' ? 'bg-blue-500/30 border border-blue-400 text-blue-300 animate-pulse'
                        : 'bg-surface-700 border border-surface-600 text-slate-500'}`}>
                      {status === 'done' ? <CheckCircle2 size={14} /> : status === 'active' ? <Loader2 size={14} className="animate-spin" /> : <Circle size={10} />}
                    </div>
                    <span className={`text-[10px] text-center leading-tight font-medium
                      ${status === 'done' ? 'text-green-400' : status === 'active' ? 'text-blue-300' : 'text-slate-500'}`}>
                      {stage.label}
                    </span>
                  </div>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight size={14} className={`shrink-0 mb-4 ${status === 'done' ? 'text-green-500' : 'text-slate-600'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {pipelineStage === 'done' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle size={14} className="text-green-400 shrink-0" />
              <span className="text-xs text-green-300 font-medium">Import complete — data loaded into graph.</span>
            </div>
          )}

          <button
            className="btn-primary flex items-center justify-center gap-2 text-sm"
            onClick={handleImportClick}
            disabled={pipelineStage !== 'idle' && pipelineStage !== 'done'}
          >
            <Upload size={14} />
            {pipelineStage === 'idle' ? 'Select File & Import' : pipelineStage === 'done' ? 'Import Another' : 'Importing…'}
          </button>
        </div>

        {/* Job History */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-green-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Job History</h2>
            <span className="ml-auto text-xs text-slate-500">{jobList.length} jobs</span>
          </div>
          <div className="data-table overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Job ID</th>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Type</th>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Status</th>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Start</th>
                  <th className="text-right py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Duration</th>
                  <th className="text-right py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Records</th>
                </tr>
              </thead>
              <tbody>
                {jobList.map(job => (
                  <tr key={job.id} className="border-t border-surface-700 hover:bg-surface-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-300">{job.id}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-300">{job.type}</td>
                    <td className="py-2.5 px-3"><JobBadge status={job.status} /></td>
                    <td className="py-2.5 px-3 text-xs text-slate-400">{job.startTime}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-400 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Clock size={11} className="text-slate-500" />{job.duration}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-right">
                      {job.records > 0 ? (
                        <span className="text-slate-300">{job.records.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Info Footer */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span>FraudRing Graph · v3.4.2</span>
        <span>·</span>
        <span>Environment: Production</span>
        <span>·</span>
        <span>Last sync: Oct 30, 2026 09:00</span>
        <span>·</span>
        <span>Data retention: 365 days</span>
      </div>
    </div>
  );
};

export default SystemActivityPage;
