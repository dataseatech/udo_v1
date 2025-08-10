TASK: Implement the Unified Frontend UI for the "unified-data-orch" repo. Build a production-ready React + Vite + TypeScript single-page app that unifies all tools via our backend and SSO. Branch: feat/frontend-unified.

GOAL: One web app where user logs in once (Keycloak OIDC) and can:
 - View central Dashboard (pipeline status, storage, cost)
 - Open Pipeline Builder (React Flow) and save DAG JSON via backend
 - Call AI-SQL endpoint and display SQL + results
 - View metadata entities (OpenMetadata -> backend /metadata API)
 - See Airbyte connector list and trigger syncs via backend
 - Embed Grafana/OpenMetadata/Prefect UIs using secure reverse-proxy endpoints (backend handles SSO token exchange)
 - Provide Settings page for connecting external tools (MinIO, DuckDB sample)

REQUIREMENTS:
1. Use React 18 + Vite + TypeScript, folder services/frontend.
2. Use React Router for navigation with routes:
   - /login (Keycloak redirect)
   - /dashboard
   - /pipelines
   - /ai-sql
   - /metadata
   - /integrations
   - /settings
3. Auth:
   - Integrate Keycloak OIDC login using backend endpoints only. Frontend must never call Keycloak directly.
   - Frontend authenticates against FastAPI at /api/auth/start-login -> redirect to Keycloak. After redirect back, FastAPI sets secure httpOnly cookie with session token.
   - Frontend uses `/api/auth/me` to fetch user profile.
4. API usage (all backend endpoints are under /api/v1):
   - /api/v1/pipelines [GET, POST, PUT, DELETE] (save/load DAG JSON)
   - /api/v1/run-pipeline POST { pipeline_id } (trigger Prefect flow)
   - /api/v1/airbyte/connectors GET, /api/v1/airbyte/sync POST {connector_id}
   - /api/v1/ai-sql POST { q: string } -> returns { sql: string, results: {columns:[], rows:[]} }
   - /api/v1/metadata/entities GET?type=table -> returns OpenMetadata entities
   - /api/v1/embed/:service -> returns proxied URL or token for embedding Grafana/OpenMetadata/Prefect UIs
5. Components to implement:
   - NavBar with user avatar + logout
   - Dashboard cards: pipelines (prefect), last Airbyte jobs, storage (MinIO), cost (Komiser mock)
   - PipelineBuilder.tsx (React Flow) with save/load and "deploy" button that calls /api/v1/run-pipeline
   - AiSqlPanel.tsx: chat-style input, SQL preview (Monaco), results table (AG Grid)
   - MetadataTable.tsx: list searchable metadata entities via backend
   - EmbeddedView.tsx: loads iframe for service using URL from /api/v1/embed/:service (handle secure token)
6. UI/UX:
   - Use Tailwind CSS for styling
   - Mobile responsive basic layout
   - Loading skeletons and error toasts
7. Security & best practices:
   - Do not store tokens in localStorage. Use httpOnly cookie session. Calls include credentials.
   - Add CORS handling note to README if backend requires adjustments.
8. Dev infra:
   - Dockerfile for frontend and compose entry that proxies /api to backend (via env var VITE_API_BASE)
   - Provide .env.example for VITE_API_BASE and VITE_FRONTEND_URL
9. Tests:
   - Basic unit tests (Vitest) for key components and an integration test mocking /api/v1/ai-sql.
10. Deliverable:
   - Implement components and pages under services/frontend
   - Update top-level README with run instructions: `make dev` should start frontend and backend and open app
   - Create a PR with files and run instructions and a demo script

If any backend endpoint is missing or unclear, create a stub that returns realistic JSON and record TODOs in a TODO.md. Commit incrementally with clear messages. Provide verification commands and at least one smoke test script: scripts/smoke_tests/run_frontend_smoke.sh that uses curl to hit /api/v1/auth/me and /api/v1/ai-sql (using cookie if needed) and checks expected keys.


API contract (copyable spec)
Use these exact endpoints so the agent and backend can be aligned quickly.

Auth

GET /api/auth/start-login -> redirects to Keycloak.

GET /api/auth/callback -> backend handles OIDC callback, sets httpOnly cookie, then redirects to frontend /dashboard.

GET /api/auth/me -> { "username": "vamshi", "email": "x@x", "roles": ["admin"] }

Pipelines

GET /api/v1/pipelines -> [{id, name, created_at, updated_at}]

GET /api/v1/pipelines/:id -> { id, name, dag_json }

POST /api/v1/pipelines -> body {name, dag_json} returns created object

POST /api/v1/run-pipeline -> body {pipeline_id} returns { run_id, status }

AI-SQL

