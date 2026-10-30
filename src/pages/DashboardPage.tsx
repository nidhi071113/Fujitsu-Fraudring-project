import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Shield, FileText, Clock, X, ChevronRight,
  AlertTriangle, ExternalLink, Users, DollarSign, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { FRAUD_RINGS, FraudRing } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

// ─── Weekly alert volume (synthetic) ─────────────────────────
const WEEKLY_ALERTS = [
  { day: 'Mon', alerts: 4 },
  { day: 'Tue', alerts: 7 },
  { day: 'Wed', alerts: 3 },
  { day: 'Thu', alerts: 9 },
  { day: 'Fri', alerts: 6 },
  { day: 'Sat', alerts: 2 },
  { day: 'Sun', alerts: 5 },
];

// ─── Helpers ─────────────────────────────────────────────────
function riskColor(level: string) {
  if (level === 'Critical') return '#ef4444';
  if (level === 'High')     return '#f97316';
  if (level === 'Medium')   return '#eab308';
  return '#22c55e';
}

function riskBadgeClass(level: string) {
  if (level === 'Critical') return 'badge-critical';
  if (level === 'High')     return 'badge-high';
  if (level === 'Medium')   return 'badge-medium';
  return 'badge-low';
}

function statusClass(status: string) {
  if (status === 'New')       return 'status-new';
  if (status === 'In review') return 'status-in-review';
  if (status === 'Escalated') return 'status-escalated';
  if (status === 'Confirmed') return 'status-confirmed';
  if (status === 'Dismissed') return 'status-dismissed';
  return 'status-new';
}

