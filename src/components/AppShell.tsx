import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERSONAS } from '../data/mockData';
import {
  LayoutDashboard, Network, CreditCard, Users, Shield, Settings,
  Bell, Search, ChevronDown, LogOut, Clock, AlertTriangle, X,
  Activity, BarChart2, Zap, FileText, Cpu, BookOpen
} from 'lucide-react';

// ─── Nav config per role ──────────────────────────────────────
const NAV_ITEMS: Record<string, { path: string; label: string; icon: React.ElementType }[]> = {
  analyst: [
    { path: '/dashboard', label: 'My Queue', icon: LayoutDashboard },
    { path: '/fraud-rings', label: 'Fraud Rings', icon: Shield },
    { path: '/network', label: 'Network Explorer', icon: Network },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/accounts', label: 'Accounts', icon: Users },
    { path: '/investigations', label: 'Investigations', icon: FileText },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  lead: [
    { path: '/team-overview', label: 'Team Overview', icon: LayoutDashboard },
    { path: '/fraud-rings', label: 'Fraud Rings', icon: Shield },
    { path: '/network', label: 'Network Explorer', icon: Network },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/accounts', label: 'Accounts', icon: Users },
    { path: '/investigations', label: 'Investigations', icon: FileText },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/insights', label: 'Insights', icon: BarChart2 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { path: '/system-activity', label: 'System Activity', icon: Activity },
    { path: '/rules', label: 'Detection Rules', icon: Zap },
    { path: '/model-analytics', label: 'Model Analytics', icon: Cpu },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  auditor: [
    { path: '/audit-log', label: 'Audit Log', icon: BookOpen },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  analyst: 'text-blue-400',
  lead: 'text-purple-400',
  admin: 'text-amber-400',
  auditor: 'text-emerald-400',
};
const ROLE_BG: Record<string, string> = {
  analyst: 'bg-blue-500/10 border-blue-500/30',
  lead: 'bg-purple-500/10 border-purple-500/30',
  admin: 'bg-amber-500/10 border-amber-500/30',
  auditor: 'bg-emerald-500/10 border-emerald-500/30',
};
const AVATAR_GRADIENT: Record<string, string> = {
  analyst: 'from-blue-600 to-blue-800',
  lead: 'from-purple-600 to-purple-800',
  admin: 'from-amber-600 to-amber-800',
  auditor: 'from-emerald-600 to-emerald-800',
};

// ─── Session Warning Modal ─────────────────────────────────────
const SessionWarningModal: React.FC = () => {
  const { timeRemaining, showExpiryWarning, extendSession, logout, dismissExpiryWarning } = useAuth();
  if (!showExpiryWarning) return null;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card border border-amber-500/40 p-6 w-full max-w-md mx-4 shadow-2xl"
        style={{ boxShadow: '0 0 40px rgba(245,158,11,0.2)' }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-surface-100 font-semibold text-lg">Session Expiring Soon</h3>
            <p className="text-surface-400 text-sm mt-0.5">
              Your session expires in{' '}
              <span className="text-amber-400 font-mono font-bold text-base">
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
            </p>
          </div>
          <button onClick={dismissExpiryWarning} className="ml-auto p-1 hover:bg-surface-700 rounded">
            <X className="w-4 h-4 text-surface-500" />
          </button>
        </div>
        <p className="text-surface-500 text-sm mb-5">
          Any unsaved changes will be lost when the session expires.
        </p>
        <div className="flex gap-3">
          <button onClick={extendSession} className="btn-primary flex-1">
            <Clock className="w-4 h-4" /> Extend Session (+30m)
          </button>
          <button onClick={() => logout('Session expired — user logged out')} className="btn-outline flex shrink-0 items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Demo Switcher ─────────────────────────────────────────────
const DemoSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { user, switchPersona } = useAuth();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all"
      >
        <Zap className="w-3 h-3" />
        <span className="hidden sm:inline">Demo, synthetic data</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-64 glass-card-dark border border-surface-600/60 shadow-2xl z-40 p-2 animate-fade-in">
            <p className="text-xs text-surface-500 px-2 py-1.5 font-semibold uppercase tracking-wider">Switch Persona</p>
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => { switchPersona(p.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  user?.id === p.id ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-surface-800/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_GRADIENT[p.role]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {p.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-surface-200 text-sm font-medium">{p.name}</div>
                  <div className={`text-xs capitalize ${ROLE_COLORS[p.role]}`}>{p.role} · {p.department.split(' ')[0]}</div>
                </div>
                {user?.id === p.id && <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Top Nav ──────────────────────────────────────────────────
const TopNav: React.FC = () => {
  const { user, logout, timeRemaining } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const isWarning = timeRemaining <= 120;

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-surface-700/50 bg-surface-900/90 backdrop-blur-sm shrink-0 z-30">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
          <Network className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-surface-100 text-sm hidden sm:block">
          FraudRing<span className="text-brand-400">Graph</span>
        </span>
      </div>

      <div className="flex-1 max-w-sm relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-600" />
        <input
          className="w-full bg-surface-800/50 border border-surface-700/50 rounded-lg pl-8 pr-3 py-1.5 text-sm text-surface-300 placeholder:text-surface-600 focus:outline-none focus:border-brand-500/50 transition-all"
          placeholder="Search accounts, rings..."
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <DemoSwitcher />

        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors ${
          isWarning
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-surface-800/60 border-surface-700/40 text-surface-500'
        }`}>
          <Clock className="w-3 h-3" />
          {mins}:{secs.toString().padStart(2, '0')}
        </div>

        <button className="relative p-2 rounded-lg hover:bg-surface-700/50 text-surface-500 hover:text-surface-300 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-surface-800/60 transition-colors"
            >
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_GRADIENT[user.role]} flex items-center justify-center text-white text-xs font-bold`}>
                {user.avatar}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-surface-200 text-xs font-medium leading-tight">{user.name.split(' ')[0]}</div>
                <div className={`text-xs capitalize leading-tight ${ROLE_COLORS[user.role]}`}>{user.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-surface-600" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-52 glass-card-dark border border-surface-600/50 shadow-2xl z-40 p-2 animate-fade-in">
                  <div className="px-3 py-2.5 border-b border-surface-700/50 mb-1">
                    <div className="text-surface-100 text-sm font-semibold">{user.name}</div>
                    <div className="text-surface-500 text-xs mt-0.5">{user.department}</div>
                    <div className={`text-xs capitalize mt-1 font-medium ${ROLE_COLORS[user.role]}`}>{user.role}</div>
                  </div>
                  <button
                    onClick={() => { logout('Logout from profile dropdown'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────
const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return null;
  const navItems = NAV_ITEMS[user.role] || [];

  return (
    <aside className="w-52 shrink-0 flex flex-col border-r border-surface-700/40 bg-surface-900/50 backdrop-blur-sm overflow-hidden">
      <div className={`mx-3 mt-3 mb-2 px-3 py-2 rounded-lg border text-xs font-medium ${ROLE_BG[user.role]} ${ROLE_COLORS[user.role]}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          <span className="capitalize">{user.role} Access</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.length > 1);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item w-full ${active ? 'active' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-400' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-surface-700/40">
        <div className="text-xs text-surface-600">FraudRing Graph v2.3.1</div>
        <div className="text-xs text-surface-700 mt-0.5">© 2026 Fujitsu</div>
      </div>
    </aside>
  );
};

// ─── App Shell ────────────────────────────────────────────────
const AppShell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface-950 relative">
          <Outlet />
        </main>
      </div>
      <SessionWarningModal />
    </div>
  );
};

export default AppShell;
