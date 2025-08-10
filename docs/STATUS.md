# Project Status - Unified Data Orchestration (udo)

Updated: 2025-08-10

## Legend
- ✅ Done
- 🚧 In Progress
- 🔜 Planned / To Do
- ⚠️ Needs Review / Blocked

## Core Scaffold & Repo
| Task | Status | Notes |
|------|--------|-------|
| Monorepo scaffold (infra/, services/, helm/, docs/, samples/) | ✅ | Created initial structure |
| README with run steps | ✅ | Minimal; needs expansion (architecture, troubleshooting) |
| Makefile (build, up, down, test) | ✅ | Works (make not native on Windows; optional) |
| Docker Compose (core services) | ✅ | Includes Postgres, MinIO, Airbyte server/webapp, Prefect, Keycloak, DuckDB runner, Pushgateway |
| docker-compose.override.yml (dev overrides) | ✅ | Provides dev creds & commands |
| .env.example | ✅ | Basic creds (NOT secure) |
| Remove obsolete `version` from compose files | 🔜 | Warnings still appear for override (base updated) |

## Data Integration / Airbyte
| Task | Status | Notes |
|------|--------|-------|
| Airbyte services defined in Compose | ✅ | Split server/webapp images |
| Airbyte setup script (source/destination/connection) | 🚧 | Basic script; missing schema discovery + job polling |
| Connector config template JSON | ✅ | Present |
| Sample CSV | ✅ | Present (samples/sample.csv) |
| End-to-end demo sync validation | 🔜 | Needs script or Prefect integration using real connection ID |

## Orchestration (Prefect)
| Task | Status | Notes |
|------|--------|-------|
| Prefect flow triggering Airbyte + wait + DuckDB + metrics | ✅ | Implemented with fallback logger |
| Prometheus metrics push (Pushgateway) | ✅ | Pushgateway added; no scraper stack yet |
| Tests mocking Airbyte API | ✅ | All passing in Docker |
| Helm values for Prefect | ✅ | Present (needs chart structure for full deploy) |
| Flow parameterization via env (AIRBYTE_CONNECTION_ID) | 🔜 | Prefect deployment file references parameter; env wiring not added in compose |

## Observability
| Task | Status | Notes |
|------|--------|-------|
| Pushgateway service | ✅ | Added |
| Full Prometheus server + Grafana | 🔜 | Not yet added |
| Healthchecks in Docker Compose | 🔜 | Missing for core services |

## Security / Auth
| Task | Status | Notes |
|------|--------|-------|
| Keycloak service | ✅ | Running in dev mode (start-dev) |
| Keycloak realm/bootstrap automation | 🔜 | Not implemented |
| Secrets via Vault (production pattern) | 🔜 | Not started |
| Non-root containers / image hardening | 🔜 | Current images run as root |

## API / Frontend
| Task | Status | Notes |
|------|--------|-------|
| FastAPI service scaffold | 🔜 | Not created |
| Frontend scaffold (React or similar) | 🔜 | Not created |
| API integration with Prefect & Airbyte | 🔜 | Pending service scaffolds |

## CI/CD
| Task | Status | Notes |
|------|--------|-------|
| GitHub Actions workflow (build + tests) | ✅ | Builds & tests Prefect only |
| Python linting (flake8/black) | 🔜 | Not yet added |
| Multi-service test matrix | 🔜 | Only Prefect service tested |
| Image tagging/versioning strategy | 🔜 | All images tagged latest |
| Cache optimization for CI | 🔜 | Not configured |

## Testing
| Task | Status | Notes |
|------|--------|-------|
| Unit tests (Prefect tasks) | ✅ | Passing |
| Integration test: Airbyte -> Postgres -> DuckDB | 🔜 | Pending working Airbyte connection & sample data load |
| Load/perf test placeholders | 🔜 | Not started |

## Documentation
| Task | Status | Notes |
|------|--------|-------|
| Local dev guide | 🚧 | Initial prompt existed; needs reintegration after reset |
| Architecture overview diagram | 🔜 | Not started |
| Runbook / Troubleshooting | 🔜 | Not started |
| Security model doc | 🔜 | Not started |

## Next Immediate Actions (Proposed Sequence)
1. Add linting & formatting (flake8 + black) in CI.
2. Scaffold FastAPI service (Dockerfile, /health, /trigger-sync endpoint calling Prefect/Airbyte).
3. Improve Airbyte setup script: discovery, catalog injection, job status polling.
4. Add integration test (mock Airbyte or run lightweight real job) executed in CI.
5. Add Prometheus + Grafana stack (optional dev observability) and service scrape configs.
6. Add Keycloak realm bootstrap script (JSON import) and environment variable wiring.
7. Harden Docker images (non-root user, pinned digests, healthchecks).
8. Expand README (architecture, workflows, metrics, security notes).

## Risks / Notes
- Airbyte script uses placeholder definition IDs; confirm actual IDs in running instance.
- Prefect + Airbyte integration requires real connection ID (env-driven) for production flow.
- Security hardening (non-root, least privilege) should precede any production use.
- Current CI only validates Prefect service; other services untested.

---
Maintain this file as tasks evolve. Update statuses with each PR.
