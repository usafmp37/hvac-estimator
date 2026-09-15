# Estimator Automation Endpoint

The Notion request router calls `POST /api/automation/estimate` with an `Authorization: Bearer ...` header and an idempotency key.

## Production variables

- `ESTIMATOR_AUTOMATION_TOKEN` — long random bearer token shared with the bridge
- `ESTIMATOR_AUTOMATION_WRITES_ENABLED` — keep `false` until a non-writing test is approved
- `SUPABASE_SERVICE_ROLE_KEY` — server-only key; never prefix with `VITE_`
- `SUPABASE_URL` — may reuse the same URL as `VITE_SUPABASE_URL`
- `ESTIMATOR_APP_URL` — `https://msc-hvac-estimator.vercel.app`

## Safety

- The endpoint is server-only and requires a bearer token.
- Requests generate deterministic project IDs, preventing duplicate drafts.
- Writes are disabled unless `ESTIMATOR_AUTOMATION_WRITES_ENABLED=true`.
- A successful write creates a draft and returns `needs_approval`.
- Notion attachment URLs are not copied because their signed URLs expire; the original request remains linked in Notion.

## Non-writing test

Send a valid request while writes remain disabled. The endpoint returns a preview and confirms that no project was created.
