import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import FraudRingsPage from './pages/FraudRingsPage';
import RingDetailPage from './pages/RingDetailPage';
import NetworkExplorerPage from './pages/NetworkExplorerPage';
import TransactionsPage from './pages/TransactionsPage';
import AccountsPage from './pages/AccountsPage';
import InvestigationsPage from './pages/InvestigationsPage';
import AlertsPage from './pages/AlertsPage';
import TeamOverviewPage from './pages/TeamOverviewPage';
import InsightsPage from './pages/InsightsPage';
import SystemActivityPage from './pages/SystemActivityPage';
import DetectionRulesPage from './pages/DetectionRulesPage';
import ModelAnalyticsPage from './pages/ModelAnalyticsPage';
import UsersPage from './pages/UsersPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';

// Role-based route guard
const ProtectedRoute: React.FC<{ element: React.ReactElement; allowedRoles: string[] }> = ({ element, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user!.role)) return <Navigate to={user!.homePath} replace />;
  return element;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route element={<AppShell />}>
        {/* Analyst routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} allowedRoles={['analyst']} />} />
        <Route path="/fraud-rings" element={<ProtectedRoute element={<FraudRingsPage />} allowedRoles={['analyst', 'lead', 'admin']} />} />
        <Route path="/fraud-rings/:id" element={<ProtectedRoute element={<RingDetailPage />} allowedRoles={['analyst', 'lead', 'admin', 'auditor']} />} />
        <Route path="/network" element={<ProtectedRoute element={<NetworkExplorerPage />} allowedRoles={['analyst', 'lead', 'admin']} />} />
        <Route path="/transactions" element={<ProtectedRoute element={<TransactionsPage />} allowedRoles={['analyst', 'lead', 'admin']} />} />
        <Route path="/accounts" element={<ProtectedRoute element={<AccountsPage />} allowedRoles={['analyst', 'lead', 'admin']} />} />
        <Route path="/investigations" element={<ProtectedRoute element={<InvestigationsPage />} allowedRoles={['analyst', 'lead', 'admin']} />} />
        <Route path="/alerts" element={<ProtectedRoute element={<AlertsPage />} allowedRoles={['analyst', 'lead']} />} />
        {/* Lead routes */}
        <Route path="/team-overview" element={<ProtectedRoute element={<TeamOverviewPage />} allowedRoles={['lead']} />} />
        <Route path="/insights" element={<ProtectedRoute element={<InsightsPage />} allowedRoles={['lead', 'admin']} />} />
        {/* Admin routes */}
        <Route path="/system-activity" element={<ProtectedRoute element={<SystemActivityPage />} allowedRoles={['admin']} />} />
        <Route path="/rules" element={<ProtectedRoute element={<DetectionRulesPage />} allowedRoles={['admin']} />} />
        <Route path="/model-analytics" element={<ProtectedRoute element={<ModelAnalyticsPage />} allowedRoles={['admin']} />} />
        <Route path="/users" element={<ProtectedRoute element={<UsersPage />} allowedRoles={['admin']} />} />
        {/* Auditor routes */}
        <Route path="/audit-log" element={<ProtectedRoute element={<AuditLogPage />} allowedRoles={['auditor', 'admin']} />} />
        {/* Common */}
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} allowedRoles={['analyst', 'lead', 'admin', 'auditor']} />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
