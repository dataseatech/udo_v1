# Unified Frontend Reverse Proxy & Keycloak / Embedding Guidance (External Frontend Repo)

Purpose: Enable a single React SPA (external repository) to access backend APIs and embed Grafana, OpenMetadata, Prefect (and optionally Airbyte) without third‑party cookie issues. Strategy: serve SPA, backend (/api), and embedded tool iframes behind one parent domain (e.g. https://udo.local) via a reverse proxy (nginx/Traefik/Caddy). All auth is mediated by FastAPI + Keycloak OIDC; the SPA never talks to Keycloak directly.

## 1. Keycloak Configuration
Realm: udo
Client: udo-frontend-backend (confidential)
- Access Type: confidential (or public if only using code+PKCE; confidential recommended with backend exchanging tokens)
- Valid Redirect URIs:
  - http://localhost:8000/* (dev if proxy directly on 8000)
  - http://localhost:3000/* (if developing frontend separately)
  - https://udo.local/*
- Web Origins:
  - (leave blank to use redirect URIs) OR explicitly: http://localhost:3000, http://localhost:8000, https://udo.local
- Front Channel Logout URL: https://udo.local/logout
- Standard Flow Enabled: ON
- Direct Access Grants: OFF (not needed for browser)
- Service Account: ON (backend can use client credentials for internal token exchange if needed)

User profile endpoint contract (implemented by backend after cookie session validation):
GET /api/auth/me -> { "username": "<kc-username>", "email": "..", "roles": ["role1", ...] }

Cookie guidance (set by backend):
- Name: udo_session (opaque session or encrypted JWT reference)
- Attributes (dev HTTP): SameSite=Lax; HttpOnly; Path=/; (Secure omitted if http)
- Attributes (prod HTTPS): SameSite=None; Secure; HttpOnly; Path=/
- Do NOT expose tokens to JS. Keep refresh token server-side; maintain server session store or signed data structure.

## 2. Backend OIDC Flow (High Level)
1. Frontend hits /api/auth/start-login -> backend constructs Keycloak auth URL (response_type=code, scope=openid profile email, code_challenge=PKCE) and 302 redirects.
2. Keycloak redirects user back to /api/auth/callback?code=...; backend exchanges code for tokens via token endpoint.
3. Backend stores refresh/access token (server session) keyed by session ID; sets httpOnly cookie; 302 -> /dashboard.
4. Frontend then calls /api/auth/me to populate UI.

## 3. Reverse Proxy Topology
All browser-visible origins unify under single host: udo.local (maps to 127.0.0.1 via /etc/hosts). Paths:
- / (index.html served by frontend container)
- /assets/* (frontend static)
- /api/* -> FastAPI service (container: fastapi:8000)
- /grafana/ -> Grafana (container: grafana:3000)
- /openmetadata/ -> OpenMetadata UI (container: openmetadata-server:8585)
- /prefect/ -> Prefect UI (container: prefect:4200)
- /airbyte/ (optional) -> Airbyte webapp (container: airbyte-webapp:8000)

Avoid third‑party cookie blocking because iframes originate from same parent domain path segments, not different domains.

## 4. Nginx Reference Configuration
Use this as a starting point (docker image: nginx:1.27-alpine). Place under services/frontend/nginx/default.conf (adjust upstream names if compose service names differ).

```
server {
  listen 80;
  server_name udo.local;

  # Security / hardening
  add_header X-Frame-Options SAMEORIGIN always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy no-referrer-when-downgrade;
  add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:; frame-src 'self'; connect-src 'self' ws: wss: http://udo.local https://udo.local;";

  # Serve SPA
  root /usr/share/nginx/html;
  index index.html;

  # Frontend static assets (cache bust by hashed filenames)
  location /assets/ {
    try_files $uri =404;
    access_log off;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # API proxy (FastAPI)
  location /api/ {
    proxy_pass http://fastapi:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
  }

  # Grafana (path prefix rewrite)
  location /grafana/ {
    proxy_pass http://grafana:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    sub_filter_once off;
    # Optional: ensure relative URLs (Grafana usually supports root_url = /grafana/ in grafana.ini)
  }

  # OpenMetadata
  location /openmetadata/ {
    proxy_pass http://openmetadata-server:8585/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
  }

  # Prefect UI (supports websockets)
  location /prefect/ {
    proxy_pass http://prefect:4200/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # (Optional) Airbyte Webapp
  location /airbyte/ {
    proxy_pass http://airbyte-webapp:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # SPA route fallback (must be last)
  location / {
    try_files $uri /index.html;
  }
}
```

### Compose Snippet (proxy service)
Add to docker-compose.yml (adjust volumes path to built frontend dist):
```
  frontend-proxy:
    image: nginx:1.27-alpine
    depends_on:
      - fastapi
      - grafana
      - openmetadata-server
      - prefect
    volumes:
      - ./services/frontend/dist:/usr/share/nginx/html:ro
      - ./services/frontend/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "3000:80"
    networks:
      - udo-net
```

## 5. Grafana Auth Proxy Mode (Optional Simplification)
Instead of managing Grafana login inside iframe:
- In grafana.ini set:
```
[auth]
disable_login_form = true
[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
auto_sign_up = true
```
- Reverse proxy adds: `proxy_set_header X-WEBAUTH-USER $cookie_udo_session_user;` (backend must set additional cookie or inject header via internal sidecar). Simpler alternative: use standard Grafana login proxied and rely on shared cookie domain; for local dev this is usually adequate.

## 6. OpenMetadata & Prefect Embedding
- Prefer path prefix approach to avoid cross-domain issues.
- If OpenMetadata needs absolute URL configuration, set `SERVER_URL` or equivalent to `/openmetadata/` base path (or configure reverse proxy to rewrite). If absolute links leak the upstream host, add sub_filter rules or configure the application for relative paths.
- Prefect: ensure `--host 0.0.0.0` (already) and rely on path prefix; no special config beyond websockets proxy.

## 7. CORS Considerations
Because everything shares one origin (udo.local) CORS is minimized. Ensure FastAPI CORS settings either:
- Restrict origins to ["https://udo.local", "http://udo.local"] with allow_credentials=True, or
- (Dev) wildcard only if not exposing secrets, still allow_credentials must be False then (so prefer explicit list).

## 8. Production TLS
Terminate TLS at proxy. Replace `listen 80;` with:
```
listen 443 ssl http2;
ssl_certificate /etc/letsencrypt/live/udo.local/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/udo.local/privkey.pem;
```
Then add an HTTP->HTTPS 301 redirect server block.

## 9. Frontend Build Integration
Vite build outputs to services/frontend/dist. Use environment variables:
- VITE_API_BASE = "/api" (since same origin)
- VITE_FRONTEND_URL = "https://udo.local"
Front-end fetch wrapper uses `fetch(import.meta.env.VITE_API_BASE + '/v1/ai-sql', { credentials: 'include' })`.

## 10. Testing / Smoke
After bringing up proxy:
```
# Auth start (should 302 to Keycloak)
curl -I http://udo.local/api/auth/start-login
# Static asset
curl -I http://udo.local/assets/index-*.js
# Grafana (should 200 login or 302 depending on auth state)
curl -I http://udo.local/grafana/
```

## 11. TODOs
- Implement backend /api/auth/* endpoints per spec.
- Add automated integration test that loads iframe endpoints and asserts 200.
- Consider CSP adjustments once exact inline script needs known (Vite may inject some inline scripts for dev; loosen during dev only).

---
This file documents the required reverse proxy + Keycloak embedding model. Adjust paths & ports as services evolve.
