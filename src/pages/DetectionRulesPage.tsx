import React, { useState } from 'react';
import {
  Shield, Plus, ChevronDown, ChevronUp, Edit2, Trash2,
  Save, X, AlertTriangle, CheckCircle, Info, ToggleLeft,
  ToggleRight, SlidersHorizontal, Eye, EyeOff
} from 'lucide-react';
import { DETECTION_RULES, DetectionRule } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────
interface EditState {
  threshold: number;
  comment: string;
}

interface ToggleConfirmState {
  ruleId: string;
  toEnabled: boolean;
}

// ─── Impact Preview ───────────────────────────────────────────
const computePreview = (rule: DetectionRule, newThreshold: number): string => {
  const delta = newThreshold - rule.threshold;
  if (delta === 0) return 'No change in ring detection.';
  // Simulate: tighter threshold (lower value usually) → more hits
  const ringDelta = Math.round(Math.abs(delta) * (rule.ringImpact / rule.threshold) * 0.15);
  if (delta < 0) {
    return `This change creates ~${ringDelta} more rings and may remove ~${Math.max(0, ringDelta - 2)}.`;
  } else {
    return `This change removes ~${ringDelta} rings and may create ~${Math.max(0, ringDelta - 2)} new.`;
  }
};

// ─── Threshold Slider ─────────────────────────────────────────
const ThresholdSlider: React.FC<{
  rule: DetectionRule;
  value: number;
  onChange: (v: number) => void;
}> = ({ rule, value, onChange }) => {
  const pct = ((value - rule.min) / (rule.max - rule.min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{rule.min} {rule.unit}</span>
        <span className="font-mono font-bold text-white text-sm">{value} {rule.unit}</span>
        <span>{rule.max} {rule.unit}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1.5 bg-surface-700 rounded-full" />
        <div
          className="absolute h-1.5 bg-blue-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={rule.min}
          max={rule.max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="relative w-full h-1.5 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-400
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-300
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-blue-400
            [&::-moz-range-thumb]:border-0"
        />
      </div>
    </div>
  );
};

// ─── Toggle Confirm Modal ─────────────────────────────────────
const ToggleModal: React.FC<{
  state: ToggleConfirmState;
  ruleName: string;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ state, ruleName, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="glass-card w-full max-w-sm p-6 shadow-2xl">
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-lg ${state.toEnabled ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <AlertTriangle size={18} className={state.toEnabled ? 'text-green-400' : 'text-red-400'} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            {state.toEnabled ? 'Enable' : 'Disable'} Rule
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{ruleName}</p>
        </div>
      </div>
      <p className="text-xs text-slate-300 mb-5">
        {state.toEnabled
          ? 'This rule will immediately begin generating alerts. Confirm to proceed.'
          : 'Disabling this rule will stop all alerts from this detection pattern. Confirm to proceed.'}
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
        <button
          onClick={onConfirm}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
            state.toEnabled
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          {state.toEnabled ? 'Enable' : 'Disable'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Add Rule Modal ───────────────────────────────────────────
const AddRuleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="glass-card w-full max-w-lg p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Plus size={16} className="text-blue-400" /> New Detection Rule
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Rule Name</label>
          <input className="input-dark w-full" placeholder="e.g. Cross-border Velocity" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea className="input-dark w-full h-20 resize-none" placeholder="Describe what this rule detects…" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Threshold</label>
            <input type="number" className="input-dark w-full" placeholder="e.g. 5" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Unit</label>
            <input className="input-dark w-full" placeholder="e.g. hops" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Max Value</label>
            <input type="number" className="input-dark w-full" placeholder="e.g. 10" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Justification</label>
          <textarea className="input-dark w-full h-16 resize-none" placeholder="Mandatory: explain why this rule is needed…" />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
        <button onClick={onClose} className="btn-primary text-sm flex items-center gap-1.5">
          <Save size={13} />Create Rule
        </button>
      </div>
    </div>
  </div>
);

// ─── Rule Row ─────────────────────────────────────────────────
const RuleRow: React.FC<{
  rule: DetectionRule;
  onEdit: (rule: DetectionRule) => void;
  onToggle: (ruleId: string, toEnabled: boolean) => void;
  localEnabled: boolean;
}> = ({ rule, onEdit, onToggle, localEnabled }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-t border-surface-700 hover:bg-surface-800/40 transition-colors">
        <td className="py-3 px-4">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-left"
          >
            {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
            <span className="text-sm font-medium text-slate-200">{rule.name}</span>
          </button>
        </td>
        <td className="py-3 px-4 text-xs text-slate-400 max-w-xs">
          <span className="line-clamp-2">{rule.description}</span>
        </td>
        <td className="py-3 px-4">
          <span className="font-mono text-sm text-white font-semibold">{rule.threshold}</span>
          <span className="text-xs text-slate-500 ml-1">{rule.unit}</span>
        </td>
        <td className="py-3 px-4 text-sm text-slate-300 text-center">{rule.hitCount}</td>
        <td className="py-3 px-4 text-center">
          <span className={`chip ${rule.ringImpact > 40 ? 'chip-red' : rule.ringImpact > 20 ? 'chip-orange' : 'chip-blue'}`}>
            {rule.ringImpact} rings
          </span>
        </td>
        <td className="py-3 px-4">
          <button
            onClick={() => onToggle(rule.id, !localEnabled)}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            title={localEnabled ? 'Click to disable' : 'Click to enable'}
          >
            {localEnabled
              ? <ToggleRight size={22} className="text-green-400" />
              : <ToggleLeft size={22} className="text-slate-500" />}
            <span className={`text-xs ${localEnabled ? 'text-green-400' : 'text-slate-500'}`}>
              {localEnabled ? 'On' : 'Off'}
            </span>
          </button>
        </td>
        <td className="py-3 px-4 text-xs text-slate-400">
          <div>{rule.lastModified}</div>
          <div className="text-slate-600">{rule.modifiedBy}</div>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(rule)}
              className="btn-ghost p-1.5 rounded-md text-slate-400 hover:text-blue-400"
              title="Edit rule"
            >
              <Edit2 size={13} />
            </button>
            <button
              className="btn-ghost p-1.5 rounded-md text-slate-400 hover:text-red-400"
              title="Delete rule"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
      {/* Expanded Description Row */}
      {expanded && (
        <tr className="border-t border-surface-700 bg-surface-900/60">
          <td colSpan={8} className="px-8 py-3">
            <div className="flex items-start gap-2">
              <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>Min: <strong className="text-slate-400">{rule.min}</strong> {rule.unit}</span>
              <span>Max: <strong className="text-slate-400">{rule.max}</strong> {rule.unit}</span>
              <span>30-day hits: <strong className="text-slate-400">{rule.hitCount}</strong></span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Edit Panel Modal ─────────────────────────────────────────
const EditModal: React.FC<{
  rule: DetectionRule;
  edit: EditState;
  onChange: (e: EditState) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ rule, edit, onChange, onSave, onClose }) => {
  const preview = computePreview(rule, edit.threshold);
  const previewIsMore = preview.includes('more');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-blue-400" />
            Edit: {rule.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          {/* Slider */}
          <div className="bg-surface-800/60 rounded-xl p-4">
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-3">
              Threshold Adjustment
            </label>
            <ThresholdSlider
              rule={rule}
              value={edit.threshold}
              onChange={v => onChange({ ...edit, threshold: v })}
            />
          </div>

          {/* Impact Preview */}
          <div className={`rounded-xl p-4 border ${
            edit.threshold === rule.threshold
              ? 'bg-surface-800/40 border-surface-700'
              : previewIsMore
              ? 'bg-orange-500/10 border-orange-500/30'
              : 'bg-blue-500/10 border-blue-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Eye size={13} className={previewIsMore ? 'text-orange-400' : 'text-blue-400'} />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Impact Preview</span>
            </div>
            <p className={`text-xs mt-1 ${
              edit.threshold === rule.threshold
                ? 'text-slate-500'
                : previewIsMore
                ? 'text-orange-300'
                : 'text-blue-300'
            }`}>{preview}</p>
            <p className="text-xs text-slate-600 mt-1">
              Current: <span className="text-slate-400">{rule.threshold} {rule.unit}</span>
              {edit.threshold !== rule.threshold && (
                <> → New: <span className="text-white font-medium">{edit.threshold} {rule.unit}</span></>
              )}
            </p>
          </div>

          {/* Mandatory Comment */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
              Mandatory Justification <span className="text-red-400">*</span>
            </label>
            <textarea
              className="input-dark w-full h-20 resize-none"
              placeholder="Explain the reason for this rule change (required for audit log)…"
              value={edit.comment}
              onChange={e => onChange({ ...edit, comment: e.target.value })}
            />
            {edit.comment.trim().length === 0 && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} />A comment is required before saving.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
          <button
            onClick={onSave}
            disabled={edit.comment.trim().length === 0}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={13} />Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const DetectionRulesPage: React.FC = () => {
  const { addAuditEntry, user } = useAuth();

  const [rules, setRules] = useState<DetectionRule[]>(DETECTION_RULES);
  const [editingRule, setEditingRule] = useState<DetectionRule | null>(null);
  const [editState, setEditState] = useState<EditState>({ threshold: 0, comment: '' });
  const [toggleConfirm, setToggleConfirm] = useState<ToggleConfirmState | null>(null);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(
    Object.fromEntries(DETECTION_RULES.map(r => [r.id, r.enabled]))
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleEdit = (rule: DetectionRule) => {
    setEditingRule(rule);
    setEditState({ threshold: rule.threshold, comment: '' });
  };

  const handleSaveEdit = () => {
    if (!editingRule || editState.comment.trim().length === 0) return;

    // Update rule
    setRules(prev =>
      prev.map(r =>
        r.id === editingRule.id
          ? { ...r, threshold: editState.threshold, lastModified: 'Oct 30, 2026', modifiedBy: user?.name ?? 'Mei Lin' }
          : r
      )
    );

    // Audit entry
    addAuditEntry({
      user: user?.name ?? 'Mei Lin',
      role: user?.role ?? 'admin',
      action: 'Rule Change',
      actionType: 'Rule Change',
      entity: editingRule.id,
      details: `Rule "${editingRule.name}" threshold changed from ${editingRule.threshold} to ${editState.threshold} ${editingRule.unit}. Preview: ${computePreview(editingRule, editState.threshold)}`,
      comment: editState.comment,
    });

    showToast(`Rule "${editingRule.name}" updated successfully.`);
    setEditingRule(null);
  };

  const handleToggleRequest = (ruleId: string, toEnabled: boolean) => {
    setToggleConfirm({ ruleId, toEnabled });
  };

  const handleToggleConfirm = () => {
    if (!toggleConfirm) return;
    const { ruleId, toEnabled } = toggleConfirm;
    const rule = rules.find(r => r.id === ruleId);

    setEnabledMap(prev => ({ ...prev, [ruleId]: toEnabled }));
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: toEnabled } : r));

    addAuditEntry({
      user: user?.name ?? 'Mei Lin',
      role: user?.role ?? 'admin',
      action: `Rule ${toEnabled ? 'Enabled' : 'Disabled'}`,
      actionType: 'Rule Change',
      entity: ruleId,
      details: `Rule "${rule?.name}" was ${toEnabled ? 'enabled' : 'disabled'}.`,
      comment: `Rule ${toEnabled ? 'enabled' : 'disabled'} by ${user?.name ?? 'admin'}.`,
    });

    showToast(`Rule ${toEnabled ? 'enabled' : 'disabled'}.`);
    setToggleConfirm(null);
  };

  const enabledCount = Object.values(enabledMap).filter(Boolean).length;
  const totalHits = rules.reduce((sum, r) => sum + r.hitCount, 0);
  const totalImpact = rules.reduce((sum, r) => sum + r.ringImpact, 0);

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg shadow-xl text-sm flex items-center gap-2">
          <CheckCircle size={16} />{toastMsg}
        </div>
      )}

      {/* Modals */}
      {editingRule && (
        <EditModal
          rule={editingRule}
          edit={editState}
          onChange={setEditState}
          onSave={handleSaveEdit}
          onClose={() => setEditingRule(null)}
        />
      )}
      {toggleConfirm && (
        <ToggleModal
          state={toggleConfirm}
          ruleName={rules.find(r => r.id === toggleConfirm.ruleId)?.name ?? ''}
          onConfirm={handleToggleConfirm}
          onClose={() => setToggleConfirm(null)}
        />
      )}
      {addModalOpen && <AddRuleModal onClose={() => setAddModalOpen(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-blue-400" />
            Detection Rules
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Infrastructure &amp; ML Ops · Mei Lin</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} />Add Rule
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="flex flex-wrap gap-4">
        <div className="kpi-card flex-1 min-w-[140px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Rules</p>
          <p className="text-3xl font-bold text-white">{rules.length}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[140px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Enabled</p>
          <p className="text-3xl font-bold text-green-400">{enabledCount}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[140px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">30-day Hits</p>
          <p className="text-3xl font-bold text-blue-400">{totalHits.toLocaleString()}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[140px]">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ring Impact</p>
          <p className="text-3xl font-bold text-orange-400">{totalImpact}</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={15} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Active Rules</h2>
          <span className="ml-auto text-xs text-slate-500">Click rule name to expand description · Click edit to modify threshold</span>
        </div>
        <div className="data-table overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr>
                <th className="text-left py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Rule Name</th>
                <th className="text-left py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Description</th>
                <th className="text-left py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Threshold</th>
                <th className="text-center py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Hits (30d)</th>
                <th className="text-center py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Ring Impact</th>
                <th className="text-left py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Enabled</th>
                <th className="text-left py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Last Modified</th>
                <th className="text-left py-2 px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEdit}
                  onToggle={handleToggleRequest}
                  localEnabled={enabledMap[rule.id] ?? rule.enabled}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Note */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700 text-xs text-slate-400">
        <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
        All rule changes are recorded in the system audit log with the modifying user, timestamp, previous value, new value, and mandatory justification comment. Changes take effect immediately on the next detection run.
      </div>
    </div>
  );
};

export default DetectionRulesPage;
