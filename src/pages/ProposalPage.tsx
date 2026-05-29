import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore, getSectionItems } from '../store/useStore';
import type { ProposalItem, SectionKey, CustomHvacAddon } from '../types';
import { calculatePrices, hvacAddonPrices } from '../utils/pricing';
import { Eye, EyeOff, Edit2, Check, X, Plus, Printer, ChevronRight, FileDown } from 'lucide-react';

const SECTION_LABELS: Record<SectionKey, string> = {
  scopeOfWork: 'Scope of Work',
  equipmentOptions: 'Equipment Options',
  hvacOptions: 'HVAC Accessories',
  workNotIncluded: 'Work Not Included',
};

const SECTIONS: SectionKey[] = ['scopeOfWork', 'equipmentOptions', 'hvacOptions', 'workNotIncluded'];

// Print target: 11in - 0.3in top/bottom margins = 10.4in @ 96dpi = 998px, minus buffer = 975px
const PRINT_TARGET_PX = 975;

const NUM_WORDS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty'];
function toWord(n: number) { return n < NUM_WORDS.length ? NUM_WORDS[n] : String(n); }

function fmtPrice(price?: string, unit?: string) {
  if (!price) return unit || '';
  const n = parseFloat(price);
  const formatted = isNaN(n) ? price : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return unit ? `${formatted} ${unit}` : formatted;
}

const B = '1px solid #000';

interface ItemRowProps {
  item: ProposalItem;
  override: { visible: boolean; text?: string; price?: string; priceUnit?: string } | undefined;
  onToggleVisibility: () => void;
  onSaveOverride: (text: string, price: string, unit: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  showPrices: boolean;
  fs: number;
  renderText?: React.ReactNode;
  priceBelowText?: boolean; // Equipment Options: bold "Price: $x" on its own line below description
  showRowBorder?: boolean;  // show faded divider line between rows (HVAC Options only)
}

function ItemRow({ item, override, onToggleVisibility, onSaveOverride, isEditing, onEdit, onCancelEdit, showPrices, fs, renderText, priceBelowText, showRowBorder }: ItemRowProps) {
  const visible = override ? override.visible : true;
  const displayText = override?.text ?? item.text;
  const displayPrice = override?.price || item.price;
  // If override has explicitly set priceUnit (even to ''), use that; otherwise fall back to item default
  const displayUnit = override && 'priceUnit' in override ? override.priceUnit : item.priceUnit;
  const [editText, setEditText] = useState(displayText);
  const [editPrice, setEditPrice] = useState(displayPrice ?? '');
  const [editUnit, setEditUnit] = useState(displayUnit ?? '');

  const startEdit = () => { setEditText(displayText); setEditPrice(displayPrice ?? ''); setEditUnit(displayUnit ?? ''); onEdit(); };

  return (
    <div
      className={!visible ? 'print-hidden' : undefined}
      style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 4, padding: `${priceBelowText ? 2.5 * fs : 0.2 * fs}px 20px ${priceBelowText ? 2.5 * fs : 0.2 * fs}px 0`, borderBottom: showRowBorder ? '1px solid #f1f5f9' : 'none', opacity: visible ? 1 : 0.35 }}
    >
      <button
        className="no-print"
        onClick={onToggleVisibility}
        title={visible ? 'Hide' : 'Show'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: visible ? '#3b82f6' : '#cbd5e1', flexShrink: 0, padding: 2, lineHeight: 1, marginTop: 1 }}
      >
        {visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
              style={{ flex: 1, minWidth: 160, padding: '3px 7px', border: '1px solid #3b82f6', borderRadius: 4, fontSize: 12 }} />
            {showPrices && (
              <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Price"
                style={{ width: 100, padding: '3px 7px', border: '1px solid #3b82f6', borderRadius: 4, fontSize: 12 }} />
            )}
            {showPrices && (
              <input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder="Unit (clear to remove)"
                style={{ width: 150, padding: '3px 7px', border: '1px solid #3b82f6', borderRadius: 4, fontSize: 12 }} />
            )}
          </div>
        ) : priceBelowText && showPrices ? (
          /* Equipment Options: description line, then bold Price: line below */
          <div>
            <div style={{ fontSize: 9.5 * fs, color: '#1e293b', fontFamily: '"Times New Roman", serif', lineHeight: 1.3 }}>
              {renderText ?? displayText}
            </div>
            {(displayPrice || displayUnit) && (
              <div style={{ fontSize: 9.5 * fs, fontWeight: 700, color: '#1e293b', fontFamily: '"Times New Roman", serif', lineHeight: 1.3, marginTop: `${1 * fs}px` }}>
                Price:&nbsp;{fmtPrice(displayPrice, displayUnit)}
              </div>
            )}
          </div>
        ) : showPrices ? (
          /* HVAC Options: text left, price right, no dots */
          <div style={{ display: 'flex', alignItems: 'baseline', gap: `${4 * fs}px` }}>
            <span style={{ flex: 1, fontSize: 9.5 * fs, color: '#1e293b', fontFamily: '"Times New Roman", serif', lineHeight: 1.2 }}>
              {displayText}
            </span>
            <span style={{ fontSize: 9.5 * fs, color: '#1e293b', fontWeight: 500, fontFamily: '"Times New Roman", serif', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.2 }}>
              {fmtPrice(displayPrice, displayUnit)}
            </span>
          </div>
        ) : (
          /* Scope of Work / Work Not Included — no price */
          <span style={{ fontSize: 9.5 * fs, color: '#1e293b', fontFamily: '"Times New Roman", serif', lineHeight: 1.2 }}>
            {renderText ?? displayText}
          </span>
        )}
      </div>

      {/* Edit controls — absolutely positioned so they consume zero flex space */}
      <div className="no-print" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
        {isEditing ? (
          <>
            <button onClick={() => onSaveOverride(editText, editPrice, editUnit)} style={{ background: '#10b981', border: 'none', borderRadius: 3, padding: '2px 5px', cursor: 'pointer', color: 'white' }}><Check size={11} /></button>
            <button onClick={onCancelEdit} style={{ background: '#ef4444', border: 'none', borderRadius: 3, padding: '2px 5px', cursor: 'pointer', color: 'white' }}><X size={11} /></button>
          </>
        ) : (
          <button onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 2 }}><Edit2 size={11} /></button>
        )}
      </div>
    </div>
  );
}