function fmtVolume(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// ─── KPI Card ────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string; // tailwind text color class
  border: string; // tailwind border color class
}
function KpiCard({ label, value, icon, color, border }: KpiProps) {
  return (
    <div className={`kpi-card rounded-xl p-5 flex flex-col gap-3 border ${border}`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={`${color} opacity-80`}>{icon}</div>
      </div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

// ─── Quick Review Drawer ──────────────────────────────────────
interface DrawerProps {
  ring: FraudRing;
  onClose: () => void;
}
function QuickReviewDrawer({ ring, onClose }: DrawerProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col overflow-y-auto"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ background: riskColor(ring.riskLevel) }}
            >
              {ring.riskScore}
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">{ring.id}</div>
              <span className={`text-xs mt-0.5 inline-block ${riskBadgeClass(ring.riskLevel)}`}>
                {ring.riskLevel}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost rounded-lg p-2"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Pattern</div>
              <div className="text-white font-semibold text-sm">{ring.pattern}</div>
            </div>
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Accounts</div>
              <div className="text-white font-semibold text-sm flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                {ring.accountCount}
              </div>
            </div>
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Volume</div>
              <div className="text-white font-semibold text-sm flex items-center justify-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                {fmtVolume(ring.totalVolume)}
              </div>
            </div>
          </div>

          {/* Key insight banner */}
          <div className="rounded-xl bg-amber-900/20 border border-amber-700/40 px-4 py-3 flex gap-3 items-start">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm leading-snug">
              Individual scores all &lt;40. Ring only visible through connections.
            </p>
          </div>

          {/* Key reasons */}
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              Key Reasons
            </div>
            <div className="flex flex-wrap gap-2">
              {ring.keyReasons.map(r => (
                <span key={r} className="chip chip-red text-xs">{r}</span>
              ))}
            </div>
          </div>

          {/* Accounts involved */}
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              Accounts in Ring
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ring.accounts.map(a => (
                <span key={a} className="chip chip-blue text-xs font-mono">{a}</span>
              ))}
            </div>
          </div>

          {/* Devices */}
          {ring.devices.length > 0 && (
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                Shared Devices
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ring.devices.map(d => (
                  <span key={d} className="chip chip-orange text-xs font-mono">{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              Description
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{ring.description}</p>
          </div>

          {/* Rules fired */}
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              Rules Fired
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ring.rulesFired.map(r => (
                <span key={r} className="chip chip-purple text-xs font-mono">{r}</span>
              ))}
            </div>
          </div>

          {/* First seen */}
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>First detected: {ring.firstSeen}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 border-t border-slate-700/60 flex flex-col gap-3">
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Start Investigation
          </button>
          <button
            onClick={() => navigate(`/fraud-rings/${ring.id}`)}
            className="btn-outline w-full flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Ring Detail
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Custom Tooltip for recharts ──────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white shadow-lg">
        <p className="text-slate-400 mb-0.5">{label}</p>
        <p className="font-semibold text-indigo-300">{payload[0].value} alerts</p>
      </div>
    );
  }
  return null;
}

// ─── Main Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedRing, setSelectedRing] = useState<FraudRing | null>(null);

  // Assigned / relevant rings for Aiko
  const myRings = FRAUD_RINGS.filter(
    r => r.assignedTo === 'Aiko Tanaka' || r.status === 'New'
  );

  // Needs attention: Critical or High risk, not dismissed
  const attentionRings = FRAUD_RINGS.filter(
    r => (r.riskLevel === 'Critical' || r.riskLevel === 'High') && r.status !== 'Dismissed'
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Queue</h1>
        <p className="text-slate-400 text-sm mt-1">
          Your assigned alerts and investigations
          {user && <span className="text-slate-500"> · {user.name}</span>}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="New Alerts"
          value={12}
          icon={<Bell className="w-5 h-5" />}
          color="text-blue-400"
          border="border-blue-500/20"
        />
        <KpiCard
          label="Rings to Review"
          value={8}
          icon={<Shield className="w-5 h-5" />}
          color="text-orange-400"
          border="border-orange-500/20"
        />
        <KpiCard
          label="Open Investigations"
          value={5}
          icon={<FileText className="w-5 h-5" />}
          color="text-violet-400"
          border="border-violet-500/20"
        />
        <KpiCard
          label="Alerts >24h"
          value={3}
          icon={<Clock className="w-5 h-5" />}
          color="text-rose-400"
          border="border-rose-500/20"
        />
      </div>

      {/* ── Content grid: table + chart ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Needs Attention Now table ── */}
        <div className="xl:col-span-2 glass-card rounded-xl border border-slate-700/50">
          <div className="px-5 py-4 border-b border-slate-700/40 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 className="text-white font-semibold text-base">Needs Attention Now</h2>
            <span className="ml-auto chip chip-red text-xs">{attentionRings.length} rings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Ring ID</th>
                  <th>Risk</th>
                  <th>Pattern</th>
                  <th>Accounts</th>
                  <th>Volume</th>
                  <th>Key Reasons</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attentionRings.map(ring => (
                  <tr
                    key={ring.id}
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => setSelectedRing(ring)}
                  >
                    {/* Ring ID */}
                    <td>
                      <span className="text-indigo-400 font-mono font-semibold hover:text-indigo-300">
                        {ring.id}
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: riskColor(ring.riskLevel) }}
                        >
                          {ring.riskScore}
                        </div>
                        <span className={`text-xs ${riskBadgeClass(ring.riskLevel)}`}>
                          {ring.riskLevel}
                        </span>
                      </div>
                    </td>

                    {/* Pattern */}
                    <td>
                      <span className="text-slate-300 text-sm">{ring.pattern}</span>
                    </td>

                    {/* Accounts */}
                    <td>
                      <div className="flex items-center gap-1 text-slate-300 text-sm">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {ring.accountCount}
                      </div>
                    </td>

                    {/* Volume */}
                    <td>
                      <span className="text-slate-300 text-sm font-mono">
                        {fmtVolume(ring.totalVolume)}
                      </span>
                    </td>

                    {/* Key reasons chips */}
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {ring.keyReasons.slice(0, 2).map(r => (
                          <span key={r} className="chip chip-red text-xs">{r}</span>
                        ))}
                        {ring.keyReasons.length > 2 && (
                          <span className="chip text-xs">+{ring.keyReasons.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`text-xs ${statusClass(ring.status)}`}>
                        {ring.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedRing(ring); }}
                        className="btn-ghost text-xs px-2 py-1 rounded flex items-center gap-1"
                      >
                        Review <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}

                {attentionRings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-slate-500 py-10">
                      No critical or high rings requiring attention.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right column: chart + mini queue summary ── */}
        <div className="flex flex-col gap-6">
          {/* Alert volume chart */}
          <div className="glass-card rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-white font-semibold text-sm mb-1">Alert Volume This Week</h2>
            <p className="text-slate-500 text-xs mb-4">Daily alerts assigned to you</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={WEEKLY_ALERTS} barSize={18}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="alerts" radius={[4, 4, 0, 0]}>
                  {WEEKLY_ALERTS.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.alerts >= 8 ? '#ef4444' : entry.alerts >= 5 ? '#6366f1' : '#475569'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* My assigned rings summary */}
          <div className="glass-card rounded-xl border border-slate-700/50 p-5 flex flex-col gap-3">
            <h2 className="text-white font-semibold text-sm">My Assigned Rings</h2>
            {myRings.length === 0 && (
              <p className="text-slate-500 text-xs">No rings currently assigned.</p>
            )}
            {myRings.map(ring => (
              <button
                key={ring.id}
                onClick={() => navigate(`/fraud-rings/${ring.id}`)}
                className="flex items-center gap-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 hover:border-indigo-500/40 transition-all px-3 py-2.5 text-left"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: riskColor(ring.riskLevel) }}
                >
                  {ring.riskScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-mono text-sm font-semibold">{ring.id}</div>
                  <div className="text-slate-400 text-xs truncate">{ring.pattern}</div>
                </div>
                <span className={`text-xs flex-shrink-0 ${statusClass(ring.status)}`}>
                  {ring.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick review drawer ── */}
      {selectedRing && (
        <QuickReviewDrawer
          ring={selectedRing}
          onClose={() => setSelectedRing(null)}
        />
      )}
    </div>
  );
}
