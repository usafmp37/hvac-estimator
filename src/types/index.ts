export interface Builder {
  id: string;
  name: string;
  address: string;
  cityState: string;
  phone: string;
  email: string;
}

export interface System {
  id: string;
  name: string;
  sqft: number;
  overrideTons?: number;   // manual equip-size override (engineer judgment); if set, used instead of sqft/500
  zoned: boolean;
  thermostats: number;
  exhaustFans: number;
  dryerExhausts: number;
  cooktopExhausts: number;
  grilles: number;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  path: string;        // storage path: {projectId}/{uid}-{filename}
  url: string;         // public URL
  uploadedAt: string;
}

export interface Project {
  id: string;
  projectName: string;
  projectAddress: string;
  cityState: string;
  builderId: string;
  bidStartDate: string;
  bidDueDate: string;
  totalACSqft: number;
  architectSqft: number;  // separate plan sqft used for design/permit fee calc
  markupPct: number;      // default 0.08
  systems: System[];
  geothermalWells: number;
  proposalOverrides: ProposalOverride[];
  attachments: ProjectAttachment[];
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface ProposalOverride {
  itemId: string;
  visible: boolean;
  text?: string;
  price?: string;
  priceUnit?: string; // empty string = explicitly cleared
}

export type SectionKey = 'scopeOfWork' | 'equipmentOptions' | 'hvacOptions' | 'workNotIncluded';

export interface PricingConfig {
  // Base equipment price per system, keyed by tonnage string '1.5'..'5.0'
  equipmentPrices: Record<string, number>;
  equipmentMultiplier: number;          // applied to base before adding options (default 1.4)

  // Standard tier (per system)
  std_furnacePerSys: number;            // EL296UH: 1750
  std_condenserPerSys: number;          // XC16: 2000

  // Deluxe tier (per system)
  dlx_condenserPerSys: number;          // XC21: 4500

  // Premium tier (per system)
  prm_furnacePerSys: number;            // SPL98UHV: 3000
  prm_condenserPerSys: number;          // XC28: 7000

  // Shared PCO air cleaner — applies to Deluxe, Premium, and Geothermal tiers
  pcoPerSys: number;                    // PCO air cleaner: 1550

  // Geothermal (per system / per well)
  geo_condenserPerSys: number;          // WaterFurnace unit: 4500
  geo_airHandlerPerSys: number;         // Air handler: 3000
  geo_drillingPerWell: number;          // 7800

  // Shared across all Lennox/Geo tiers
  acx14Fixed: number;                   // 14ACX always-1 unit: 450
  warrantyPerSys: number;               // 5-yr warranty: 850
  zoningPerZone: number;                // Honeywell zoning: 4250
  thermostatEach: number;               // Vision Pro: 400
  grillesEach: number;                  // Reliable Grilles: 120

  // Design & permit fees ($/sqft of architectSqft)
  designFeePerSqft: number;             // 1.50
  permitFeePerSqft: number;             // 0.25

  // VRV
  vrv_iduEach: number;                  // 18000
  vrv_oduFixed: number;                 // 18000
  vrv_coolRemoteFixed: number;          // 4250
  vrv_thermostatPerIdu: number;         // 400
  vrv_install1: number;                 // 6800
  vrv_install2: number;                 // 5250

  // HVAC add-on line items
  hvac_exhaustFanWithGrilles: number;   // 1800 per fan
  hvac_exhaustFanVentingOnly: number;   // 600 per fan
  hvac_cooktopVentingEach: number;      // 1000
  hvac_dryerVentingEach: number;        // 900
  hvac_ductedWineUnit: number;          // 21000
  hvac_dehumidifierEach: number;        // 7000
  hvac_humidifierEach: number;          // 5250
  hvac_hepaFiltrationEach: number;      // 4600
  hvac_tempPackageUnit: number;         // 4800
  hvac_extendedWarrantyPerSys: number;  // 1500

  // User-defined custom add-on items (appear in HVAC Options on every proposal)
  customHvacAddons: CustomHvacAddon[];
}

export interface CustomHvacAddon {
  id: string;
  name: string;
  price: number;
  priceUnit: string;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  equipmentPrices: { '1.5': 8700, '2.0': 9000, '2.5': 10000, '3.0': 11000, '3.5': 12000, '4.0': 13000, '4.5': 14000, '5.0': 15000 },
  equipmentMultiplier: 1.4,
  std_furnacePerSys: 1750,
  std_condenserPerSys: 2000,
  dlx_condenserPerSys: 4500,
  prm_furnacePerSys: 3000,
  prm_condenserPerSys: 7000,
  pcoPerSys: 1550,
  geo_condenserPerSys: 4500,
  geo_airHandlerPerSys: 3000,
  geo_drillingPerWell: 7800,
  acx14Fixed: 450,
  warrantyPerSys: 850,
  zoningPerZone: 4250,
  thermostatEach: 400,
  grillesEach: 120,
  designFeePerSqft: 1.50,
  permitFeePerSqft: 0.25,
  vrv_iduEach: 18000,
  vrv_oduFixed: 18000,
  vrv_coolRemoteFixed: 4250,
  vrv_thermostatPerIdu: 400,
  vrv_install1: 6800,
  vrv_install2: 5250,
  hvac_exhaustFanWithGrilles: 1800,
  hvac_exhaustFanVentingOnly: 600,
  hvac_cooktopVentingEach: 1000,
  hvac_dryerVentingEach: 900,
  hvac_ductedWineUnit: 21000,
  hvac_dehumidifierEach: 7000,
  hvac_humidifierEach: 5250,
  hvac_hepaFiltrationEach: 4600,
  hvac_tempPackageUnit: 4800,
  hvac_extendedWarrantyPerSys: 1500,
  customHvacAddons: [],
};

export interface ProposalItem {
  id: string;
  section: SectionKey;
  text: string;
  price?: string;
  priceUnit?: string;
  isDefault: boolean;
  deleted: boolean;
  sortOrder: number;
}
