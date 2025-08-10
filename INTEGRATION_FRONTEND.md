External Frontend Integration
=============================

This repository now contains only backend and data platform services. The web UI should live in a separate repository.

Backend Base URL
----------------
Local development backend base URL:

  http://localhost:8800

Expose this to the frontend via an environment variable (e.g. `VITE_API_BASE` or similar) so the SPA calls:

  GET /api/health
  GET /api/auth/start-login
  GET /api/auth/callback
  GET /api/auth/me

OIDC / Keycloak
---------------
Create or update a Keycloak public client (default id: `udo`). Required settings for local dev:

  Redirect URIs: http://localhost:8800/* (plus your frontend origin if it differs)
  Web Origins:   http://localhost:8800 (plus your frontend origin)

The backend's /api/auth/start-login endpoint accepts optional query params:

  redirect_uri: override the post-auth redirect target (defaults to request origin or backend base)
  client_id:    override OIDC client (defaults to env OIDC_CLIENT_ID)

PKCE is automatically used (code_challenge S256). The backend sets a temporary pkce_verifier cookie (non-HttpOnly) only for local development; replace with a proper server session for production deployments.

Logout flow:
  GET /api/auth/logout -> returns Keycloak end-session endpoint URL. Frontend can navigate user there.

Embedding Other Tools
---------------------
Reverse proxy (nginx/Traefik/Caddy) should co-host:
  /api -> backend (FastAPI)
  /openmetadata -> OpenMetadata (proxied through backend route already implemented)
  /grafana, /prefect, etc. -> respective services (optionally via backend if auth mediation required)

Security Notes
--------------
For production:
  - Issue HttpOnly, Secure, SameSite=None cookies for session (replace raw token JSON response)
  - Enforce audience verification if using dedicated audience in tokens
  - Use HTTPS everywhere to enable third-party cookie-less embedding strategies

Smoke Test (Manual)
-------------------
1. Visit {FRONTEND_ORIGIN}/ (external repo dev server)
2. Click login (should navigate to /api/auth/start-login)
3. Complete Keycloak auth -> redirected back; frontend calls /api/auth/me and displays user

Troubleshooting
---------------
Keycloak redirect mismatch: ensure the redirect_uri param and client redirect URIs align exactly.
PKCE failure: confirm pkce_verifier cookie present during callback exchange.
Mixed issuer hostnames: set OIDC_PUBLIC_ISSUER to a browser-reachable hostname (localhost) even if internal issuer uses container hostname.

---
Maintain this document as integration details evolve.
