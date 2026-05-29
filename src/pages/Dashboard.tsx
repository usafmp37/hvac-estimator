import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Plus, FileText, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import type { Project } from '../types';

const statusColors: Record<Project['status'], { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  draft: { bg: '#fef3c7', text: '#92400e', label: 'Draft', icon: <FileText size={12} /> },
  sent: { bg: '#dbeafe', text: '#1e40af', label: 'Sent', icon: <Send size={12} /> },
  accepted: { bg: '#d1fae5', text: '#065f46', label: 'Accepted', icon: <CheckCircle size={12} /> },
  declined: { bg: '#fee2e2', text: '#991b1b', label: 'Declined', icon: <XCircle size={12} /> },
};

function StatusBadge({ status }: { status: Project['status'] }) {
  const s = statusColors[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.text }}>
      {s.icon} {s.label}
    </span>
  );
}

export default function Dashboard() {
  const { projects, builders, deleteProject } = useStore();

  const counts = {
    total: projects.length,
    draft: projects.filter((p) => p.status === 'draft').length,
    sent: projects.filter((p) => p.status === 'sent').length,
    accepted: projects.filter((p) => p.status === 'accepted').length,
  };

  const getBuilderName = (id: string) => builders.find((b) => b.id === id)?.name ?? '—';

  const sorted = [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Manage your HVAC estimates and proposals</p>
        </div>
        <Link
          to="/projects/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
        >
          <Plus size={16} /> New Estimate
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Projects', value: counts.total, color: '#3b82f6' },
          { label: 'Drafts', value: counts.draft, color: '#f59e0b' },
          { label: 'Sent', value: counts.sent, color: '#6366f1' },
          { label: 'Accepted', value: counts.accepted, color: '#10b981' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects table */}
      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#64748b" />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>Recent Estimates</span>
        </div>

        {sorted.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 15 }}>No estimates yet. <Link to="/projects/new" style={{ color: '#3b82f6' }}>Create your first one.</Link></p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Project Name', 'Builder', 'Address', 'Bid Due', 'Sq Ft', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{p.projectName || '(Unnamed)'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{p.systems.length} system{p.systems.length !== 1 ? 's' : ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{getBuilderName(p.builderId)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{p.projectAddress || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{p.bidDueDate || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{p.totalACSqft > 0 ? p.totalACSqft.toLocaleString() : '—'}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/projects/${p.id}`} style={{ fontSize: 12.5, fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}>Edit</Link>
                      <Link to={`/projects/${p.id}/proposal`} style={{ fontSize: 12.5, fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>Proposal</Link>
                      <button onClick={() => { if (confirm('Delete this project?')) deleteProject(p.id); }} style={{ fontSize: 12.5, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
