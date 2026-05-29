import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';
import { Cloud, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { syncStatus, lastSaved } = useDataSync();

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>Settings</h1>
      <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: 14 }}>
        Application preferences and account info.
      </p>

      {/* Cloud Sync card */}
      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ background: '#eff6ff', borderRadius: 7, padding: 7, display: 'flex' }}>
            <Cloud size={16} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Cloud Sync</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>All changes save automatically to Supabase</div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 7, marginBottom: 12 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              background: syncStatus === 'error' ? '#ef4444' : syncStatus === 'saving' ? '#f59e0b' : '#10b981',
            }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                {syncStatus === 'loading' && 'Connecting…'}
                {syncStatus === 'saving'  && 'Saving…'}
                {syncStatus === 'ready'   && 'Auto-save active'}
                {syncStatus === 'error'   && 'Sync error — check your connection'}
              </div>
              {lastSaved && syncStatus === 'ready' && (
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              )}
            </div>
          </div>

          {syncStatus === 'ready' && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 7, border: '1px solid #bbf7d0' }}>
              <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: '#14532d', lineHeight: 1.5 }}>
                Your estimates are saved to the cloud and accessible from any browser.
              </div>
            </div>
          )}

          {syncStatus === 'error' && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#fef2f2', borderRadius: 7, border: '1px solid #fecaca' }}>
              <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>
                Could not reach the database. Your changes are saved locally and will sync when the connection is restored.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account card */}
      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14 }}>
          Account
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{user?.email}</div>
        </div>
      </div>

      {/* More settings coming soon */}
      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', color: '#94a3b8', textAlign: 'center', padding: '36px 24px' }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          More settings coming soon — company logo, license number, and default proposal text.
        </p>
      </div>
    </div>
  );
}
