# Unified Data Orchestration Platform (udo)

## Quick Start

1. Copy `.env.example` to `.env` and update credentials as needed.
2. Build and start all services:
   ```sh
   make up
   ```
3. Run tests (dockerized):
   ```sh
   make test
   ```
4. Stop all services:
   ```sh
   make down
   ```

## Services
- Frontend (React + Vite) via nginx at http://localhost:3080 (build artifact container)
- Backend API Gateway (FastAPI) internal (container port 8000) proxied through frontend container `/api` and `/openmetadata`

### Frontend Dev

Inside `services/frontend` run `npm install` then `npm run dev` (port 3000). Configure API base via `.env` with `VITE_API_BASE` (default http://localhost:8080).

### Auth & Metadata

FastAPI gateway exposes:
* `/api/auth/start-login` – initiates OIDC Authorization Code (with PKCE) against Keycloak
* `/api/auth/callback` – exchanges code for tokens (returns JSON with access_token for dev)
* `/api/auth/me` – validates bearer token and returns claims
* `/openmetadata/*` – reverse proxy to OpenMetadata server

Keycloak client (realm `master`, clientId `udo-frontend`) must have:
* Redirect URIs: `http://localhost:3080/*`
* Web Origins: `http://localhost:3080`
* Standard Flow enabled, PKCE enabled (on by default KC 24 for public clients)

Automated creation (dev only):
```sh
sh scripts/keycloak_create_client.sh
```
This uses admin/admin dev credentials and sets redirect + web origin.

PKCE: Backend sets a `pkce_verifier` cookie (non-HttpOnly for dev). For production replace with a server-side session and avoid returning raw tokens to the browser.


## Development
- All dependencies and tests run inside containers.
- No local Python or venv required.

## CI/CD
- Add GitHub Actions workflow in `.github/workflows/ci.yml` for linting, building, and testing.

## Documentation
- See `docs/` for more details.
