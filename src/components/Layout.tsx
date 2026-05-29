import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FolderPlus, Users, ListChecks, DollarSign, Settings, Wind, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects/new', label: 'New Estimate', icon: FolderPlus },
  { to: '/builders', label: 'Builders', icon: Users },
  { to: '/proposal-items', label: 'Proposal Items', icon: ListChecks },
  { to: '/pricing', label: 'Pricing', icon: DollarSign },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function SyncStatus() {
  const { syncStatus, lastSaved } = useDataSync();

  const dot: Record<string, string> = {
    loading: '#f59e0b',
    saving:  '#f59e0b',
    ready:   '#10b981',
    error:   '#ef4444',
  };

  const label = {
    loading: 'Syncing…',
    saving:  'Saving…',
    ready:   lastSaved
      ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Ready',
    error:   'Sync error',
  }[syncStatus] ?? syncStatus;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 20px' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot[syncStatus] ?? '#64748b', flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
    </div>
  );
}

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#1e293b', color: '#cbd5e1', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#3b82f6', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Wind size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white', lineHeight: 1.2 }}>HVAC Estimator</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Mechanical Design</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 20px', fontSize: 13.5, fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? 'white' : '#94a3b8',
                background: isActive ? '#2d3f55' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #334155' }}>
          <SyncStatus />

          {/* User / sign out */}
          <div style={{ padding: '8px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
            <button
              onClick={signOut}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2, display: 'flex', flexShrink: 0 }}
            >
              <LogOut size={14} />
            </button>
          </div>

          <div style={{ padding: '0 20px 14px', fontSize: 11, color: '#334155' }}>
            TACLA30880E
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
