import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Builder, Project, ProposalItem, SectionKey, PricingConfig } from '../types';
import { DEFAULT_PRICING_CONFIG } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_BUILDERS: Builder[] = [
  { id: 'b-01', name: 'Attaway Homes', phone: '214-763-2200', address: '537 Northill Drive', cityState: 'Richardson, Texas 75080', email: 'tlemay@attawayhomes.com' },
  { id: 'b-02', name: 'Austin Butler Construction', phone: '325-386-5635', address: '1273 Canterbury Dr.', cityState: 'Abilene, Texas 79602', email: 'austin@butlerco.build' },
  { id: 'b-03', name: 'Barcus Homes', phone: '214-415-2362', address: '6615 Snider Plaza Ste 201D', cityState: 'Dallas, Texas 75205', email: 'cyrusbarcus@gmail.com' },
  { id: 'b-04', name: 'Bob Clark', phone: '214-577-4573', address: '5207 McKinney Ave #12', cityState: 'Dallas, Texas 75205', email: 'sheri@rhclark.com' },
  { id: 'b-05', name: 'Buford Hawthorne', phone: '214-368-3478', address: 'PO Box 670352', cityState: 'Dallas, Texas 75367', email: 'barry@bufordhawthorne.com' },
  { id: 'b-06', name: 'Clay Snelling', phone: '214-796-3100', address: '5600 W. Lovers Ln. Ste 320', cityState: 'Dallas, Texas 75209', email: 'clator@sbcglobal.net' },
  { id: 'b-07', name: 'Coats Homes', phone: '214-206-3900', address: '3100 Monticello STE 335', cityState: 'Dallas, Texas 75205', email: 'gia@coatshomes.com' },
  { id: 'b-08', name: 'David Lewis Builder', phone: '972-523-9992', address: '4204 Deering Drive', cityState: 'Fort Worth, Texas 76114', email: 'kay@davidlewisbuilder.com' },
  { id: 'b-09', name: 'Elleman Homes', phone: '214-497-1693', address: '4438 Abbott Ave.', cityState: 'Dallas, Texas 75205', email: 'brad@ellemanhomes.com' },
  { id: 'b-10', name: 'Faulkner Perrin Custom Homes', phone: '214-909-8552', address: '6830 Lakehurst Ave.', cityState: 'Dallas, Texas 75230', email: 'brian@faulknerperrin.com' },
  { id: 'b-11', name: 'Gary Dean Construction', phone: '972-403-8108', address: '6308 Whittier Drive', cityState: 'Plano, Texas 75093', email: 'gary@garydeanconstruction.com' },
  { id: 'b-12', name: 'Goff Custom Homes', phone: '214-537-3339', address: '3419 Westminster Ave', cityState: 'Dallas, Texas 75205', email: 'rusty@goffcustomhomes.com' },
  { id: 'b-13', name: 'Greenwell Homes', phone: '214-995-3855', address: '6100 Cedar Springs', cityState: 'Dallas, Texas 75235', email: 'chase@greenwellhomes.com' },
  { id: 'b-14', name: 'Hardy Construction', phone: '214-693-0953', address: 'P.O. Box 820393', cityState: 'Dallas, Texas 75382', email: 'stephen@hardy-construction.com' },
  { id: 'b-15', name: 'Hawkins-Welwood Homes', phone: '972-931-1006', address: '5710 LBJ Freeway Suite 400', cityState: 'Dallas, Texas 75240', email: 'cindys@hwhomes.com' },
  { id: 'b-16', name: 'Hillsen Custom Homes', phone: '214-842-7262', address: '5015 Tracy St. #102', cityState: 'Dallas, Texas 75225', email: 'guyglennon@hillsen.com' },
  { id: 'b-17', name: 'Hudson Construction Group', phone: '214-449-4941', address: '4268 W. Lovers Ln.', cityState: 'Dallas, Texas 75209', email: 'Charlie@hudcg.com' },
  { id: 'b-18', name: 'Hull Homes', phone: '602-803-5326', address: '201 Lipscomb St.', cityState: 'Fort Worth, Texas 76104', email: 'chris@brenthull.com' },
  { id: 'b-19', name: 'Isler Homes', phone: '214-443-1860', address: '1220 N. Riverfront Suite 100', cityState: 'Dallas, Texas 75207', email: 'carolyn@islerhomes.com' },
  { id: 'b-20', name: 'Knox Built', phone: '214-704-8621', address: '3838 Oaklawn, Suite 1520', cityState: 'Dallas, Texas 75219', email: 'blake@knox-built.com' },
  { id: 'b-21', name: 'LRO Residential', phone: '214-676-4119', address: '6170 Sherry Lane #300', cityState: 'Dallas, Texas 75225', email: 'les@lroresidential.com' },
  { id: 'b-22', name: 'Mark Barry', phone: '214-455-7254', address: '4176 Park Lane', cityState: 'Dallas, Texas 75220', email: 'mark@barrybullballas.com' },
  { id: 'b-23', name: 'Nixon Custom Homes', phone: '214-543-9453', address: '12240 Inwood Rd. Ste. 450', cityState: 'Dallas, Texas 75244', email: 'austin@nixoncustomhomes.com' },
  { id: 'b-24', name: 'Pencil Point Constructors', phone: '214-559-2285', address: '4809 Cole Ave #250', cityState: 'Dallas, Texas 75205', email: 'danvanderzee@gmail.com' },
  { id: 'b-25', name: 'RRH Custom Homes', phone: '214-354-8171', address: '6115 Owens St. Suite 201', cityState: 'Dallas, Texas 75235', email: 'ryanrhouston@gmail.com' },
  { id: 'b-26', name: 'S&H Design Development', phone: '214-636-0226', address: '5437 Meadow Crest Dr.', cityState: 'Dallas, Texas 75229', email: 'mark@desdevhomes.com' },
  { id: 'b-27', name: 'Sebastian Construction Group', phone: '214-528-4130', address: '3100 Monticello Ave. Suite 750', cityState: 'Dallas, Texas 75205', email: 'aonan@sebastiancg.com' },
  { id: 'b-28', name: 'Steve Hild', phone: '214-212-7578', address: '6812 Mossvine Circle', cityState: 'Dallas, Texas 75254', email: 'steve@hildcustombuilder.net' },
  { id: 'b-29', name: 'Susan Newell Custom Homes', phone: '214-219-0639', address: '1825 Market Center Blvd. Suite 140', cityState: 'Dallas, Texas 75207', email: 'newellcustomhomes@gmail.com' },
  { id: 'b-30', name: 'Tatum Brown Custom Homes', phone: '214-232-4424', address: '1528 Slocum St.', cityState: 'Dallas, Texas 75207', email: 'aaron@tatumbrown.com' },
  { id: 'b-31', name: 'Underwood Custom Homes', phone: '214-521-3745', address: '25 Highland Park Village #100', cityState: 'Dallas, Texas 75205', email: 'office@underwoodch.com' },
  { id: 'b-32', name: 'Mark Clifton', phone: '214-532-8989', address: '3419 Westminster Ave. #26', cityState: 'Dallas, Texas 75205', email: 'mark@markcliftonhomes.com' },
  { id: 'b-33', name: 'Thomas Development & Construction, LLC', phone: '214-810-8396', address: '4516 Lovers Ln #325', cityState: 'Dallas, Texas 75205', email: 'mthomas@thomasdc.com' },
  { id: 'b-34', name: 'JCG Western Contractors', phone: '925-321-2604', address: '1200 Western Avenue', cityState: 'Fort Worth, Texas', email: 'janderson@goffcp.com' },
  { id: 'b-35', name: 'Bean Co Homes', phone: '325-513-2913', address: '5646 Milton St. Ste 128', cityState: 'Dallas, Texas 75206', email: 'landri@beancohomes.com' },
  { id: 'b-36', name: 'McCrory Homes', phone: '325-565-2828', address: 'PO Box 62403', cityState: 'San Angelo, Texas 76906', email: 'collincmccrory@gmail.com' },
  { id: 'b-37', name: 'Jarrett Construction Co.', phone: '214-533-6239', address: '3828 Capps Dr.', cityState: 'Dallas, Texas 75209', email: 'john@jarrettco.com' },
  { id: 'b-38', name: 'Tommy Ford Construction', phone: '972-991-1081', address: '7557 Rambler Rd. Ste 725', cityState: 'Dallas, Texas 75231', email: '' },
  { id: 'b-39', name: 'Lantera Group', phone: '817-372-8523', address: '5001 Spring Valley Rd. Suite 1045W', cityState: 'Dallas, Texas 75244', email: 'michael@lanterragroup.com' },
  { id: 'b-40', name: 'Broad Acre Homes', phone: '214-693-3300', address: '4849 Greenville Avenue, Suite 100-178', cityState: 'Dallas, Texas 75206', email: 'david@broadacrehomes.com' },
  { id: 'b-41', name: 'UC Properties', phone: '214-534-3009', address: '1821 E. Levee St.', cityState: 'Dallas, Texas 75207', email: 'jennifer@ucpropertiesllc.com' },
  { id: 'b-42', name: 'Massie Owens Build Group', phone: '602-803-5326', address: '', cityState: '', email: 'ryan@massieowensbuildgroup.com' },
  { id: 'b-43', name: 'Davis-Walker Construction', phone: '806-441-1878', address: '6033 Belmont Ave.', cityState: 'Dallas, Texas 75206', email: 'steven@davis-walker.com' },
  { id: 'b-44', name: 'Willow Tree Custom Homes', phone: '432-528-4850', address: '680 N. Carroll Ave. Suite 100', cityState: 'Southlake, Texas 76092', email: 'turner@willowtreettx.com' },
];

