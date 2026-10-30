import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { BarChart2, TrendingUp, AlertCircle, Bell } from 'lucide-react';
import {
  PATTERN_DISTRIBUTION, ALERT_PRECISION_TREND,
  RING_GROWTH_TREND, CONFIRM_DISMISS_DATA,
} from '../data/mockData';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = ['#3b82f6','#8b5cf6','#f97316','#22c55e','#eab308','#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs space-y-1">
      <div className="text-surface-400 font-medium mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-surface-300">{p.name}:</span>
          <span className="text-surface-100 font-semibold">{typeof p.value === 'number' && p.value < 2 ? (p.value * 100).toFixed(1) + '%' : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function InsightsPage() {
  const { user, addAuditEntry } = useAuth();

  const handleRequestReview = () => {
    if (!user) return;
    addAuditEntry({
      user: user.name, role: user.role,
      action: 'Threshold Review Requested', actionType: 'System',
      entity: 'Detection Rules',
      details: 'Team Lead requested admin review of detection thresholds.',
      comment: 'High false-positive rate noted in recent pattern distribution — requesting threshold recalibration.',
    });
    alert('Request sent to admin. An audit entry has been logged.');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-400" /> Insights
          </h1>
          <p className="text-surface-400 text-sm mt-0.5">Team performance analytics and detection quality trends</p>
        </div>
        <button onClick={handleRequestReview} className="btn-outline text-xs gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Request Admin Threshold Review
        </button>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pattern Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-surface-200 font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-400" /> Pattern Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PATTERN_DISTRIBUTION} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis dataKey="pattern" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[0,4,4,0]}>
                {PATTERN_DISTRIBUTION.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ring Growth Trend */}
        <div className="glass-card p-5">
          <h3 className="text-surface-200 font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" /> Ring Growth Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={RING_GROWTH_TREND}>
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area dataKey="rings" name="New Rings" stroke="#8b5cf6" fill="url(#ringGrad)" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alert Precision & Recall */}
        <div className="glass-card p-5">
          <h3 className="text-surface-200 font-semibold mb-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" /> Alert Precision & Recall Over Time
          </h3>
          <p className="text-surface-500 text-xs mb-4">Weekly model detection quality metrics</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ALERT_PRECISION_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0.6, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Line dataKey="precision" name="Precision" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
              <Line dataKey="recall" name="Recall" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Confirm vs Dismiss */}
        <div className="glass-card p-5">
          <h3 className="text-surface-200 font-semibold mb-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" /> Confirm vs. Dismiss Rate
          </h3>
          <p className="text-surface-500 text-xs mb-4">Monthly team decision breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CONFIRM_DISMISS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="confirmed" name="Confirmed Fraud" stackId="a" fill="#ef4444" radius={[0,0,0,0]} />
              <Bar dataKey="dismissed" name="Dismissed (FP)" stackId="a" fill="#475569" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', title: 'Precision Improving', body: 'Model precision rose from 71% → 88% over 7 weeks following label quality improvements.' },
          { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', title: 'Circular Flow Dominant', body: 'Circular Flow accounts for 28% of all detected rings — tightest detection rule focus area.' },
          { icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', title: 'False Positive Declining', body: 'Dismiss rate fell from 40% in June to 22% in October — analyst feedback loop is working.' },
        ].map(c => (
          <div key={c.title} className={`glass-card p-4 border ${c.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className={`text-sm font-semibold ${c.color}`}>{c.title}</span>
            </div>
            <p className="text-surface-400 text-sm leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