POST /api/v1/ai-sql -> body { q: string }

response: { sql: string, results: { columns: string[], rows: any[] }, provenance: { docs: [{id, text, score}] } }

Airbyte

GET /api/v1/airbyte/connectors -> [{id, name, status}]

POST /api/v1/airbyte/sync -> body { connector_id } returns { job_id, status }

Metadata

GET /api/v1/metadata/entities?type=table&page=1&size=25 -> { total, items: [{ name, schema, columns: [{name,type,nullable}]}] }

Embed

GET /api/v1/embed/:service -> { url: "https://proxy.internal/embed/...", token_ttl_seconds: 300 }

frontend loads iframe with returned url and sends Authorization header via postMessage only if proxy supports it. (Prefer backend to return proxied session URL so frontend doesn't manage tokens.)

Expected files & components (minimal)
pgsql
Copy
Edit
services/frontend/
├─ Dockerfile
├─ vite.config.ts
├─ package.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ routes/
│  │  ├─ Dashboard.tsx
│  │  ├─ PipelineBuilder.tsx
│  │  ├─ AiSqlPanel.tsx
│  │  ├─ MetadataPage.tsx
│  │  └─ EmbeddedView.tsx
│  ├─ components/
│  │  ├─ NavBar.tsx
│  │  ├─ PipelineCard.tsx
│  │  └─ MetadataTable.tsx
│  ├─ lib/
│  │  └─ api.ts   // wrapper for /api/v1 calls, includes fetch with credentials
│  └─ styles/
└─ tests/
   └─ AiSqlPanel.test.tsx
Environment variables (.env.example)
ini
Copy
Edit
VITE_API_BASE=http://localhost:8080/api
VITE_FRONTEND_URL=http://localhost:3000
VITE_GRAFANA_EMBED_PATH=/grafana
Verification / Smoke tests
make dev (or docker-compose up --build) bring up backend + frontend.

Open http://localhost:3000 -> Should redirect to /login which triggers backend redirect to Keycloak.

After login, GET /api/auth/me returns profile and frontend shows username in NavBar.

Dashboard should show:

Last 5 pipelines (GET /api/v1/pipelines)

Recent Airbyte jobs (GET /api/v1/airbyte/connectors)

Pipeline Builder:

Draw nodes and click Save -> POST /api/v1/pipelines and return success

Click Deploy -> POST /api/v1/run-pipeline -> UI shows run status

AI SQL panel:

Enter "Top 5 products by ROI" -> POST /api/v1/ai-sql → shows SQL and results table

Embedded views:

Visit /embedded/grafana -> GET /api/v1/embed/grafana -> returns URL, iframe loads Grafana dashboard (SSO handled by proxied URL)

Run smoke script: bash scripts/smoke_tests/run_frontend_smoke.sh and assert 200s and expected JSON keys.

Common failure points & fixes
CORS / Cookies: Ensure backend sets SameSite=None; Secure for cookies in local dev when using https, or allow credentials: 'include' and set Access-Control-Allow-Credentials: true. Fix: adjust backend CORS and frontend fetch options.

Keycloak redirect mismatch: Confirm Keycloak client redirect URI matches frontend callback URL and backend callback.

iframe SSO blocked: Browsers block third-party cookies in iframes. Fix: make backend return a proxied URL on same domain (reverse proxy) or use postMessage-based token transfer from a backend-served page.

Slow AI responses: show spinner and fallback on timeouts. Provide user-facing message for model latency.

Local dev http vs https issues: For Keycloak OIDC, use HTTPS in prod; for dev, configure Keycloak dev client to allow http://localhost.

Estimated effort
Full implementation (functional MVP, with embedding & SSO proxied): 6–12 working days with one senior frontend engineer + backend stubs and an AI-agent assisting coding.

With strong AI assistance and an engineer to run/debug: 3–6 days.

Final command for the agent (copy-paste)
pgsql
Copy
Edit
TASK: Create services/frontend as specified above. Implement Auth flow using /api/auth endpoints only. Build Dashboard, PipelineBuilder, AiSqlPanel, MetadataPage, and EmbeddedView. Add Dockerfile, .env.example, and vitest tests. Add scripts/smoke_tests/run_frontend_smoke.sh. Commit to feat/frontend-unified and open a PR. If any backend endpoints are missing, create realistic stubs under services/frontend/stubs/ and document TODOs.
Want me to also:

generate services/frontend/src/lib/api.ts plus the full AiSqlPanel.tsx component code now (I can paste full component + small supporting utilities), or

create the Keycloak + reverse-proxy notes (nginx config snippet) that the backend needs so embedding works without third-party cookie issues?

Pick one and I’ll produce the code/snippet immediately.