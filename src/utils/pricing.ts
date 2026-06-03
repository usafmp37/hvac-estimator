import type { System, PricingConfig } from '../types';
import { DEFAULT_PRICING_CONFIG } from '../types';

// Maps proposal item ID → pricingConfig field name for HVAC accessories
// Used to keep ProposalItemsPage and PricingEditor in sync
export const HVAC_ITEM_PRICE_MAP: Record<string, keyof PricingConfig> = {
  'hvac-1':  'hvac_ductedWineUnit',
  'hvac-2':  'hvac_exhaustFanWithGrilles',
  'hvac-3':  'hvac_exhaustFanVentingOnly',
  'hvac-4':  'hvac_cooktopVentingEach',
  'hvac-5':  'hvac_dryerVentingEach',
  'hvac-6':  'hvac_dehumidifierEach',
  'hvac-7':  'hvac_humidifierEach',
  'hvac-8':  'hvac_hepaFiltrationEach',
  'hvac-9':  'hvac_tempPackageUnit',
  'hvac-10': 'hvac_extendedWarrantyPerSys',
};

const EQUIPMENT_SIZES = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

// Round tons UP to the nearest available equipment size
export function toEquipmentSize(tons: number): number {
  for (const size of EQUIPMENT_SIZES) {
    if (tons <= size) return size;
  }
  return 5.0;
}

// Effective tonnage for a system: use manual override if set, else sqft/500
export function effectiveTons(sys: import('../types').System): number {
  return sys.overrideTons != null && sys.overrideTons > 0 ? sys.overrideTons : sys.sqft / 500;
}

export interface PricingInputs {
  systems: System[];
  architectSqft: number;
  markupPct?: number;    // default 0.08
  config?: PricingConfig;
}

export interface TierPrices {
  standard: number;
  deluxe: number;
  premium: number;
  geothermal: number;
  vrv: number;
}

export interface PricingBreakdown {
  numSystems: number;
  numZoned: number;
  numThermostats: number;
  numExhaustFans: number;
  numDryers: number;
  numCooktops: number;
  numGrilles: number;
  totalSqft: number;
  totalTons: number;
  numWells: number;
  designFee: number;
  permitFee: number;
  prices: TierPrices;
  config: PricingConfig;
}

function baseSystemCost(systems: System[], cfg: PricingConfig): number {
  return systems.reduce((sum, sys) => {
    const tons = effectiveTons(sys);
    const size = toEquipmentSize(tons);
    const price = cfg.equipmentPrices[size.toFixed(1)] ?? 15000;
    return sum + price;
  }, 0);
}

function standardOptions(numSystems: number, cfg: PricingConfig): number {
  return (
    numSystems * cfg.std_furnacePerSys +
    numSystems * cfg.std_condenserPerSys +
    cfg.acx14Fixed +
    numSystems * cfg.warrantyPerSys
  );
}

function deluxeOptions(numSystems: number, cfg: PricingConfig): number {
  return (
    numSystems * cfg.std_furnacePerSys +    // EL296UH furnace (same as Standard)
    numSystems * cfg.dlx_condenserPerSys +  // XC21 condenser (upgrade from XC16)
    numSystems * cfg.pcoPerSys +            // PCO air cleaner (shared)
    cfg.acx14Fixed +
    numSystems * cfg.warrantyPerSys
  );
}

function premiumOptions(numSystems: number, cfg: PricingConfig): number {
  return (
    numSystems * cfg.prm_furnacePerSys +
    numSystems * cfg.prm_condenserPerSys +
    numSystems * cfg.pcoPerSys +            // PCO air cleaner (shared)
    cfg.acx14Fixed +
    numSystems * cfg.warrantyPerSys
  );
}

function geoOptions(numSystems: number, numWells: number, cfg: PricingConfig): number {
  return (
    numSystems * cfg.geo_condenserPerSys +  // WaterFurnace / ground-source unit
    numSystems * cfg.geo_airHandlerPerSys + // Air handler
    numSystems * cfg.pcoPerSys +            // PCO air cleaner (shared)
    cfg.acx14Fixed +
    numSystems * cfg.warrantyPerSys +
    numWells * cfg.geo_drillingPerWell      // fractional wells × price
  );
}

function sharedOptions(
  numZoned: number,
  numThermostats: number,
  numGrilles: number,
  designFee: number,
  permitFee: number,
  cfg: PricingConfig
): number {
  return (
    numZoned * cfg.zoningPerZone +
    numThermostats * cfg.thermostatEach +
    numGrilles * cfg.grillesEach +
    designFee +
    permitFee
  );
}

function applyMarkup(subtotal: number, markupPct: number): number {
  return Math.ceil(subtotal * (1 + markupPct));
}

