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
- Postgres (udo-postgres)
- Minio
- Airbyte (OSS)
- Prefect (custom flow)
- Keycloak
- DuckDB runner

## Development
- All dependencies and tests run inside containers.
- No local Python or venv required.

## CI/CD
- Add GitHub Actions workflow in `.github/workflows/ci.yml` for linting, building, and testing.

## Documentation
- See `docs/` for more details.
