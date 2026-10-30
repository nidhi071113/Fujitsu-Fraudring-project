import React, { useState } from 'react';
import { UserPlus, RotateCcw, X, Shield, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SYSTEM_USERS, SystemUser, UserRole } from '../data/mockData';

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

function statusBadge(status: 'Active' | 'Disabled') {
  return status === 'Active'
    ? <span className="chip chip-green">Active</span>
    : <span className="chip">Disabled</span>;
}

// ─── Confirm Dialog ───────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="glass-card w-full max-w-md rounded-xl border border-surface-700 p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${danger ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-surface-400 text-sm mt-1">{message}</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-outline">Cancel</button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── Create User Modal ────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (user: SystemUser) => void;
}

const DEPARTMENTS = [
  'Tokyo AML Operations',
  'Financial Crime Compliance',
  'Infrastructure & ML Ops',
  'Independent Risk & Compliance',
  'APAC Fraud Team',
];

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('analyst');
  const [dept, setDept] = useState(DEPARTMENTS[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    const newUser: SystemUser = {
      id: `USR-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      name: name.trim(),
      role,
      department: dept,
      status: 'Active',
      lastLogin: 'Never',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    onCreated(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md rounded-xl border border-surface-700">
        <div className="flex items-center justify-between p-6 border-b border-surface-700">
          <h2 className="text-white font-semibold text-lg">Create New User</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-surface-400 text-sm mb-1">Full Name</label>
            <input
              type="text"
              className="input-dark w-full"
              placeholder="e.g. Alex Chen"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-surface-400 text-sm mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="input-dark w-full"
            >
              <option value="analyst">Analyst</option>
              <option value="lead">Lead</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-surface-400 text-sm mb-1">Department</label>
            <select
              value={dept}
              onChange={e => setDept(e.target.value)}
              className="input-dark w-full"
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const { addAuditEntry, user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([...SYSTEM_USERS]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<SystemUser | null>(null);
  const [confirmReset, setConfirmReset] = useState<SystemUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreated = (newUser: SystemUser) => {
    setUsers(prev => [newUser, ...prev]);
    setShowCreateModal(false);
    addAuditEntry({
      user: user?.name ?? 'Mei Lin',
      role: user?.role ?? 'admin',
      action: 'User Created',
      actionType: 'User Change',
      entity: newUser.id,
      details: `New ${newUser.role} user created: ${newUser.name}, dept=${newUser.department}`,
      comment: 'User created via admin panel.',
    });
    showToast(`User ${newUser.name} created successfully.`);
  };

  const handleToggleStatus = (target: SystemUser) => {
    const newStatus = target.status === 'Active' ? 'Disabled' : 'Active';
    setUsers(prev => prev.map(u => u.id === target.id ? { ...u, status: newStatus } : u));
    setConfirmToggle(null);
    addAuditEntry({
      user: user?.name ?? 'Mei Lin',
      role: user?.role ?? 'admin',
      action: `User ${newStatus === 'Active' ? 'Enabled' : 'Disabled'}`,
      actionType: 'User Change',
      entity: target.id,
      details: `User ${target.name} (${target.id}) status changed to ${newStatus}.`,
      comment: `Admin action via user management panel.`,
    });
    showToast(`${target.name} has been ${newStatus === 'Active' ? 'enabled' : 'disabled'}.`);
  };

  const handleResetPassword = (target: SystemUser) => {
    setConfirmReset(null);
    addAuditEntry({
      user: user?.name ?? 'Mei Lin',
      role: user?.role ?? 'admin',
      action: 'Password Reset',
      actionType: 'User Change',
      entity: target.id,
      details: `Password reset initiated for user ${target.name} (${target.id}).`,
      comment: 'Admin-initiated password reset.',
    });
    showToast(`Password reset link sent to ${target.name}.`);
  };

  const active = users.filter(u => u.status === 'Active').length;
  const disabled = users.filter(u => u.status === 'Disabled').length;

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-surface-800 border border-green-500/40 text-green-400 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-4">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-surface-400 text-sm mt-1">Manage system access and user accounts</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-white' },
          { label: 'Active', value: active, color: 'text-green-400' },
          { label: 'Disabled', value: disabled, color: 'text-surface-400' },
        ].map(k => (
          <div key={k.label} className="kpi-card rounded-xl p-4">
            <p className="text-surface-400 text-xs uppercase tracking-wider">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-800/50 transition-colors">
                  <td className="font-mono text-surface-300 text-xs">{u.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                        {u.name.split(' ').map(w => w[0]).join('')}
                      </div>
                      <span className="text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td>{roleBadge(u.role)}</td>
                  <td className="text-surface-300 text-sm">{u.department}</td>
                  <td>
                    <button
                      onClick={() => setConfirmToggle(u)}
                      className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
                      title={`Click to ${u.status === 'Active' ? 'disable' : 'enable'}`}
                    >
                      {statusBadge(u.status)}
                    </button>
                  </td>
                  <td className="text-surface-400 text-xs whitespace-nowrap">{u.lastLogin}</td>
                  <td className="text-surface-400 text-xs">{u.createdAt}</td>
                  <td>
                    <button
                      onClick={() => setConfirmReset(u)}
                      className="btn-ghost text-xs flex items-center gap-1 px-3 py-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-surface-700 text-surface-500 text-xs">
          {users.length} users total
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}

      {confirmToggle && (
        <ConfirmDialog
          title={`${confirmToggle.status === 'Active' ? 'Disable' : 'Enable'} User`}
          message={`Are you sure you want to ${confirmToggle.status === 'Active' ? 'disable' : 'enable'} ${confirmToggle.name}? This action will be logged to the audit trail.`}
          confirmLabel={confirmToggle.status === 'Active' ? 'Disable User' : 'Enable User'}
          danger={confirmToggle.status === 'Active'}
          onConfirm={() => handleToggleStatus(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset Password"
          message={`Send a password reset link to ${confirmReset.name}? This action will be logged to the audit trail.`}
          confirmLabel="Send Reset Link"
          onConfirm={() => handleResetPassword(confirmReset)}
          onCancel={() => setConfirmReset(null)}
        />
      )}
    </div>
  );
};

export default UsersPage;