export function calculatePrices(inputs: PricingInputs): PricingBreakdown {
  const { systems, architectSqft, markupPct = 0.08 } = inputs;
  const cfg = inputs.config ?? DEFAULT_PRICING_CONFIG;

  const numSystems = systems.length;
  const numZoned = systems.filter((s) => s.zoned).length;
  const numThermostats = systems.reduce((s, x) => s + (x.thermostats || 0), 0);
  const numExhaustFans = systems.reduce((s, x) => s + (x.exhaustFans || 0), 0);
  const numDryers = systems.reduce((s, x) => s + (x.dryerExhausts || 0), 0);
  const numCooktops = systems.reduce((s, x) => s + (x.cooktopExhausts || 0), 0);
  const numGrilles = systems.reduce((s, x) => s + (x.grilles || 0), 0);
  const totalSqft = systems.reduce((s, x) => s + (x.sqft || 0), 0);
  const totalTons = +(totalSqft / 500).toFixed(2);

  const archTons = architectSqft / 500;
  const numWellsFractional = archTons * 1.25;          // fractional wells used for drilling cost (matches spreadsheet)
  const numWells = Math.ceil(numWellsFractional);       // rounded up for display

  const designFee = cfg.designFeePerSqft * architectSqft;
  const permitFee = cfg.permitFeePerSqft * architectSqft;

  const base = baseSystemCost(systems, cfg);
  const baseAfterMultiplier = base * cfg.equipmentMultiplier;

  const shared = sharedOptions(numZoned, numThermostats, numGrilles, designFee, permitFee, cfg);

  const stdSubtotal = baseAfterMultiplier + standardOptions(numSystems, cfg) + shared;
  const delSubtotal = baseAfterMultiplier + deluxeOptions(numSystems, cfg) + shared;
  const premSubtotal = baseAfterMultiplier + premiumOptions(numSystems, cfg) + shared;
  const geoSubtotal = baseAfterMultiplier + geoOptions(numSystems, numWellsFractional, cfg) + shared;

  const vrvBase = numSystems * cfg.vrv_iduEach + cfg.vrv_oduFixed;
  const vrvAfterMultiplier = vrvBase * cfg.equipmentMultiplier;
  const vrvOptions = cfg.vrv_coolRemoteFixed + numSystems * cfg.vrv_thermostatPerIdu + cfg.vrv_install1 + cfg.vrv_install2 + shared;
  const vrvSubtotal = vrvAfterMultiplier + vrvOptions;

  return {
    numSystems,
    numZoned,
    numThermostats,
    numExhaustFans,
    numDryers,
    numCooktops,
    numGrilles,
    totalSqft,
    totalTons,
    numWells,
    designFee,
    permitFee,
    prices: {
      standard: applyMarkup(stdSubtotal, markupPct),
      deluxe: applyMarkup(delSubtotal, markupPct),
      premium: applyMarkup(premSubtotal, markupPct),
      geothermal: applyMarkup(geoSubtotal, markupPct),
      vrv: applyMarkup(vrvSubtotal, markupPct),
    },
    config: cfg,
  };
}

// Price lookup for a single HVAC accessory item by its proposal item ID
export function getHvacAccessoryPrice(itemId: string, cfg: PricingConfig): number {
  const map: Record<string, number> = {
    'hvac-1': cfg.hvac_ductedWineUnit,
    'hvac-2': cfg.hvac_exhaustFanWithGrilles,
    'hvac-3': cfg.hvac_exhaustFanVentingOnly,
    'hvac-4': cfg.hvac_cooktopVentingEach,
    'hvac-5': cfg.hvac_dryerVentingEach,
    'hvac-6': cfg.hvac_dehumidifierEach,
    'hvac-7': cfg.hvac_humidifierEach,
    'hvac-8': cfg.hvac_hepaFiltrationEach,
    'hvac-9': cfg.hvac_tempPackageUnit,
    'hvac-10': cfg.hvac_extendedWarrantyPerSys,
  };
  if (itemId in map) return map[itemId];
  return (cfg.customHvacAddons ?? []).find(a => a.id === itemId)?.price ?? 0;
}

// HVAC add-on pricing (quantity-based line items on proposal)
export function hvacAddonPrices(breakdown: PricingBreakdown) {
  const cfg = breakdown.config;
  return {
    exhaustFansWithGrilles: breakdown.numExhaustFans * cfg.hvac_exhaustFanWithGrilles,
    exhaustFansVentingOnly: breakdown.numExhaustFans * cfg.hvac_exhaustFanVentingOnly,
    cooktopVenting: breakdown.numCooktops * cfg.hvac_cooktopVentingEach,
    dryerVenting: breakdown.numDryers * cfg.hvac_dryerVentingEach,
    ductedWineUnit: cfg.hvac_ductedWineUnit,
    dehumidifier: cfg.hvac_dehumidifierEach,
    humidifier: cfg.hvac_humidifierEach,
    hepaFiltration: cfg.hvac_hepaFiltrationEach,
    tempPackageUnit: cfg.hvac_tempPackageUnit,
    extendedWarranty: cfg.hvac_extendedWarrantyPerSys,
  };
}

export function fmtUSD(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