const DEFAULT_PROPOSAL_ITEMS: ProposalItem[] = [
  // Scope of Work
  { id: 'sow-1', section: 'scopeOfWork', text: 'Complete H.V.A.C. system', isDefault: true, deleted: false, sortOrder: 1 },
  { id: 'sow-2', section: 'scopeOfWork', text: 'Necessary mechanical engineering', isDefault: true, deleted: false, sortOrder: 2 },
  { id: 'sow-3', section: 'scopeOfWork', text: 'Load calculations per ACCA Manual J 8th Edition', isDefault: true, deleted: false, sortOrder: 3 },
  { id: 'sow-4', section: 'scopeOfWork', text: 'Number (#) Systems', isDefault: true, deleted: false, sortOrder: 4 },
  { id: 'sow-5', section: 'scopeOfWork', text: 'Number (#) Honeywell zoning systems', isDefault: true, deleted: false, sortOrder: 5 },
  { id: 'sow-6', section: 'scopeOfWork', text: 'Metal duct systems', isDefault: true, deleted: false, sortOrder: 6 },
  { id: 'sow-7', section: 'scopeOfWork', text: 'Mastic duct sealer (not duct tape)', isDefault: true, deleted: false, sortOrder: 7 },
  { id: 'sow-8', section: 'scopeOfWork', text: 'Airmate grilles', isDefault: true, deleted: false, sortOrder: 8 },
  { id: 'sow-9', section: 'scopeOfWork', text: 'Five (5) Year parts & labor warranty', isDefault: true, deleted: false, sortOrder: 9 },
  { id: 'sow-10', section: 'scopeOfWork', text: 'One (1) Year maintenance agreement', isDefault: true, deleted: false, sortOrder: 10 },

  // Equipment Options
  { id: 'eq-1', section: 'equipmentOptions', text: 'VRV Daikin IV Equipment / 18.0 EER / Cool Automation Centralized Controller / Daikin Individual Room Controllers / Ten (10) Year Parts Warranty / Five (5) Year Labor Warranty / Number (#) IDU\'s / Number (#) ODU\'s', price: '24000', isDefault: true, deleted: false, sortOrder: 1 },
  { id: 'eq-2', section: 'equipmentOptions', text: 'Geothermal WaterFurnace Equipment / 27.0 EER / 2 Speed / Variable Volume Air Flow', price: '20000', isDefault: true, deleted: false, sortOrder: 2 },
  { id: 'eq-3', section: 'equipmentOptions', text: 'Premium Lennox Equipment / 28.0 SEER / 96% AFUE / Inverter Technology / Variable Volume Air Flow', price: '18000', isDefault: true, deleted: false, sortOrder: 3 },
  { id: 'eq-4', section: 'equipmentOptions', text: 'Deluxe Lennox Equipment / 23.0 SEER / 96% AFUE / 2 Speed / Variable Volume Air Flow', price: '15000', isDefault: true, deleted: false, sortOrder: 4 },
  { id: 'eq-5', section: 'equipmentOptions', text: 'Standard Lennox Equipment / 18.0 SEER / 96% AFUE / 2 Speed / Variable Volume Air Flow', price: '10000', isDefault: true, deleted: false, sortOrder: 5 },

  // HVAC Options
  { id: 'hvac-1', section: 'hvacOptions', text: 'Ducted Wine Unit', price: '18500', isDefault: true, deleted: false, sortOrder: 1 },
  { id: 'hvac-2', section: 'hvacOptions', text: 'One (1) Inline Exhaust Fan / Venting / Grilles', price: '1800', isDefault: true, deleted: false, sortOrder: 2 },
  { id: 'hvac-3', section: 'hvacOptions', text: 'Venting for One (1) Bath Exhaust Fan', price: '600', isDefault: true, deleted: false, sortOrder: 3 },
  { id: 'hvac-4', section: 'hvacOptions', text: 'Venting for One (1) Kitchen Cook Top', price: '1000', isDefault: true, deleted: false, sortOrder: 4 },
  { id: 'hvac-5', section: 'hvacOptions', text: 'Venting for One (1) Dryer', price: '900', isDefault: true, deleted: false, sortOrder: 5 },
  { id: 'hvac-6', section: 'hvacOptions', text: 'Sante Fe Impact 155 Dehumidifier', price: '7000', priceUnit: 'Each', isDefault: true, deleted: false, sortOrder: 6 },
  { id: 'hvac-7', section: 'hvacOptions', text: 'Aprilaire Humidifier', price: '5250', priceUnit: 'Each', isDefault: true, deleted: false, sortOrder: 7 },
  { id: 'hvac-8', section: 'hvacOptions', text: 'HEPA Filtration System', price: '4600', priceUnit: 'Each', isDefault: true, deleted: false, sortOrder: 8 },
  { id: 'hvac-9', section: 'hvacOptions', text: 'Temporary 5 Ton Heat/Cool Package Unit', price: '4800', priceUnit: 'Each', isDefault: true, deleted: false, sortOrder: 9 },
  { id: 'hvac-10', section: 'hvacOptions', text: '10 Year Parts & Labor Extended Warranty', price: '1500', priceUnit: 'Per System', isDefault: true, deleted: false, sortOrder: 10 },
  { id: 'hvac-11', section: 'hvacOptions', text: 'Architectural Grilles', price: undefined, priceUnit: 'TBD Upon Sample Selection', isDefault: true, deleted: false, sortOrder: 11 },

  // Work Not Included
  { id: 'wni-1', section: 'workNotIncluded', text: 'Sheetrock', isDefault: true, deleted: false, sortOrder: 1 },
  { id: 'wni-2', section: 'workNotIncluded', text: 'Carpentry', isDefault: true, deleted: false, sortOrder: 2 },
  { id: 'wni-3', section: 'workNotIncluded', text: 'Electrical', isDefault: true, deleted: false, sortOrder: 3 },
  { id: 'wni-4', section: 'workNotIncluded', text: 'Plumbing', isDefault: true, deleted: false, sortOrder: 4 },
  { id: 'wni-5', section: 'workNotIncluded', text: 'Exhaust Venting', isDefault: true, deleted: false, sortOrder: 5 },
  { id: 'wni-6', section: 'workNotIncluded', text: 'Exhaust Fans', isDefault: true, deleted: false, sortOrder: 6 },
  { id: 'wni-7', section: 'workNotIncluded', text: 'Heavy Equipment / Labor For Rock (Geothermal Digging)', isDefault: true, deleted: false, sortOrder: 7 },
  { id: 'wni-8', section: 'workNotIncluded', text: 'Spoils Haul Off', isDefault: true, deleted: false, sortOrder: 8 },
  { id: 'wni-9', section: 'workNotIncluded', text: 'Casing For Water', isDefault: true, deleted: false, sortOrder: 9 },
  { id: 'wni-10', section: 'workNotIncluded', text: 'Vacuum Truck', isDefault: true, deleted: false, sortOrder: 10 },
];

