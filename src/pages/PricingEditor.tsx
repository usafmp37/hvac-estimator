import { useState } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_PRICING_CONFIG } from '../types';
import type { PricingConfig, CustomHvacAddon } from '../types';
import { RotateCcw, Save, Plus, Trash2 } from 'lucide-react';
import { HVAC_ITEM_PRICE_MAP } from '../utils/pricing';

const EQUIPMENT_SIZES = ['1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];
const uid = () => Math.random().toString(36).slice(2, 10);

function fmt(n: number) { return n.toLocaleString('en-US'); }
function parseDollar(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ── shared field components ───────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  decimals?: boolean;
  note?: string;
}

function PriceField({ label, value, onChange, prefix = '$', decimals = false, note }: FieldProps) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
        <span style={{ padding: '6px 8px', background: '#f9fafb', borderRight: '1px solid #d1d5db', color: '#6b7280', fontSize: 13, flexShrink: 0 }}>{prefix}</span>
        <input
          type="text"
          value={focused ? raw : (decimals ? value.toFixed(2) : fmt(value))}
          onFocus={() => { setRaw(String(value)); setFocused(true); }}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={() => { setFocused(false); onChange(parseDollar(raw)); }}
          style={{ flex: 1, border: 'none', outline: 'none', padding: '6px 8px', fontSize: 13, fontFamily: 'monospace' }}
        />
      </div>
      {note && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{note}</div>}
    </div>
  );
}

