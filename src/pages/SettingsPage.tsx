import React from 'react';
import { Settings, User, Clock, Shield, Bell, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS: Record<string, string> = {
  analyst: 'text-blue-400', lead: 'text-purple-400',
  admin: 'text-amber-400', auditor: 'text-emerald-400',
};
const ROLE_BG: Record<string, string> = {
  analyst: 'bg-blue-500/10 border-blue-500/30', lead: 'bg-purple-500/10 border-purple-500/30',
  admin: 'bg-amber-500/10 border-amber-500/30', auditor: 'bg-emerald-500/10 border-emerald-500/30',
};
const AVATAR_GRADIENT: Record<string, string> = {
  analyst: 'from-blue-600 to-blue-800', lead: 'from-purple-600 to-purple-800',
  admin: 'from-amber-600 to-amber-800', auditor: 'from-emerald-600 to-emerald-800',
};

export default function SettingsPage() {
  const { user, timeRemaining, extendSession } = useAuth();
  if (!user) return null;

  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" /> Settings
        </h1>
        <p className="text-surface-400 text-sm mt-0.5">Profile and session preferences</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-surface-200 font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-surface-400" /> Profile
        </h2>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENT[user.role]} flex items-center justify-center text-white text-xl font-bold`}>
            {user.avatar}
          </div>
          <div>
            <div className="text-surface-100 font-semibold text-lg">{user.name}</div>
            <div className="text-surface-400 text-sm">{user.department}</div>
            <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${ROLE_BG[user.role]} ${ROLE_COLORS[user.role]}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              {user.role}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-surface-900/60 rounded-lg p-3">
            <div className="text-surface-500 text-xs">Role</div>
            <div className={`text-sm font-medium capitalize mt-0.5 ${ROLE_COLORS[user.role]}`}>{user.role}</div>
          </div>
          <div className="bg-surface-900/60 rounded-lg p-3">
            <div className="text-surface-500 text-xs">Department</div>
            <div className="text-surface-200 text-sm mt-0.5">{user.department}</div>
          </div>
        </div>
      </div>

      {/* Session Card */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-surface-200 font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-surface-400" /> Session
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-surface-300 text-sm">Time remaining</div>
            <div className={`text-2xl font-mono font-bold mt-0.5 ${timeRemaining <= 120 ? 'text-red-400' : 'text-surface-200'}`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
            <div className="text-surface-500 text-xs mt-1">Session expires after 30 minutes of inactivity</div>
          </div>
          <button onClick={extendSession} className="btn-primary">
            <Clock className="w-4 h-4" /> Extend Session
          </button>
        </div>
        {/* Session bar */}
        <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${(timeRemaining / 1800) * 100}%`,
              background: timeRemaining <= 120 ? '#ef4444' : timeRemaining <= 300 ? '#f97316' : '#3b82f6',
            }}
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-surface-200 font-semibold flex items-center gap-2">
          <Moon className="w-4 h-4 text-surface-400" /> Preferences
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Dark Mode', desc: 'Always on — platform designed for dark environments', value: true, locked: true },
            { label: 'Session Expiry Warnings', desc: 'Alert 2 minutes before session expires', value: true, locked: false },
            { label: 'Audit Log Notifications', desc: 'Notify when audit entries are created for your account', value: true, locked: false },
          ].map(pref => (
            <div key={pref.label} className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
              <div>
                <div className="text-surface-200 text-sm font-medium">{pref.label}</div>
                <div className="text-surface-500 text-xs">{pref.desc}</div>
              </div>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${pref.value ? 'bg-brand-600' : 'bg-surface-700'} ${pref.locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${pref.value ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-surface-200 font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-surface-400" /> Security
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'SOC 2 Type II', status: 'Compliant', color: 'text-green-400' },
            { label: 'AES-256 Encryption', status: 'Active', color: 'text-green-400' },
            { label: 'Full Audit Trail', status: 'Enabled', color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-surface-900/60 rounded-lg p-3 text-center">
              <div className={`text-xs font-semibold ${s.color}`}>{s.status}</div>
              <div className="text-surface-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-surface-600 text-xs">
          This is a demo environment. All data is synthetic and no real PII is processed.
        </p>
      </div>
    </div>
  );
}