export default function ProposalPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, builders, proposalItems, pricingConfig, updateProject, addProposalItem } = useStore();

  const project = projects.find((p) => p.id === id);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [showStatBar, setShowStatBar] = useState(true);
  const [fontScale, setFontScale] = useState(1.0);
  const [sectionGap, setSectionGap] = useState(0);
  const docRef = useRef<HTMLDivElement>(null);
  const adjustingRef = useRef(false);

  if (!project) {
    return <div style={{ padding: 32, color: '#ef4444' }}>Project not found. <Link to="/">Back to Dashboard</Link></div>;
  }

  const builder = builders.find((b) => b.id === project.builderId);

  const getOverride = (itemId: string) => project.proposalOverrides.find((o) => o.itemId === itemId);

  const toggleVisibility = (itemId: string) => {
    const existing = getOverride(itemId);
    const visible = existing ? !existing.visible : false;
    const overrides = existing
      ? project.proposalOverrides.map((o) => o.itemId === itemId ? { ...o, visible } : o)
      : [...project.proposalOverrides, { itemId, visible }];
    updateProject(id!, { proposalOverrides: overrides });
  };

  const saveOverride = (itemId: string, text: string, price: string, unit: string) => {
    const existing = getOverride(itemId);
    const override = { itemId, visible: existing?.visible ?? true, text, price, priceUnit: unit };
    const overrides = existing
      ? project.proposalOverrides.map((o) => o.itemId === itemId ? override : o)
      : [...project.proposalOverrides, override];
    updateProject(id!, { proposalOverrides: overrides });
    setEditingItemId(null);
  };

  const addNewItem = (section: SectionKey) => {
    if (!newItemText.trim()) return;
    addProposalItem({ section, text: newItemText.trim(), price: newItemPrice || undefined, isDefault: true });
    setNewItemText(''); setNewItemPrice(''); setAddingSection(null);
  };

  const numSystems = project.systems.length;
  const totalSqft = project.systems.reduce((s, x) => s + x.sqft, 0);
  const totalTons = +(totalSqft / 500).toFixed(2);
  const zonedCount = project.systems.filter((s) => s.zoned).length;

  const pricing = numSystems > 0
    ? calculatePrices({ systems: project.systems, architectSqft: project.architectSqft ?? 0, markupPct: project.markupPct ?? 0.08, config: pricingConfig })
    : null;
  const addons = pricing ? hvacAddonPrices(pricing) : null;

  const numExhaustFans = pricing?.numExhaustFans ?? 0;
  const numDryers = pricing?.numDryers ?? 0;
  const numCooktops = pricing?.numCooktops ?? 0;

  const calcEquipPrices: Record<string, number | undefined> = pricing ? {
    'eq-1': pricing.prices.vrv, 'eq-2': pricing.prices.geothermal,
    'eq-3': pricing.prices.premium, 'eq-4': pricing.prices.deluxe, 'eq-5': pricing.prices.standard,
  } : {};

  const calcHvacPrices: Record<string, number | undefined> = addons ? {
    'hvac-2': addons.exhaustFansWithGrilles,
    'hvac-3': addons.exhaustFansVentingOnly,
    'hvac-4': addons.cooktopVenting,
    'hvac-5': addons.dryerVenting,
    'hvac-10': addons.extendedWarranty,
  } : {};

  const dynamicText: Record<string, string> = {
    'sow-4': `${toWord(numSystems)} (${numSystems}) System${numSystems !== 1 ? 's' : ''}`,
    'sow-5': `${toWord(zonedCount)} (${zonedCount}) Honeywell zoning system${zonedCount !== 1 ? 's' : ''}`,
    ...(numExhaustFans > 0 && {
      'hvac-2': `${toWord(numExhaustFans)} (${numExhaustFans}) Inline Exhaust Fan / Venting / Grilles`,
      'hvac-3': `Venting for ${toWord(numExhaustFans)} (${numExhaustFans}) Bath Exhaust Fan`,
    }),
    ...(numCooktops > 0 && {
      'hvac-4': `Venting for ${toWord(numCooktops)} (${numCooktops}) Kitchen Cook Top`,
    }),
    ...(numDryers > 0 && {
      'hvac-5': `Venting for ${toWord(numDryers)} (${numDryers}) Dryer`,
    }),
  };

  // Convert a custom add-on to a ProposalItem shape for rendering
  function addonToItem(addon: CustomHvacAddon): ProposalItem {
    return { id: addon.id, section: 'hvacOptions', text: addon.name, price: String(addon.price), priceUnit: addon.priceUnit || undefined, isDefault: false, deleted: false, sortOrder: 9999 };
  }

  const customAddons: CustomHvacAddon[] = pricingConfig.customHvacAddons ?? [];

  // Count visible items across all sections (used as dependency for auto-scaling)
  const visibleItemCount = SECTIONS.reduce((total, section) => {
    return total + getSectionItems(proposalItems, section).filter((item) => {
      const ov = getOverride(item.id);
      return ov ? ov.visible : true;
    }).length;
  }, 0) + customAddons.filter((a) => { const ov = getOverride(a.id); return ov ? ov.visible : true; }).length;

  // Auto-scale font to fit content on one printed page.
  // Simulates print by: setting div width to 720px (7.5in @ 96dpi = letter minus 0.5in side margins),
  // hiding .no-print controls, and hiding .print-hidden items — then measures height against 10in target.
  const measureAndAdjust = useCallback(() => {
    if (!docRef.current || adjustingRef.current) return;
    adjustingRef.current = true;

    const el = docRef.current;
    const prevMaxWidth = el.style.maxWidth;
    const prevWidth = el.style.width;

    // Temporarily constrain to print content width (7.5in @ 96dpi)
    el.style.maxWidth = '720px';
    el.style.width = '720px';

    const noPrint = Array.from(el.querySelectorAll<HTMLElement>('.no-print'));
    const hidden = Array.from(el.querySelectorAll<HTMLElement>('.print-hidden'));
    const spacers = Array.from(el.querySelectorAll<HTMLElement>('.gap-spacer'));
    const spacerHeights = spacers.map((n) => n.style.height); // save so we can restore after measuring
    noPrint.forEach((n) => (n.style.display = 'none'));
    hidden.forEach((n) => (n.style.display = 'none'));
    spacers.forEach((n) => (n.style.height = '0px')); // zero spacers so we measure raw content height

    const h = el.offsetHeight;

    noPrint.forEach((n) => (n.style.display = ''));
    hidden.forEach((n) => (n.style.display = ''));
    spacers.forEach((n, i) => (n.style.height = spacerHeights[i])); // restore exact saved height
    el.style.maxWidth = prevMaxWidth;
    el.style.width = prevWidth;

    adjustingRef.current = false;

    const tooTall = h > PRINT_TARGET_PX + 10;
    const tooShort = h < PRINT_TARGET_PX - 60;

    if (tooTall) {
      // Overflowing — shrink font and clear gap
      setSectionGap(0);
      setFontScale((prev) => prev > 0.46 ? Math.max(0.46, +(prev - 0.018).toFixed(3)) : prev);
    } else {
      // Not overflowing — fill remaining space above footer (works for stable AND maxed-out-short)
      setSectionGap(Math.max(0, PRINT_TARGET_PX - h));
      if (tooShort) {
        // Still room to grow font — keep scaling up
        setFontScale((prev) => prev < 1.00 ? Math.min(1.00, +(prev + 0.008).toFixed(3)) : prev);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(measureAndAdjust, 120);
    return () => clearTimeout(timer);
  }, [fontScale, visibleItemCount, proposalItems.length, showStatBar, measureAndAdjust]);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Split VRV text after "Individual Room Controllers /" so warranty info goes to its own line.
  // Works regardless of stored text — matches on the "/ Ten (" boundary.
  function vrvLineBreak(text: string): React.ReactNode {
    const idx = text.indexOf(' / Ten (');
    if (idx === -1) return text;
    return <>{text.slice(0, idx)} /<br />{text.slice(idx + 3)}</>;
  }

  // Derived sizes — everything scales together
  const fs = fontScale;
  const CELL_PAD = `${1.5 * fs}px ${5 * fs}px`;

  function HCell({ label, value, style }: { label: string; value: string; style?: React.CSSProperties }) {
    return (
      <td style={{ padding: CELL_PAD, verticalAlign: 'top', borderBottom: B, ...style }}>
        <div style={{ fontSize: 7.5 * fs, color: '#444', marginBottom: 0 }}>{label}</div>
        <div style={{ fontSize: 9.5 * fs, fontWeight: 600 }}>{value}</div>
      </td>
    );
  }

  return (
    <>
      {/* ── Screen-only toolbar ── */}
      <div className="no-print" style={{ padding: '20px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
              <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
              <ChevronRight size={14} style={{ verticalAlign: 'middle', margin: '0 4px' }} />
              <Link to={`/projects/${id}`} style={{ color: '#64748b', textDecoration: 'none' }}>{project.projectName || 'Project'}</Link>
              <ChevronRight size={14} style={{ verticalAlign: 'middle', margin: '0 4px' }} />
              Proposal
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Proposal Editor</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: fontScale < 0.55 ? '#ef4444' : '#94a3b8', background: fontScale < 0.55 ? '#fef2f2' : '#f8fafc', padding: '3px 8px', borderRadius: 4 }}>
              {fontScale < 0.50 ? '⚠ ' : ''}{Math.round(fontScale * 100)}% — {fontScale < 0.50 ? 'hide items to fit 1 page' : 'auto-fit'}
            </span>
            <Link to={`/projects/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', color: '#1e293b', borderRadius: 7, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
              ← Edit Details
            </Link>
            <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: '0 auto 10px', display: 'flex', gap: 14, fontSize: 11.5, color: '#94a3b8' }}>
          <span><Eye size={11} style={{ verticalAlign: 'middle' }} /> eye = show/hide</span>
          <span><Edit2 size={11} style={{ verticalAlign: 'middle' }} /> pencil = edit</span>
          <span><Plus size={11} style={{ verticalAlign: 'middle' }} /> add = saves to all proposals</span>
          <span><FileDown size={11} style={{ verticalAlign: 'middle' }} /> print hides controls</span>
        </div>
      </div>

      {/* ── Proposal Document ── */}
      <div className="proposal-outer" style={{ padding: '0 24px 32px' }}>
        <div
          id="proposal-doc"
          ref={docRef}
          style={{ background: 'white', maxWidth: 820, margin: '0 auto', boxShadow: '0 2px 20px rgba(0,0,0,0.1)', padding: `${6 * fs}px ${10 * fs}px`, fontFamily: '"Times New Roman", Times, serif', fontSize: 9.5 * fs, lineHeight: 1.2 }}
        >

          {/* Company header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 * fs, paddingBottom: 5 * fs, borderBottom: '2px solid #cc0000' }}>
            <div style={{ marginRight: 10 * fs, flexShrink: 0 }}>
              <img
                src="/msc-logo.png"
                alt="MSC Logo"
                style={{ height: 58, width: 'auto', display: 'block' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }}
              />
              <div style={{ display: 'none', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 30, letterSpacing: -2, color: '#cc0000', lineHeight: 1, fontStyle: 'italic' }}>msc</div>
                <div style={{ fontSize: 7, color: '#cc0000', fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>A TRADITION OF EXCELLENCE SINCE 1967</div>
              </div>
            </div>
            {/* Company info — right-aligned */}
            <div style={{ flex: 1, textAlign: 'right', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 700, fontSize: 14 * fs }}>E.D. Miller Service Company</div>
              <div style={{ fontSize: 11 * fs }}>9736 Brockbank Dr. Dallas, Texas 75220</div>
              <div style={{ fontSize: 11 * fs }}>(O) 214-351-6171&nbsp;&nbsp;(F) 214-351-6174</div>
              <div style={{ fontSize: 11 * fs, color: '#cc0000' }}>www.millerservicecompany.com</div>
            </div>
          </div>

          {/* Info grid */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '4px double #000', marginBottom: 3 * fs }}>
            <tbody>
              <tr>
                <HCell label="Submitted to:" value={builder?.name || 'Builder Name'} style={{ width: '38%', borderRight: B }} />
                <HCell label="Phone:" value={builder?.phone || ''} style={{ width: '31%', borderRight: B }} />
                <HCell label="Date:" value={today} style={{ width: '31%' }} />
              </tr>
              <tr>
                <HCell label="Address:" value={builder?.address || ''} style={{ borderRight: B }} />
                <HCell label="Job Location:" value={project.projectAddress || ''} style={{ borderRight: B }} />
                <td style={{ padding: CELL_PAD, borderBottom: B }}>
                  <div style={{ fontSize: 7.5 * fs, color: '#444', marginBottom: 0 }}>Email:</div>
                  <div style={{ fontSize: 9.5 * fs, fontWeight: 600, wordBreak: 'break-all' }}>{builder?.email || ''}</div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: CELL_PAD, borderRight: B, borderBottom: 0 }}>
                  <div style={{ fontSize: 7.5 * fs, color: '#444', marginBottom: 0 }}>City, State, Zip:</div>
                  <div style={{ fontSize: 9.5 * fs, fontWeight: 600 }}>{builder?.cityState || ''}</div>
                </td>
                <td style={{ padding: CELL_PAD, borderRight: B, borderBottom: 0 }}>
                  <div style={{ fontSize: 7.5 * fs, color: '#444', marginBottom: 0 }}>Job Name:</div>
                  <div style={{ fontSize: 9.5 * fs, fontWeight: 600 }}>{project.projectName || ''}</div>
                </td>
                <td style={{ padding: CELL_PAD, borderBottom: 0 }}></td>
              </tr>
            </tbody>
          </table>

          {/* Stats bar */}
          {numSystems > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `${1.5 * fs}px ${4 * fs}px`, background: showStatBar ? '#f8fafc' : 'transparent', borderBottom: '1px solid #e2e8f0', marginBottom: 2 * fs }}>
              <button
                className="no-print"
                onClick={() => setShowStatBar((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: showStatBar ? '#3b82f6' : '#cbd5e1', padding: 2, lineHeight: 1, flexShrink: 0 }}
              >
                {showStatBar ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              {showStatBar && (
                <span className="stat-bar" style={{ fontSize: 8.5 * fs, color: '#475569' }}>
                  <strong>{numSystems}</strong> system{numSystems !== 1 ? 's' : ''} |&nbsp;
                  <strong>{totalSqft.toLocaleString()}</strong> sq ft |&nbsp;
                  <strong>{totalTons}</strong> tons
                  {zonedCount > 0 && <> | <strong>{zonedCount}</strong> zoned</>}
                  {project.geothermalWells > 0 && <> | <strong>{project.geothermalWells}</strong> geo wells</>}
                </span>
              )}
            </div>
          )}

          {/* Proposal body */}
          <div>
            {SECTIONS.map((section, sectionIndex) => {
              const items = getSectionItems(proposalItems, section);
              const showPrices = section === 'equipmentOptions' || section === 'hvacOptions';
              const isFirst = sectionIndex === 0;
              const isLast = sectionIndex === SECTIONS.length - 1;

              return (
                <div key={section} style={{
                  marginTop: isFirst ? 7 * fs : 0,
                  borderLeft: '4px double #000',
                  borderRight: '4px double #000',
                  borderTop: isFirst ? '4px double #000' : 'none',
                  borderBottom: isLast ? '4px double #000' : 'none',
                }}>
                  {/* Section header */}
                  <div style={{ padding: `${1.5 * fs}px ${3 * fs}px` }}>
                    <span style={{ fontSize: 9.5 * fs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1e293b', textDecoration: 'underline' }}>
                      {SECTION_LABELS[section]}:
                    </span>
                  </div>

                  {/* Section content */}
                  <div style={{ padding: `0 ${3 * fs}px ${1.5 * fs}px` }}>

                  {items.map((item) => {
                    const override = getOverride(item.id);
                    const calcPrice = section === 'equipmentOptions' ? calcEquipPrices[item.id]
                      : section === 'hvacOptions' ? calcHvacPrices[item.id] : undefined;
                    const effectiveItem = calcPrice !== undefined && !override?.price
                      ? { ...item, price: String(Math.round(calcPrice)) } : item;
                    const dynText = dynamicText[item.id];
                    const finalItem = dynText && !override?.text
                      ? { ...effectiveItem, text: dynText } : effectiveItem;

                    // VRV: split warranty info onto its own line for readability
                    const renderText = item.id === 'eq-1' && !override?.text
                      ? vrvLineBreak(finalItem.text) : undefined;

                    return (
                      <ItemRow
                        key={item.id}
                        item={finalItem}
                        override={override}
                        onToggleVisibility={() => toggleVisibility(item.id)}
                        onSaveOverride={(text, price, unit) => saveOverride(item.id, text, price, unit)}
                        isEditing={editingItemId === item.id}
                        onEdit={() => setEditingItemId(item.id)}
                        onCancelEdit={() => setEditingItemId(null)}
                        showPrices={showPrices}
                        priceBelowText={section === 'equipmentOptions'}
                        showRowBorder={section === 'hvacOptions'}
                        fs={fs}
                        renderText={renderText}
                      />
                    );
                  })}

                  {/* Custom add-ons from Pricing Editor — only in HVAC Options */}
                  {section === 'hvacOptions' && customAddons.map((addon) => {
                    const item = addonToItem(addon);
                    const override = getOverride(addon.id);
                    return (
                      <ItemRow
                        key={addon.id}
                        item={item}
                        override={override}
                        onToggleVisibility={() => toggleVisibility(addon.id)}
                        onSaveOverride={(text, price, unit) => saveOverride(addon.id, text, price, unit)}
                        isEditing={editingItemId === addon.id}
                        onEdit={() => setEditingItemId(addon.id)}
                        onCancelEdit={() => setEditingItemId(null)}
                        showPrices
                        showRowBorder
                        fs={fs}
                      />
                    );
                  })}

                  {/* Distributed spacer — fills dead space evenly across all sections */}
                  <div className="gap-spacer" style={{ height: sectionGap / SECTIONS.length }}></div>

                  {addingSection === section ? (
                    <div className="no-print" style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <input autoFocus value={newItemText} onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Item text..." onKeyDown={(e) => e.key === 'Enter' && addNewItem(section)}
                        style={{ flex: 1, minWidth: 180, padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: 5, fontSize: 12 }} />
                      {showPrices && (
                        <input value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} placeholder="Price"
                          style={{ width: 110, padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: 5, fontSize: 12 }} />
                      )}
                      <button onClick={() => addNewItem(section)} style={{ padding: '4px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>Add</button>
                      <button onClick={() => setAddingSection(null)} style={{ padding: '4px 10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <button className="no-print"
                      onClick={() => setAddingSection(section)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, padding: '1px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 10.5, fontWeight: 600 }}
                    >
                      <Plus size={11} /> Add item to {SECTION_LABELS[section]}
                    </button>
                  )}

                  </div>{/* end section content */}
                </div>
              );
            })}

            {/* Footer */}
            <div style={{ marginTop: 6 * fs, paddingTop: 4 * fs, borderTop: '2px solid #cc0000' }}>
              <p style={{ fontSize: 9 * fs, fontWeight: 700, textAlign: 'center', margin: `0 0 ${3 * fs}px` }}>
                Proposal pricing valid for 30 days.
              </p>
              <p style={{ fontSize: 8.5 * fs, margin: `0 0 ${4 * fs}px`, lineHeight: 1.3 }}>
                Acceptance of proposal - The above prices, specifications and conditions are satisfactory and accepted. You are authorized to do the work as specified.
              </p>
              {/* Date of Acceptance + Signature on one line */}
              <div style={{ display: 'flex', gap: `${10 * fs}px`, marginBottom: 5 * fs, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: `${2 * fs}px`, flex: 1 }}>
                  <span style={{ fontSize: 8.5 * fs, whiteSpace: 'nowrap' }}>Date of Acceptance:</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', minWidth: 40 }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: `${2 * fs}px`, flex: 2 }}>
                  <span style={{ fontSize: 8.5 * fs, whiteSpace: 'nowrap' }}>Signature:</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', minWidth: 80 }}></div>
                </div>
              </div>
              <p style={{ fontSize: 7.5 * fs, color: '#555', textAlign: 'center', margin: 0, lineHeight: 1.3 }}>
                Regulated by the Texas Department of Licensing and Regulation, P.O. Box 12157, Austin, Texas 78711, 1-800-803-9202, 512-463-6599
              </p>
              <p style={{ fontSize: 8.5 * fs, fontWeight: 700, textAlign: 'center', margin: `${2 * fs}px 0 0` }}>TACLA30880E</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
