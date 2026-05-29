import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Builder } from '../types';
import { Plus, Edit2, Trash2, Check, X, Users } from 'lucide-react';

const emptyBuilder: Omit<Builder, 'id'> = { name: '', address: '', cityState: '', phone: '', email: '' };

const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13.5 };

function BuilderForm({ initial, onSave, onCancel }: { initial: Omit<Builder, 'id'>; onSave: (b: Omit<Builder, 'id'>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Builder Name *</label>
          <input value={form.name} onChange={set('name')} style={inputStyle} placeholder="ABC Builders" />
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone</label>
          <input value={form.phone} onChange={set('phone')} style={inputStyle} placeholder="(555) 555-5555" />
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address</label>
          <input value={form.address} onChange={set('address')} style={inputStyle} placeholder="123 Main St" />
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>City, State, Zip</label>
          <input value={form.cityState} onChange={set('cityState')} style={inputStyle} placeholder="Austin, TX 78701" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
          <input value={form.email} onChange={set('email')} style={inputStyle} placeholder="contact@builder.com" type="email" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          onClick={() => form.name.trim() && onSave(form)}
          disabled={!form.name.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 13.5, cursor: 'pointer', opacity: form.name.trim() ? 1 : 0.5 }}
        >
          <Check size={14} /> Save
        </button>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function BuildersPage() {
  const { builders, addBuilder, updateBuilder, deleteBuilder } = useStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Builders</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Builder contacts auto-populate onto proposals when selected.</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', padding: '9px 18px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            <Plus size={16} /> Add Builder
          </button>
        )}
      </div>

      {adding && (
        <BuilderForm
          initial={emptyBuilder}
          onSave={(b) => { addBuilder(b); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      )}

      {builders.length === 0 && !adding ? (
        <div style={{ background: 'white', borderRadius: 10, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', color: '#94a3b8' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 15 }}>No builders yet. Add your first builder to get started.</p>
        </div>
      ) : (
        <div>
          {builders.map((b) => (
            <div key={b.id}>
              {editingId === b.id ? (
                <BuilderForm
                  initial={b}
                  onSave={(data) => { updateBuilder(b.id, data); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 6 }}>{b.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                      {b.address && <span>{b.address}, </span>}
                      {b.cityState && <span>{b.cityState}</span>}
                      {(b.phone || b.email) && <br />}
                      {b.phone && <span>📞 {b.phone}  </span>}
                      {b.email && <span>✉ {b.email}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <button onClick={() => setEditingId(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => { if (confirm(`Delete ${b.name}?`)) deleteBuilder(b.id); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
