import { authorized } from './_core.js';

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (!authorized(request.headers.authorization, process.env.ESTIMATOR_AUTOMATION_TOKEN)) {
    return response.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const databaseConfigured = Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return response.status(databaseConfigured ? 200 : 503).json({
    ok: databaseConfigured,
    service: 'msc-hvac-estimator-automation',
    writesEnabled: process.env.ESTIMATOR_AUTOMATION_WRITES_ENABLED === 'true',
    databaseConfigured
  });
}