interface CardProps { title: string; accent?: string; children: React.ReactNode }
function Card({ title, accent = '#3b82f6', children }: CardProps) {
  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '10px 16px', background: accent, color: 'white', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>{children}</div>;
}
function Row3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>{children}</div>;
}
function Row4({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>{children}</div>;
}

// ── custom add-on row ─────────────────────────────────────────────────────────

function CustomAddonRow({ addon, onChange, onDelete }: {
  addon: CustomHvacAddon;
  onChange: (updated: CustomHvacAddon) => void;
  onDelete: () => void;
}) {
  const [priceRaw, setPriceRaw] = useState('');
  const [priceFocused, setPriceFocused] = useState(false);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Item Name</div>
        <input
          value={addon.name}
          onChange={(e) => onChange({ ...addon, name: e.target.value })}
          placeholder="e.g. UV Air Purifier"
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Price</div>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
          <span style={{ padding: '6px 8px', background: '#f9fafb', borderRight: '1px solid #d1d5db', color: '#6b7280', fontSize: 13 }}>$</span>
          <input
            type="text"
            value={priceFocused ? priceRaw : fmt(addon.price)}
            onFocus={() => { setPriceRaw(String(addon.price)); setPriceFocused(true); }}
            onChange={(e) => setPriceRaw(e.target.value)}
            onBlur={() => { setPriceFocused(false); onChange({ ...addon, price: parseDollar(priceRaw) }); }}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '6px 8px', fontSize: 13, fontFamily: 'monospace', width: 0 }}
          />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Unit Label</div>
        <input
          value={addon.priceUnit}
          onChange={(e) => onChange({ ...addon, priceUnit: e.target.value })}
          placeholder="Each / Per System"
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
        />
      </div>
      <button
        onClick={onDelete}
        style={{ padding: '7px 10px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
        title="Remove"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function PricingEditor() {
  const { pricingConfig, updatePricingConfig, resetPricingConfig, proposalItems, updateProposalItem } = useStore();
  const [saved, setSaved] = useState(false);

  // Reverse map: pricingConfig key → proposal item ID
  const configToItemId = Object.fromEntries(
    Object.entries(HVAC_ITEM_PRICE_MAP).map(([itemId, cfgKey]) => [cfgKey, itemId])
  );

  function set<K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) {
    updatePricingConfig({ [key]: value });
    // Keep proposalItem price in sync for mapped HVAC fields
    const itemId = configToItemId[key as string];
    if (itemId && typeof value === 'number') {
      updateProposalItem(itemId, { price: String(value) });
    }
    setSaved(false);
  }

  function setEqPrice(size: string, value: number) {
    updatePricingConfig({ equipmentPrices: { ...pricingConfig.equipmentPrices, [size]: value } });
    setSaved(false);
  }

  function addCustomAddon() {
    const newAddon: CustomHvacAddon = { id: uid(), name: '', price: 0, priceUnit: 'Each' };
    updatePricingConfig({ customHvacAddons: [...(pricingConfig.customHvacAddons ?? []), newAddon] });
    setSaved(false);
  }

  function updateCustomAddon(updated: CustomHvacAddon) {
    updatePricingConfig({
      customHvacAddons: pricingConfig.customHvacAddons.map((a) => a.id === updated.id ? updated : a),
    });
    setSaved(false);
  }

  function deleteCustomAddon(id: string) {
    updatePricingConfig({ customHvacAddons: pricingConfig.customHvacAddons.filter((a) => a.id !== id) });
    setSaved(false);
  }

  function handleReset() {
    if (confirm('Reset all prices to factory defaults? Custom add-on items will also be removed.')) {
      resetPricingConfig();
      setSaved(false);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const cfg = pricingConfig;
  const addons = cfg.customHvacAddons ?? [];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Pricing Editor</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13.5 }}>
            All changes take effect immediately on new estimates. Existing proposals are not retroactively changed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: saved ? '#10b981' : '#1e293b', color: 'white', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.2s' }}>
            <Save size={14} /> {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* 1. Base Equipment */}
      <Card title="Base Equipment — All Tiers" accent="#1e293b">
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b' }}>
          Price per system at each equipment size. Actual size is rounded UP from calculated tons (sqft ÷ 500).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 20px' }}>
          {EQUIPMENT_SIZES.map((sz) => (
            <PriceField key={sz} label={`${sz} Tons`} value={cfg.equipmentPrices[sz] ?? 0} onChange={(v) => setEqPrice(sz, v)} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 20px', marginTop: 4 }}>
          <PriceField label="Equipment Multiplier" prefix="×" value={cfg.equipmentMultiplier} decimals onChange={(v) => set('equipmentMultiplier', v)} note="Applied to base before adding options" />
        </div>
      </Card>

      {/* 2. Tier Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Standard Tier Options" accent="#64748b">
          <PriceField label="Furnace (per system)" value={cfg.std_furnacePerSys} onChange={(v) => set('std_furnacePerSys', v)} />
          <PriceField label="Condenser (per system)" value={cfg.std_condenserPerSys} onChange={(v) => set('std_condenserPerSys', v)} />
        </Card>
        <Card title="Deluxe Tier Options" accent="#0284c7">
          <PriceField label="Furnace (per system)" value={cfg.std_furnacePerSys} onChange={(v) => set('std_furnacePerSys', v)} />
          <PriceField label="Condenser (per system)" value={cfg.dlx_condenserPerSys} onChange={(v) => set('dlx_condenserPerSys', v)} />
        </Card>
        <Card title="Premium Tier Options" accent="#7c3aed">
          <PriceField label="Furnace (per system)" value={cfg.prm_furnacePerSys} onChange={(v) => set('prm_furnacePerSys', v)} />
          <PriceField label="Condenser (per system)" value={cfg.prm_condenserPerSys} onChange={(v) => set('prm_condenserPerSys', v)} />
        </Card>
        <Card title="Geothermal Options" accent="#059669">
          <PriceField label="Condenser (per system)" value={cfg.geo_condenserPerSys} onChange={(v) => set('geo_condenserPerSys', v)} />
          <PriceField label="Air Handler (per system)" value={cfg.geo_airHandlerPerSys} onChange={(v) => set('geo_airHandlerPerSys', v)} />
          <PriceField label="Drilling (per well)" value={cfg.geo_drillingPerWell} onChange={(v) => set('geo_drillingPerWell', v)} note="Wells = ceil(architectSqft ÷ 500 × 1.25)" />
        </Card>
      </div>

      {/* 3. Shared Options */}
      <Card title="Shared Options — All Tiers" accent="#b45309">
        <Row4>
          <PriceField label="Fixed Add-On Unit (1 each)" value={cfg.acx14Fixed} onChange={(v) => set('acx14Fixed', v)} />
          <PriceField label="Warranty (per system)" value={cfg.warrantyPerSys} onChange={(v) => set('warrantyPerSys', v)} />
          <PriceField label="Zoning System (per zoned sys)" value={cfg.zoningPerZone} onChange={(v) => set('zoningPerZone', v)} />
          <PriceField label="Vision Pro Thermostat (each)" value={cfg.thermostatEach} onChange={(v) => set('thermostatEach', v)} />
        </Row4>
        <Row4>
          <PriceField label="PCO Air Cleaner (per system)" value={cfg.pcoPerSys} onChange={(v) => set('pcoPerSys', v)} note="Deluxe, Premium & Geothermal" />
        </Row4>
        <Row4>
          <PriceField label="Reliable Grilles (each)" value={cfg.grillesEach} onChange={(v) => set('grillesEach', v)} />
          <PriceField label="Design Fee (per sqft)" prefix="$" value={cfg.designFeePerSqft} decimals onChange={(v) => set('designFeePerSqft', v)} note="× architect sqft" />
          <PriceField label="Permit Fee (per sqft)" prefix="$" value={cfg.permitFeePerSqft} decimals onChange={(v) => set('permitFeePerSqft', v)} note="× architect sqft" />
        </Row4>
      </Card>

      {/* 4. VRV */}
      <Card title="VRV Pricing" accent="#dc2626">
        <Row3>
          <PriceField label="Indoor Unit / IDU (each)" value={cfg.vrv_iduEach} onChange={(v) => set('vrv_iduEach', v)} />
          <PriceField label="Outdoor Unit / ODU (fixed, 1)" value={cfg.vrv_oduFixed} onChange={(v) => set('vrv_oduFixed', v)} />
          <PriceField label="Cool Automation Remote (fixed)" value={cfg.vrv_coolRemoteFixed} onChange={(v) => set('vrv_coolRemoteFixed', v)} />
        </Row3>
        <Row3>
          <PriceField label="Thermostat per IDU (each)" value={cfg.vrv_thermostatPerIdu} onChange={(v) => set('vrv_thermostatPerIdu', v)} />
          <PriceField label="VRV Install Line 1 (fixed)" value={cfg.vrv_install1} onChange={(v) => set('vrv_install1', v)} />
          <PriceField label="VRV Install Line 2 (fixed)" value={cfg.vrv_install2} onChange={(v) => set('vrv_install2', v)} />
        </Row3>
        <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#94a3b8' }}>
          VRV base = (IDU × qty + ODU) × {cfg.equipmentMultiplier}× multiplier + options above
        </p>
      </Card>

      {/* 5. HVAC Add-On Line Items — driven by Proposal Items page */}
      <Card title="HVAC Add-On Line Items" accent="#0891b2">
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b' }}>
          These prices mirror the <strong>HVAC Accessories</strong> section of Proposal Items. Changes here update there, and vice versa.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {proposalItems
            .filter(item => item.section === 'hvacOptions' && !item.deleted)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => {
              const configField = HVAC_ITEM_PRICE_MAP[item.id];
              const price = configField
                ? (cfg[configField] as number)
                : parseFloat(item.price || '0') || 0;
              return (
                <PriceField
                  key={item.id}
                  label={item.text}
                  value={price}
                  onChange={(v) => {
                    // Always update proposalItem price
                    updateProposalItem(item.id, { price: String(v) });
                    // Also update pricingConfig for mapped items
                    if (configField) updatePricingConfig({ [configField]: v });
                    setSaved(false);
                  }}
                />
              );
            })}
        </div>
      </Card>

      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 40 }}>
        All prices are stored in your browser. Changes here are reflected immediately when you open any estimate or proposal.
      </p>
    </div>
  );
}
