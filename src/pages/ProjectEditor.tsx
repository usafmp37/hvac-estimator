import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { System, ProjectAttachment, BundledAccessory } from '../types';
import { calculatePrices, hvacAddonPrices, fmtUSD, toEquipmentSize, effectiveTons, getHvacAccessoryPrice } from '../utils/pricing';
import { Plus, Trash2, ChevronRight, Check, Eye, Printer, Paperclip, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Tab = 'details' | 'systems' | 'summary' | 'drawings';

const uid = () => Math.random().toString(36).slice(2, 10);
const tonsFromSqft = (sqft: number) => +(sqft / 500).toFixed(2);

function Field({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
      {note && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>{note}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', background: 'white' };
const numInputStyle: React.CSSProperties = { ...inputStyle, width: '100%' };

function SystemCard({ system, onChange, onDelete }: { system: System; onChange: (s: System) => void; onDelete: () => void }) {
  const calcTons = tonsFromSqft(system.sqft);
  const eTons = effectiveTons(system);
  const eqSize = toEquipmentSize(eTons);
  const isOverridden = system.overrideTons != null && system.overrideTons > 0;

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={system.name}
            onChange={(e) => onChange({ ...system, name: e.target.value })}
            style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', border: 'none', background: 'transparent', outline: 'none', padding: 0, minWidth: 0 }}
          />
          {calcTons > 0 && (
            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              {calcTons} calc tons
            </span>
          )}
          {calcTons > 0 && (
            <span style={{ background: isOverridden ? '#fef3c7' : '#f1f5f9', color: isOverridden ? '#92400e' : '#64748b', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              {isOverridden ? `${system.overrideTons}T override → ` : ''}{eqSize}T equip
            </span>
          )}
        </div>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Field label="Sq Ft" note={`${calcTons} calc tons`}>
          <input type="number" value={system.sqft || ''} onChange={(e) => onChange({ ...system, sqft: +e.target.value })} style={numInputStyle} placeholder="0" />
        </Field>
        <Field label="Override Equip Size (tons)" note={isOverridden ? `→ selects ${eqSize}T equip` : 'leave blank to use calc'}>
          <input
            type="number"
            value={system.overrideTons ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : +e.target.value;
              onChange({ ...system, overrideTons: val });
            }}
            style={{ ...numInputStyle, borderColor: isOverridden ? '#f59e0b' : '#d1d5db', background: isOverridden ? '#fffbeb' : 'white' }}
            placeholder="e.g. 2.5"
            step="0.5"
            min="1.5"
          />
        </Field>
        <Field label="Thermostats">
          <input type="number" value={system.thermostats || ''} onChange={(e) => onChange({ ...system, thermostats: +e.target.value })} style={numInputStyle} placeholder="0" min="0" />
        </Field>
        <Field label="Grilles">
          <input type="number" value={system.grilles || ''} onChange={(e) => onChange({ ...system, grilles: +e.target.value })} style={numInputStyle} placeholder="0" min="0" />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <Field label="Exhaust Fans">
          <input type="number" value={system.exhaustFans || ''} onChange={(e) => onChange({ ...system, exhaustFans: +e.target.value })} style={numInputStyle} placeholder="0" min="0" />
        </Field>
        <Field label="Dryer Exhausts">
          <input type="number" value={system.dryerExhausts || ''} onChange={(e) => onChange({ ...system, dryerExhausts: +e.target.value })} style={numInputStyle} placeholder="0" min="0" />
        </Field>
        <Field label="Cooktop Exhausts">
          <input type="number" value={system.cooktopExhausts || ''} onChange={(e) => onChange({ ...system, cooktopExhausts: +e.target.value })} style={numInputStyle} placeholder="0" min="0" />
        </Field>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={system.zoned}
            onChange={(e) => onChange({ ...system, zoned: e.target.checked })}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          Zoned System
        </label>
      </div>
    </div>
  );
}

export default function ProjectEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const { projects, builders, pricingConfig, proposalItems, addProject, updateProject } = useStore();
  const existing = projects.find((p) => p.id === id);

  const [tab, setTab] = useState<Tab>('details');
  const [printSummary, setPrintSummary] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const skipNextSave = useRef(true); // skip initial render and data-load triggers
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!printSummary) return;
    const timer = setTimeout(() => {
      window.print();
      const handler = () => setPrintSummary(false);
      window.addEventListener('afterprint', handler, { once: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [printSummary]);
  const [form, setForm] = useState({
    projectName: '',
    projectAddress: '',
    cityState: '',
    builderId: '',
    bidStartDate: '',
    bidDueDate: '',
    totalACSqft: 0,
    architectSqft: 0,
    markupPct: 0.08,
    status: 'draft' as import('../types').Project['status'],
    systems: [] as System[],
    geothermalWells: 0,
    proposalOverrides: [] as any[],
    attachments: [] as ProjectAttachment[],
    bundledAccessories: [] as BundledAccessory[],
  });

  useEffect(() => {
    if (existing) {
      skipNextSave.current = true; // don't auto-save when populating form from store
      setForm({
        projectName: existing.projectName,
        projectAddress: existing.projectAddress,
        cityState: existing.cityState,
        builderId: existing.builderId,
        bidStartDate: existing.bidStartDate,
        bidDueDate: existing.bidDueDate,
        totalACSqft: existing.totalACSqft,
        architectSqft: existing.architectSqft ?? 0,
        markupPct: existing.markupPct ?? 0.08,
        status: existing.status,
        systems: existing.systems,
        geothermalWells: existing.geothermalWells,
        proposalOverrides: existing.proposalOverrides,
        attachments: existing.attachments ?? [],
        bundledAccessories: existing.bundledAccessories ?? [],
      });
    }
  }, [existing?.id]);

  // Auto-save: debounce form changes and persist to the store
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      const data = { ...form, totalACSqft: totalSqft || form.totalACSqft };

      if (isNew) {
        // For new projects: auto-create as soon as a project name is entered
        if (form.projectName.trim()) {
          const newId = addProject(data);
          navigate(`/projects/${newId}`, { replace: true });
        }
      } else {
        updateProject(id!, data);
        setSaveStatus('saved');
        if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
        savedResetTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
      }
    }, 800);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const totalSqft = form.systems.reduce((s, x) => s + (x.sqft || 0), 0);
  const totalTons = +(totalSqft / 500).toFixed(2);
  const totalThermostats = form.systems.reduce((s, x) => s + (x.thermostats || 0), 0);
  const totalExhaust = form.systems.reduce((s, x) => s + (x.exhaustFans || 0), 0);
  const totalDryer = form.systems.reduce((s, x) => s + (x.dryerExhausts || 0), 0);
  const totalCooktop = form.systems.reduce((s, x) => s + (x.cooktopExhausts || 0), 0);
  const totalGrilles = form.systems.reduce((s, x) => s + (x.grilles || 0), 0);
  const zonedCount = form.systems.filter((s) => s.zoned).length;

  const pricing = form.systems.length > 0
    ? calculatePrices({ systems: form.systems, architectSqft: form.architectSqft, markupPct: form.markupPct, config: pricingConfig })
    : null;
  const addons = pricing ? hvacAddonPrices(pricing) : null;

  const addSystem = () => {
    setForm((f) => ({
      ...f,
      systems: [...f.systems, {
        id: uid(),
        name: `System ${f.systems.length + 1}`,
        sqft: 0, zoned: false, thermostats: 1,
        exhaustFans: 0, dryerExhausts: 0, cooktopExhausts: 0, grilles: 0,
      }],
    }));
  };

  const updateSystem = (sys: System) => {
    setForm((f) => ({ ...f, systems: f.systems.map((x) => x.id === sys.id ? sys : x) }));
  };

  const removeSystem = (id: string) => {
    setForm((f) => ({ ...f, systems: f.systems.filter((x) => x.id !== id) }));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !id) return;
    setUploading(true);
    setUploadError(null);
    const newAttachments: ProjectAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are supported.');
        continue;
      }
      const path = `${id}/${uid()}-${file.name}`;
      const { error } = await supabase.storage.from('drawings').upload(path, file);
      if (error) { setUploadError(`Upload failed: ${error.message}`); continue; }
      const { data: urlData } = supabase.storage.from('drawings').getPublicUrl(path);
      newAttachments.push({ id: uid(), name: file.name, path, url: urlData.publicUrl, uploadedAt: new Date().toISOString() });
    }
    if (newAttachments.length > 0) {
      setForm((f) => ({ ...f, attachments: [...f.attachments, ...newAttachments] }));
    }
    setUploading(false);
  };

  const handleDeleteAttachment = async (attachment: ProjectAttachment) => {
    await supabase.storage.from('drawings').remove([attachment.path]);
    setForm((f) => ({ ...f, attachments: f.attachments.filter((a) => a.id !== attachment.id) }));
  };

  const toggleBundle = (itemId: string, priceUnit: string | undefined) => {
    setForm((f) => {
      const exists = f.bundledAccessories.find((b) => b.itemId === itemId);
      if (exists) return { ...f, bundledAccessories: f.bundledAccessories.filter((b) => b.itemId !== itemId) };
      const defaultQty = priceUnit === 'Per System' ? Math.max(1, f.systems.length) : 1;
      return { ...f, bundledAccessories: [...f.bundledAccessories, { itemId, quantity: defaultQty }] };
    });
  };

  const updateBundleQty = (itemId: string, quantity: number) => {
    setForm((f) => ({
      ...f,
      bundledAccessories: f.bundledAccessories.map((b) => b.itemId === itemId ? { ...b, quantity: Math.max(1, quantity) } : b),
    }));
  };

  const save = () => {
    const data = { ...form, totalACSqft: totalSqft || form.totalACSqft };
    if (isNew) {
      const newId = addProject(data);
      navigate(`/projects/${newId}`);
    } else {
      updateProject(id!, data);
      setSaveStatus('saved');
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
      savedResetTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: 13.5,
    fontWeight: 600,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
    color: tab === t ? '#3b82f6' : '#64748b',
  });

  if (printSummary) {
    return (
      <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', background: 'white', minHeight: '100vh' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }} className="no-print">
          <strong>Printing Estimate Summary…</strong>
          <button onClick={() => setPrintSummary(false)} style={{ fontSize: 12, color: '#64748b', border: '1px solid #e2e8f0', background: 'white', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>{form.projectName || 'Estimate Summary'}</h2>
        {form.projectAddress && <div style={{ fontSize: 13, color: '#475569', marginBottom: 2 }}>{form.projectAddress}</div>}
        {form.cityState && <div style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>{form.cityState}</div>}

        {/* System breakdown */}
        {form.systems.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['System', 'Sq Ft', 'Tons', 'Equip Size', 'Zoned', 'Tstats', 'Exh Fans', 'Dryer', 'Cooktop', 'Grilles'].map((h) => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.systems.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '5px 8px' }}>{s.sqft.toLocaleString()}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>{tonsFromSqft(s.sqft)}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>{toEquipmentSize(effectiveTons(s))}T{s.overrideTons ? ' ★' : ''}</td>
                  <td style={{ padding: '5px 8px' }}>{s.zoned ? '✓' : '—'}</td>
                  <td style={{ padding: '5px 8px' }}>{s.thermostats}</td>
                  <td style={{ padding: '5px 8px' }}>{s.exhaustFans}</td>
                  <td style={{ padding: '5px 8px' }}>{s.dryerExhausts}</td>
                  <td style={{ padding: '5px 8px' }}>{s.cooktopExhausts}</td>
                  <td style={{ padding: '5px 8px' }}>{s.grilles}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                <td style={{ padding: '6px 8px' }}>TOTALS</td>
                <td style={{ padding: '6px 8px' }}>{totalSqft.toLocaleString()}</td>
                <td style={{ padding: '6px 8px' }}>{totalTons}</td>
                <td style={{ padding: '6px 8px' }}>{form.systems.length} sys</td>
                <td style={{ padding: '6px 8px' }}>{zonedCount > 0 ? zonedCount : '—'}</td>
                <td style={{ padding: '6px 8px' }}>{totalThermostats}</td>
                <td style={{ padding: '6px 8px' }}>{totalExhaust}</td>
                <td style={{ padding: '6px 8px' }}>{totalDryer}</td>
                <td style={{ padding: '6px 8px' }}>{totalCooktop}</td>
                <td style={{ padding: '6px 8px' }}>{totalGrilles}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Pricing tiers */}
        {pricing && (
          <>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>Equipment Option Pricing ({Math.round((form.markupPct || 0.08) * 100)}% markup)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Option', 'Rating', 'Price'].map((h) => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'VRV Daikin IV', rating: '18.0 EER', price: pricing.prices.vrv },
                  { label: 'Geothermal', rating: '27.0 EER', price: pricing.prices.geothermal },
                  { label: 'Premium Lennox', rating: '28.0 SEER', price: pricing.prices.premium },
                  { label: 'Deluxe Lennox', rating: '23.0 SEER', price: pricing.prices.deluxe },
                  { label: 'Standard Lennox', rating: '18.0 SEER', price: pricing.prices.standard },
                ].map((r) => (
                  <tr key={r.label} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.label}</td>
                    <td style={{ padding: '6px 10px', color: '#64748b' }}>{r.rating}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700 }}>{fmtUSD(r.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Fees + add-ons */}
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>Fees &amp; Add-ons</h3>
            <table style={{ width: '50%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {[
                  { label: 'Design Fee', value: pricing.designFee },
                  { label: 'Permit Fee', value: pricing.permitFee },
                  ...(addons ? [
                    pricing.numExhaustFans > 0 ? { label: `Exhaust Fans w/Grilles (${pricing.numExhaustFans})`, value: addons.exhaustFansWithGrilles } : null,
                    pricing.numExhaustFans > 0 ? { label: `Exhaust Fans Venting Only (${pricing.numExhaustFans})`, value: addons.exhaustFansVentingOnly } : null,
                    pricing.numCooktops > 0 ? { label: `Cooktop Venting (${pricing.numCooktops})`, value: addons.cooktopVenting } : null,
                    pricing.numDryers > 0 ? { label: `Dryer Venting (${pricing.numDryers})`, value: addons.dryerVenting } : null,
                    { label: `10yr Warranty (${pricing.numSystems} sys)`, value: addons.extendedWarranty },
                  ].filter(Boolean) : []),
                ].filter(Boolean).map((r: any) => (
                  <tr key={r.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 10px', color: '#475569' }}>{r.label}</td>
                    <td style={{ padding: '5px 10px', fontWeight: 600, textAlign: 'right' }}>{fmtUSD(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
            <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
            <ChevronRight size={14} style={{ verticalAlign: 'middle', margin: '0 4px' }} />
            {isNew ? 'New Estimate' : form.projectName || 'Edit Project'}
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{isNew ? 'New Estimate' : 'Edit Estimate'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isNew && (
            <Link to={`/projects/${id}/proposal`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#f1f5f9', color: '#1e293b', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>
              <Eye size={15} /> View Proposal
            </Link>
          )}
          <button
            onClick={save}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px',
              background: saveStatus === 'saved' ? '#10b981' : '#3b82f6',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
              transition: 'background 0.25s',
            }}
          >
            <Check size={15} />
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: 28, display: 'flex' }}>
        <button style={tabStyle('details')} onClick={() => setTab('details')}>Job Details</button>
        <button style={tabStyle('systems')} onClick={() => setTab('systems')}>Systems ({form.systems.length})</button>
        <button style={tabStyle('summary')} onClick={() => setTab('summary')}>Estimate Summary</button>
        <button style={tabStyle('drawings')} onClick={() => setTab('drawings')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Paperclip size={13} /> Drawings {form.attachments.length > 0 ? `(${form.attachments.length})` : ''}
          </span>
        </button>
      </div>

      {/* ── TAB: Job Details ── */}
      {tab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <h2 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Project Information</h2>
            <Field label="Project Name">
              <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} style={inputStyle} placeholder="e.g. Smith Residence" />
            </Field>
            <Field label="Project Address">
              <input value={form.projectAddress} onChange={(e) => setForm({ ...form, projectAddress: e.target.value })} style={inputStyle} placeholder="123 Main St" />
            </Field>
            <Field label="City, State">
              <input value={form.cityState} onChange={(e) => setForm({ ...form, cityState: e.target.value })} style={inputStyle} placeholder="Austin, TX" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Bid Start Date">
                <input type="date" value={form.bidStartDate} onChange={(e) => setForm({ ...form, bidStartDate: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Bid Due Date">
                <input type="date" value={form.bidDueDate} onChange={(e) => setForm({ ...form, bidDueDate: e.target.value })} style={inputStyle} />
              </Field>
            </div>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} style={inputStyle}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </Field>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <h2 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Builder</h2>
            <Field label="Select Builder">
              <select value={form.builderId} onChange={(e) => setForm({ ...form, builderId: e.target.value })} style={inputStyle}>
                <option value="">— Select a builder —</option>
                {builders.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            {form.builderId && (() => {
              const b = builders.find((x) => x.id === form.builderId);
              if (!b) return null;
              return (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, fontSize: 13.5, color: '#475569', lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{b.name}</div>
                  {b.address && <div>{b.address}</div>}
                  {b.cityState && <div>{b.cityState}</div>}
                  {b.phone && <div>📞 {b.phone}</div>}
                  {b.email && <div>✉ {b.email}</div>}
                </div>
              );
            })()}
            {builders.length === 0 && (
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0' }}>
                No builders yet. <Link to="/builders" style={{ color: '#3b82f6' }}>Add one →</Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Systems ── */}
      {tab === 'systems' && (
        <div>
          {form.systems.map((sys) => (
            <SystemCard key={sys.id} system={sys} onChange={updateSystem} onDelete={() => removeSystem(sys.id)} />
          ))}
          <button
            onClick={addSystem}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 20px', border: '2px dashed #cbd5e1', borderRadius: 10, background: 'white', cursor: 'pointer', color: '#3b82f6', fontWeight: 600, fontSize: 14, justifyContent: 'center' }}
          >
            <Plus size={16} /> Add System
          </button>
        </div>
      )}

      {/* ── TAB: Summary ── */}
      {tab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setPrintSummary(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              <Printer size={14} /> Print / PDF Summary
            </button>
          </div>

          {/* System breakdown table */}
          <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>System Breakdown</h2>
            {form.systems.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14 }}>No systems added yet. Go to the Systems tab to add zones.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['System', 'Sq Ft', 'Tons', 'Equip Size', 'Zoned', 'Tstats', 'Exh Fans', 'Dryer', 'Cooktop', 'Grilles'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.systems.map((s) => {
                    const eqSize = toEquipmentSize(effectiveTons(s));
                    const isOvr = s.overrideTons != null && s.overrideTons > 0;
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: '8px 12px' }}>{s.sqft.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', color: '#1d4ed8', fontWeight: 600 }}>{tonsFromSqft(s.sqft)}</td>
                        <td style={{ padding: '8px 12px', color: isOvr ? '#92400e' : '#7c3aed', fontWeight: 600 }}>{eqSize}T{isOvr ? ' ★' : ''}</td>
                        <td style={{ padding: '8px 12px' }}>{s.zoned ? '✓' : '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{s.thermostats}</td>
                        <td style={{ padding: '8px 12px' }}>{s.exhaustFans}</td>
                        <td style={{ padding: '8px 12px' }}>{s.dryerExhausts}</td>
                        <td style={{ padding: '8px 12px' }}>{s.cooktopExhausts}</td>
                        <td style={{ padding: '8px 12px' }}>{s.grilles}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <td style={{ padding: '10px 12px' }}>TOTALS</td>
                    <td style={{ padding: '10px 12px' }}>{totalSqft.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#1d4ed8' }}>{totalTons}</td>
                    <td style={{ padding: '10px 12px' }}>{form.systems.length} sys</td>
                    <td style={{ padding: '10px 12px' }}>{zonedCount > 0 ? `${zonedCount}` : '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{totalThermostats}</td>
                    <td style={{ padding: '10px 12px' }}>{totalExhaust}</td>
                    <td style={{ padding: '10px 12px' }}>{totalDryer}</td>
                    <td style={{ padding: '10px 12px' }}>{totalCooktop}</td>
                    <td style={{ padding: '10px 12px' }}>{totalGrilles}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Pricing inputs */}
            <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Pricing Inputs</h2>
              <Field label="Architect Plan Sq Ft" note="Used for design fee (1.5× sqft) and permit fee (0.25× sqft)">
                <input type="number" value={form.architectSqft || ''} onChange={(e) => setForm({ ...form, architectSqft: +e.target.value })} style={numInputStyle} placeholder="0" min="0" />
              </Field>
              <Field label={`Markup % (currently ${Math.round((form.markupPct || 0.08) * 100)}%)`}>
                <input type="number" value={Math.round((form.markupPct || 0.08) * 100)} onChange={(e) => setForm({ ...form, markupPct: +(+e.target.value / 100).toFixed(4) })} style={{ ...numInputStyle, width: 100 }} min="0" max="50" step="1" />
              </Field>
              <Field label="Geothermal Wells" note={pricing ? `Auto-calc: ${pricing.numWells} wells (architect tons × 1.25)` : 'Enter architect sq ft to auto-calculate'}>
                <input type="number" value={form.geothermalWells || ''} onChange={(e) => setForm({ ...form, geothermalWells: +e.target.value })} style={{ ...numInputStyle, width: 120 }} placeholder={pricing ? String(pricing.numWells) : '0'} min="0" />
              </Field>
              {pricing && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Design fee</span>
                    <span style={{ fontWeight: 600 }}>{fmtUSD(pricing.designFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Permit fee</span>
                    <span style={{ fontWeight: 600 }}>{fmtUSD(pricing.permitFee)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* HVAC Add-on pricing */}
            {addons && (
              <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>HVAC Add-on Pricing</h2>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#94a3b8' }}>Based on quantities entered. Quoted separately on proposal.</p>
                {[
                  { label: `Exhaust Fans w/Grilles (${pricing!.numExhaustFans})`, value: addons.exhaustFansWithGrilles },
                  { label: `Exhaust Fans Venting Only (${pricing!.numExhaustFans})`, value: addons.exhaustFansVentingOnly },
                  { label: `Cooktop Venting (${pricing!.numCooktops})`, value: addons.cooktopVenting },
                  { label: `Dryer Venting (${pricing!.numDryers})`, value: addons.dryerVenting },
                  { label: `10yr Warranty (${pricing!.numSystems} sys)`, value: addons.extendedWarranty },
                ].filter(r => r.value > 0).map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8fafc', fontSize: 13.5 }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{fmtUSD(r.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bundle Accessories into Equipment Options */}
          {(() => {
            // Helper: get price from config map first, fall back to item's stored price
            const resolvePrice = (itemId: string, storedPrice?: string) =>
              getHvacAccessoryPrice(itemId, pricingConfig) || parseFloat(storedPrice || '0') || 0;

            const bundleableItems = proposalItems.filter(
              (item) => item.section === 'hvacOptions' && !item.deleted &&
                resolvePrice(item.id, item.price) > 0
            ).concat(
              (pricingConfig.customHvacAddons ?? []).filter(a => a.price > 0).map(a => ({
                id: a.id, section: 'hvacOptions' as const, text: a.name,
                price: String(a.price), priceUnit: a.priceUnit, isDefault: false, deleted: false, sortOrder: 9999,
              }))
            );
            const bundledTotal = form.bundledAccessories.reduce((sum, b) => {
              const item = proposalItems.find(i => i.id === b.itemId);
              return sum + resolvePrice(b.itemId, item?.price) * b.quantity;
            }, 0);
            return (
              <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Bundle Accessories into Equipment Options</h2>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#64748b' }}>
                  Selected accessory costs will be added to each Equipment Option price on the proposal.
                </p>
                {bundleableItems.map((item) => {
                  const bundled = form.bundledAccessories.find((b) => b.itemId === item.id);
                  const isChecked = !!bundled;
                  const price = resolvePrice(item.id, item.price);
                  const needsQty = item.priceUnit === 'Each' || item.priceUnit === 'Per System';
                  const qty = bundled?.quantity ?? 1;
                  const total = price * qty;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleBundle(item.id, item.priceUnit)}
                        style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5, color: '#1e293b', minWidth: 160 }}>{item.text}</span>
                      <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {fmtUSD(price)}{item.priceUnit ? ` / ${item.priceUnit}` : ''}
                      </span>
                      {isChecked && needsQty && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>Qty:</span>
                          <input type="number" value={qty} min={1} onChange={(e) => updateBundleQty(item.id, +e.target.value)}
                            style={{ width: 60, padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: 6, fontSize: 13, textAlign: 'center' }} />
                        </div>
                      )}
                      {isChecked && (
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#059669', minWidth: 90, textAlign: 'right' }}>
                          +{fmtUSD(total)}
                        </span>
                      )}
                    </div>
                  );
                })}
                {bundledTotal > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Total added to each Equipment Option</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>+{fmtUSD(bundledTotal)}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Equipment pricing table */}
          {pricing && (() => {
            const bundledTotal = form.bundledAccessories.reduce((sum, b) => {
              const item = proposalItems.find(i => i.id === b.itemId);
              return sum + (getHvacAccessoryPrice(b.itemId, pricingConfig) || parseFloat(item?.price || '0') || 0) * b.quantity;
            }, 0);
            return (
              <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Equipment Option Pricing</h2>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#94a3b8' }}>
                  Calculated from system data + {Math.round((form.markupPct || 0.08) * 100)}% markup{bundledTotal > 0 ? ` + ${fmtUSD(bundledTotal)} bundled accessories` : ''}. These prices auto-populate on the proposal.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  {([
                    { label: 'VRV Daikin IV', sublabel: '18.0 EER', price: pricing.prices.vrv + bundledTotal, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Geothermal', sublabel: '27.0 EER', price: pricing.prices.geothermal + bundledTotal, color: '#0891b2', bg: '#ecfeff' },
                    { label: 'Premium Lennox', sublabel: '28.0 SEER', price: pricing.prices.premium + bundledTotal, color: '#059669', bg: '#ecfdf5' },
                    { label: 'Deluxe Lennox', sublabel: '23.0 SEER', price: pricing.prices.deluxe + bundledTotal, color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Standard Lennox', sublabel: '18.0 SEER', price: pricing.prices.standard + bundledTotal, color: '#d97706', bg: '#fffbeb' },
                  ] as const).map((tier) => (
                    <div key={tier.label} style={{ background: tier.bg, borderRadius: 10, padding: '16px 14px', textAlign: 'center', border: `1px solid ${tier.color}22` }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: tier.color, marginBottom: 2 }}>{tier.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{tier.sublabel}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: tier.color }}>{fmtUSD(tier.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB: Drawings ── */}
      {tab === 'drawings' && (
        <div>
          {/* Upload area */}
          <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>PDF Drawings</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
              Attach construction drawings or plans to this estimate. PDFs only.
            </p>

            {isNew ? (
              <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                Save the estimate with a project name first, then you can attach drawings.
              </div>
            ) : (
              <>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', background: uploading ? '#e0f2fe' : '#eff6ff',
                  border: '2px dashed #93c5fd', borderRadius: 8,
                  fontWeight: 600, fontSize: 13.5, color: uploading ? '#0369a1' : '#2563eb',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}>
                  <Paperclip size={15} />
                  {uploading ? 'Uploading…' : 'Choose PDF files'}
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    disabled={uploading}
                    style={{ display: 'none' }}
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </label>

                {uploadError && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
                    {uploadError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Attachment list */}
          {form.attachments.length === 0 && !isNew ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', color: '#94a3b8' }}>
              <FileText size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No drawings attached yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {form.attachments.map((a) => (
                <div key={a.id} style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#fef2f2', borderRadius: 7, padding: 8, flexShrink: 0 }}>
                      <FileText size={20} color="#ef4444" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word', lineHeight: 1.3 }}>
                        {a.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                        {new Date(a.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: 6, fontWeight: 600, fontSize: 12.5, textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> View
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(a)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
