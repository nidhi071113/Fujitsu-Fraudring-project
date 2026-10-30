import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERSONAS, Persona, AuditEntry, AUDIT_LOG, UserRole } from '../data/mockData';

// ─── Types ────────────────────────────────────────────────────
interface RetrainingLabel {
  accountId: string;
  label: 'fraud' | 'legitimate';
  ringId: string;
  timestamp: string;
  analyst: string;
}

interface AuthState {
  user: Persona | null;
  isAuthenticated: boolean;
  sessionStart: number | null;
  sessionExpiresAt: number | null;
  timeRemaining: number; // seconds
  showExpiryWarning: boolean;
  auditLog: AuditEntry[];
  retrainingLabels: RetrainingLabel[];
}

interface AuthContextType extends AuthState {
  login: (personaId: string, comment?: string) => void;
  logout: (comment?: string) => void;
  switchPersona: (personaId: string) => void;
  extendSession: () => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  addRetrainingLabels: (labels: RetrainingLabel[]) => void;
  dismissExpiryWarning: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_DURATION = 30 * 60; // 30 minutes in seconds
const WARNING_THRESHOLD = 2 * 60; // 2 minutes in seconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    sessionStart: null,
    sessionExpiresAt: null,
    timeRemaining: SESSION_DURATION,
    showExpiryWarning: false,
    auditLog: [...AUDIT_LOG],
    retrainingLabels: [],
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const generateId = () => `AL-${Date.now().toString().slice(-6)}`;

  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setState(prev => ({ ...prev, auditLog: [newEntry, ...prev.auditLog] }));
    return newEntry;
  }, []);

  const startSessionTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const expiresAt = Date.now() + SESSION_DURATION * 1000;
    setState(prev => ({ ...prev, sessionStart: Date.now(), sessionExpiresAt: expiresAt, timeRemaining: SESSION_DURATION, showExpiryWarning: false }));

    timerRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.sessionExpiresAt) return prev;
        const remaining = Math.max(0, Math.round((prev.sessionExpiresAt - Date.now()) / 1000));
        const showWarning = remaining <= WARNING_THRESHOLD && remaining > 0;
        if (remaining === 0) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return { ...prev, timeRemaining: remaining, showExpiryWarning: showWarning };
      });
    }, 1000);
  }, []);

  const login = useCallback((personaId: string, comment?: string) => {
    const persona = PERSONAS.find(p => p.id === personaId);
    if (!persona) return;
    setState(prev => ({ ...prev, user: persona, isAuthenticated: true }));
    startSessionTimer();
    // Log login
    const newEntry: AuditEntry = {
      id: generateId(),
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      user: persona.name,
      role: persona.role,
      action: 'Login',
      actionType: 'Login',
      details: `Successful login. Demo mode active.`,
      comment: comment || 'Demo login',
    };
    setState(prev => ({ ...prev, auditLog: [newEntry, ...prev.auditLog] }));
    navigate(persona.homePath);
  }, [navigate, startSessionTimer]);

  const logout = useCallback((comment?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState(prev => {
      if (prev.user) {
        const entry: AuditEntry = {
          id: generateId(),
          timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          user: prev.user.name,
          role: prev.user.role,
          action: 'Logout',
          actionType: 'Logout',
          details: `Session ended.`,
          comment: comment || 'User logged out',
        };
        return { ...prev, user: null, isAuthenticated: false, sessionStart: null, sessionExpiresAt: null, timeRemaining: SESSION_DURATION, showExpiryWarning: false, auditLog: [entry, ...prev.auditLog] };
      }
      return { ...prev, user: null, isAuthenticated: false };
    });
    navigate('/');
  }, [navigate]);

  const switchPersona = useCallback((personaId: string) => {
    const persona = PERSONAS.find(p => p.id === personaId);
    if (!persona) return;
    setState(prev => {
      const entry: AuditEntry = {
        id: generateId(),
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        user: persona.name,
        role: persona.role,
        action: 'Demo Role Switch',
        actionType: 'Login',
        details: `Switched to persona: ${persona.name} (${persona.role})`,
        comment: 'Demo mode persona switch',
      };
      return { ...prev, user: persona, auditLog: [entry, ...prev.auditLog] };
    });
    startSessionTimer();
    navigate(persona.homePath);
  }, [navigate, startSessionTimer]);

  const extendSession = useCallback(() => {
    startSessionTimer();
    setState(prev => ({ ...prev, showExpiryWarning: false }));
  }, [startSessionTimer]);

  const dismissExpiryWarning = useCallback(() => {
    setState(prev => ({ ...prev, showExpiryWarning: false }));
  }, []);

  const addRetrainingLabels = useCallback((labels: RetrainingLabel[]) => {
    setState(prev => ({ ...prev, retrainingLabels: [...prev.retrainingLabels, ...labels] }));
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchPersona, extendSession, addAuditEntry, addRetrainingLabels, dismissExpiryWarning }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
