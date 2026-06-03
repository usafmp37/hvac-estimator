import { useState } from 'react';
import { useStore, getSectionItems } from '../store/useStore';
import type { SectionKey, ProposalItem } from '../types';
import { HVAC_ITEM_PRICE_MAP } from '../utils/pricing';
import { Plus, Trash2, Edit2, Check, X, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';

const SECTIONS: { key: SectionKey; label: string; hasPrice: boolean }[] = [
  { key: 'scopeOfWork', label: 'Scope of Work', hasPrice: false },
  { key: 'equipmentOptions', label: 'Equipment Options', hasPrice: true },
  { key: 'hvacOptions', label: 'HVAC Options', hasPrice: true },
  { key: 'workNotIncluded', label: 'Work Not Included', hasPrice: false },
];

function ItemRow({
  item, hasPrice, onSave, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  item: ProposalItem; hasPrice: boolean;
  onSave: (text: string, price: string, priceUnit: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [price, setPrice] = useState(item.price ?? '');
  const [unit, setUnit] = useState(item.priceUnit ?? '');

  return (
    <div style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      {/* Reorder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ background: 'none', border: 'none', cursor: isFirst ? 'default' : 'pointer', color: isFirst ? '#e2e8f0' : '#94a3b8', padding: 1 }}><ChevronUp size={13} /></button>
        <button onClick={onMoveDown} disabled={isLast} style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#e2e8f0' : '#94a3b8', padding: 1 }}><ChevronDown size={13} /></button>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '5px 8px', border: '1px solid #3b82f6', borderRadius: 5, fontSize: 13.5 }}
            />
            {hasPrice && (
              <>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price"
                  style={{ width: 100, padding: '5px 8px', border: '1px solid #3b82f6', borderRadius: 5, fontSize: 13 }}
                />
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Unit (e.g. Each)"
                  style={{ width: 130, padding: '5px 8px', border: '1px solid #3b82f6', borderRadius: 5, fontSize: 13 }}
                />
              </>
            )}
            <button onClick={() => { onSave(text, price, unit); setEditing(false); }} style={{ padding: '5px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}><Check size={13} /></button>
            <button onClick={() => { setText(item.text); setPrice(item.price ?? ''); setUnit(item.priceUnit ?? ''); setEditing(false); }} style={{ padding: '5px 10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 5, cursor: 'pointer' }}><X size={13} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13.5, color: '#1e293b' }}>{item.text}</span>
            {hasPrice && item.price && (
              <span style={{ fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {item.priceUnit && ` ${item.priceUnit}`}
              </span>
            )}
            {hasPrice && !item.price && item.priceUnit && (
              <span style={{ fontSize: 12.5, color: '#6b7280' }}>{item.priceUnit}</span>
            )}
          </div>
        )}
      </div>

      {!editing && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}><Edit2 size={13} /></button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 2 }}><Trash2 size={13} /></button>
        </div>
      )}
    </div>
  );
}

export default function ProposalItemsPage() {
  const { proposalItems, addProposalItem, updateProposalItem, deleteProposalItem, reorderProposalItem, updatePricingConfig } = useStore();
  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [newText, setNewText] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const handleAdd = (section: SectionKey, hasPrice: boolean) => {
    if (!newText.trim()) return;
    addProposalItem({ section, text: newText.trim(), price: hasPrice ? newPrice || undefined : undefined, priceUnit: hasPrice ? newUnit || undefined : undefined, isDefault: true });
    setNewText(''); setNewPrice(''); setNewUnit('');
    setAddingSection(null);
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Proposal Items</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
          These are the global default items that appear on every new proposal. Changes here apply to all future proposals.
        </p>
      </div>

      <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 24, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertCircle size={16} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
          Items deleted here are permanently removed from all future proposals. To hide an item from a specific proposal only, use the eye icon on the Proposal Editor.
        </p>
      </div>

      {SECTIONS.map(({ key, label, hasPrice }) => {
        const items = getSectionItems(proposalItems, key);
        return (
          <div key={key} style={{ background: 'white', borderRadius: 10, padding: '18px 22px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #1e293b' }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1e293b' }}>{label}</h2>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            {items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                hasPrice={hasPrice}
                onSave={(text, price, unit) => {
                  updateProposalItem(item.id, { text, price: price || undefined, priceUnit: unit || undefined });
                  // Keep pricingConfig in sync for mapped HVAC items
                  const configField = HVAC_ITEM_PRICE_MAP[item.id];
                  if (configField && price) updatePricingConfig({ [configField]: parseFloat(price) });
                }}
                onDelete={() => { if (confirm(`Delete "${item.text}"? This removes it from all future proposals.`)) deleteProposalItem(item.id); }}
                onMoveUp={() => reorderProposalItem(item.id, 'up')}
                onMoveDown={() => reorderProposalItem(item.id, 'down')}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
              />
            ))}

            {addingSection === key ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <input
                  autoFocus
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Item text..."
                  style={{ flex: 1, minWidth: 200, padding: '7px 10px', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 13.5 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd(key, hasPrice)}
                />
                {hasPrice && (
                  <>
                    <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price" style={{ width: 100, padding: '7px 10px', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 13 }} />
                    <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="Unit (e.g. Each)" style={{ width: 140, padding: '7px 10px', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 13 }} />
                  </>
                )}
                <button onClick={() => handleAdd(key, hasPrice)} style={{ padding: '7px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Add</button>
                <button onClick={() => setAddingSection(null)} style={{ padding: '7px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingSection(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13, fontWeight: 600 }}
              >
                <Plus size={14} /> Add item
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
