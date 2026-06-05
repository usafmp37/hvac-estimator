import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataSyncProvider } from './context/DataSyncContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProjectEditor from './pages/ProjectEditor';
import ProposalPage from './pages/ProposalPage';
import BuildersPage from './pages/BuildersPage';
import ProposalItemsPage from './pages/ProposalItemsPage';
import SettingsPage from './pages/SettingsPage';
import PricingEditor from './pages/PricingEditor';
import CoverPage from './pages/CoverPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <div style={{ fontSize: 14, color: '#64748b' }}>Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <DataSyncProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects/new" element={<ProjectEditor />} />
            <Route path="projects/:id" element={<ProjectEditor />} />
            <Route path="projects/:id/proposal" element={<ProposalPage />} />
            <Route path="projects/:id/cover" element={<CoverPage />} />
            <Route path="builders" element={<BuildersPage />} />
            <Route path="proposal-items" element={<ProposalItemsPage />} />
            <Route path="pricing" element={<PricingEditor />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataSyncProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
