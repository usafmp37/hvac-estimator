import { createClient } from '@supabase/supabase-js';
import { authorized, buildDraft } from './_core.js';

const COMPANY_ID = 'company';

function appUrl() {
  return (process.env.ESTIMATOR_APP_URL || 'https://msc-hvac-estimator.vercel.app').replace(/\/$/, '');
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    return response.status(405).json({ status: 'failed', message: 'Method not allowed' });
  }
  if (!authorized(request.headers.authorization, process.env.ESTIMATOR_AUTOMATION_TOKEN)) {
    return response.status(401).json({ status: 'failed', message: 'Unauthorized' });
  }

  let draft;
  try {
    draft = buildDraft(request.body);
  } catch (error) {
    return response.status(400).json({
      status: 'failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }

  const writesEnabled = process.env.ESTIMATOR_AUTOMATION_WRITES_ENABLED === 'true';
  const dryRun = request.query?.dryRun === '1' || request.body?.dryRun === true || !writesEnabled;
  if (dryRun) {
    return response.status(200).json({
      status: 'needs_approval',
      summary: 'Connection verified. Estimate writes are disabled; no project was created.',
      resultUrl: null,
      dryRun: true,
      preview: {
        projectId: draft.id,
        projectName: draft.projectName,
        systemCount: draft.systems.length,
        bidDueDate: draft.bidDueDate
      }
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return response.status(503).json({ status: 'failed', message: 'Server database credentials are not configured' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error: readError } = await supabase
    .from('shared_data')
    .select('projects')
    .eq('id', COMPANY_ID)
    .single();

  if (readError) {
    return response.status(500).json({ status: 'failed', message: `Unable to read estimator data: ${readError.message}` });
  }

  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const existing = projects.find((project) => project.id === draft.id);
  if (!existing) {
    const { error: writeError } = await supabase
      .from('shared_data')
      .update({ projects: [...projects, draft], updated_at: new Date().toISOString() })
      .eq('id', COMPANY_ID);
    if (writeError) {
      return response.status(500).json({ status: 'failed', message: `Unable to create draft estimate: ${writeError.message}` });
    }
  }

  return response.status(200).json({
    status: 'needs_approval',
    summary: existing
      ? 'The draft estimate already exists and is ready for review.'
      : 'A draft estimate was created and is ready for review.',
    resultUrl: `${appUrl()}/projects/${draft.id}`,
    projectId: draft.id
  });
}