interface AppState {
  builders: Builder[];
  projects: Project[];
  proposalItems: ProposalItem[];
  pricingConfig: PricingConfig;

  // Builders
  addBuilder: (b: Omit<Builder, 'id'>) => void;
  updateBuilder: (id: string, b: Partial<Builder>) => void;
  deleteBuilder: (id: string) => void;

  // Projects
  addProject: (p: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Pricing config
  updatePricingConfig: (patch: Partial<PricingConfig>) => void;
  resetPricingConfig: () => void;

  // Proposal items (global defaults)
  addProposalItem: (item: Omit<ProposalItem, 'id' | 'deleted' | 'sortOrder'>) => void;
  updateProposalItem: (id: string, item: Partial<ProposalItem>) => void;
  deleteProposalItem: (id: string) => void;
  reorderProposalItem: (id: string, direction: 'up' | 'down') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      builders: DEFAULT_BUILDERS,
      projects: [],
      proposalItems: DEFAULT_PROPOSAL_ITEMS,
      pricingConfig: DEFAULT_PRICING_CONFIG,

      updatePricingConfig: (patch) => set((s) => ({ pricingConfig: { ...s.pricingConfig, ...patch } })),
      resetPricingConfig: () => set({ pricingConfig: DEFAULT_PRICING_CONFIG }),

      addBuilder: (b) => set((s) => ({ builders: [...s.builders, { ...b, id: uid() }] })),
      updateBuilder: (id, b) => set((s) => ({ builders: s.builders.map((x) => x.id === id ? { ...x, ...b } : x) })),
      deleteBuilder: (id) => set((s) => ({ builders: s.builders.filter((x) => x.id !== id) })),

      addProject: (p) => {
        const id = uid();
        const now = new Date().toISOString();
        set((s) => ({ projects: [...s.projects, { ...p, id, createdAt: now, updatedAt: now }] }));
        return id;
      },
      updateProject: (id, p) => set((s) => ({
        projects: s.projects.map((x) => x.id === id ? { ...x, ...p, updatedAt: new Date().toISOString() } : x),
      })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),

      addProposalItem: (item) => {
        const sectionItems = get().proposalItems.filter((x) => x.section === item.section);
        const maxOrder = sectionItems.reduce((m, x) => Math.max(m, x.sortOrder), 0);
        set((s) => ({
          proposalItems: [...s.proposalItems, { ...item, id: uid(), deleted: false, sortOrder: maxOrder + 1 }],
        }));
      },
      updateProposalItem: (id, item) => set((s) => ({
        proposalItems: s.proposalItems.map((x) => x.id === id ? { ...x, ...item } : x),
      })),
      deleteProposalItem: (id) => set((s) => ({
        proposalItems: s.proposalItems.map((x) => x.id === id ? { ...x, deleted: true } : x),
      })),
      reorderProposalItem: (id, direction) => set((s) => {
        const item = s.proposalItems.find((x) => x.id === id);
        if (!item) return s;
        const section = s.proposalItems
          .filter((x) => x.section === item.section && !x.deleted)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = section.findIndex((x) => x.id === id);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= section.length) return s;
        const swapItem = section[swapIdx];
        return {
          proposalItems: s.proposalItems.map((x) => {
            if (x.id === id) return { ...x, sortOrder: swapItem.sortOrder };
            if (x.id === swapItem.id) return { ...x, sortOrder: item.sortOrder };
            return x;
          }),
        };
      }),
    }),
    {
      name: 'hvac-estimator-v1',
      // Merge stored state with current defaults so newly added fields always get a value
      // even when loading an older localStorage snapshot that predates them.
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        pricingConfig: { ...DEFAULT_PRICING_CONFIG, ...(persisted as any)?.pricingConfig },
      }),
    }
  )
);

export const getSectionItems = (items: ProposalItem[], section: SectionKey) =>
  items.filter((x) => x.section === section && !x.deleted).sort((a, b) => a.sortOrder - b.sortOrder);
