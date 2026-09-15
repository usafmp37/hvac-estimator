import { createHash, timingSafeEqual } from 'node:crypto';

export function authorized(authorization, expectedToken) {
  if (!expectedToken || typeof authorization !== 'string') return false;
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const left = Buffer.from(provided);
  const right = Buffer.from(expectedToken);
  return left.length === right.length && timingSafeEqual(left, right);
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function cleanSystems(systems) {
  if (!Array.isArray(systems)) return [];
  return systems.slice(0, 30).map((system, index) => ({
    id: String(system.id || `system-${index + 1}`),
    name: String(system.name || `System ${index + 1}`).slice(0, 100),
    sqft: number(system.sqft),
    ...(number(system.overrideTons) > 0 ? { overrideTons: number(system.overrideTons) } : {}),
    zoned: Boolean(system.zoned),
    thermostats: number(system.thermostats, 1),
    exhaustFans: number(system.exhaustFans),
    dryerExhausts: number(system.dryerExhausts),
    cooktopExhausts: number(system.cooktopExhausts),
    grilles: number(system.grilles)
  }));
}

export function projectIdFor(pageId) {
  return `auto-${createHash('sha256').update(String(pageId)).digest('hex').slice(0, 20)}`;
}

export function buildDraft(body, now = new Date()) {
  const request = body?.request ?? body ?? {};
  const estimate = request.estimate ?? {};
  const projectName = String(
    estimate.projectName || request.customerProject || request.shortDescription || ''
  ).trim().slice(0, 160);

  if (!request.pageId) throw new Error('request.pageId is required');
  if (!projectName) throw new Error('A short description or customer/project name is required');

  const timestamp = now.toISOString();
  const systems = cleanSystems(estimate.systems);
  const calculatedSqft = systems.reduce((total, system) => total + system.sqft, 0);

  return {
    id: projectIdFor(request.pageId),
    projectName,
    projectAddress: String(estimate.projectAddress || '').slice(0, 240),
    cityState: String(estimate.cityState || '').slice(0, 160),
    builderId: String(estimate.builderId || '').slice(0, 100),
    bidStartDate: String(estimate.bidStartDate || timestamp.slice(0, 10)),
    bidDueDate: String(estimate.bidDueDate || request.neededBy || ''),
    totalACSqft: number(estimate.totalACSqft, calculatedSqft),
    architectSqft: number(estimate.architectSqft),
    markupPct: number(estimate.markupPct, 0.08),
    systems,
    geothermalWells: number(estimate.geothermalWells),
    proposalOverrides: Array.isArray(estimate.proposalOverrides) ? estimate.proposalOverrides : [],
    attachments: [],
    bundledAccessories: Array.isArray(estimate.bundledAccessories) ? estimate.bundledAccessories : [],
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
