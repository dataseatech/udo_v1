1 — Repo scaffold (single-shot)
Goal: create repo skeleton, CI templates, README and workspace.
Agent prompt:
Create a monorepo scaffold for "unified-data-orch" with folders: infra/, services/{airbyte,prefect,fastapi,frontend}, helm/, docs/, samples/. Add Docker Compose for local dev and a top-level Makefile. Add GitHub Actions CI that lints Python, builds Docker images, and runs unit tests. Provide README.md with run steps. Commit all files.

Expected outputs:
README.md, Makefile, .github/workflows/ci.yml
docker-compose.yml (services stubbed)
services/fastapi/, services/frontend/ with starter files

Verification:
make dev should start compose (or fail cleanly).

Common failures:
Port conflicts — agent should choose default ports and document them.
Estimated effort: 30–90 mins (AI does scaffold, human checks ports/env).


2 — Local dev Docker Compose (quick win)
Goal: runnable local stack: Postgres, MinIO, DuckDB (via service), Airbyte (OSS), Prefect server (or prefect Orion UI), Keycloak.
Agent prompt:
Generate docker-compose.yml including: postgres (named udo-postgres), minio, airbyte (OSS image), prefect (server or simplified UI), keycloak, and a "duckdb-runner" service (python container with duckdb installed) for demos. Configure volumes, network, and an .env.example with credentials. Add compose override for development.
Expected outputs:

docker-compose.yml, .env.example, compose.override.yml
Verification:

docker-compose up --build brings services to healthy state. Use docker-compose ps.
Common failures:

Image version mismatches — pin stable tags and include logs: docker-compose logs <service>.
Estimated effort: 1–3 hours.

3 — Airbyte connected to MinIO & Postgres
Goal: have Airbyte source/sink sample: read CSV from MinIO and load to Postgres (or to DuckDB sample).
Agent prompt:




In the repo, add a scripts/airbyte-setup directory with: a dockerized Airbyte instance config and a small Python script using Airbyte API to create a source (MinIO CSV) and destination (Postgres). Include sample CSV in samples/. Provide a curl command to validate a successful sync and a JSON template for the connector config.
Expected outputs:

scripts/airbyte-setup/create_connectors.py

samples/orders.csv
Verification:

Run script → Airbyte job becomes SUCCEEDED (check via Airbyte API).
Common failures:

MinIO credentials mismatch. Fix by aligning .env values.
Estimated effort: 2–4 hours.

4 — Prefect orchestration & dynamic DAGs
Goal: Prefect flows to trigger Airbyte syncs, orchestrate DuckDB ingestion, and emit metrics.
Agent prompt:




Create a Prefect project in services/prefect with: a flow that triggers the Airbyte sync via API, waits for completion, runs a DuckDB import script, and pushes Prometheus metrics. Include Dockerfile and Helm chart values for running on k8s. Add tests that mock Airbyte API.
Expected outputs:

services/prefect/flows/airbyte_to_duckdb.py

services/prefect/Dockerfile and helm/prefect-chart/
Verification:

prefect cloud agent start (or local) can run the flow. Flow logs show success.
Common failures:

Long polling timeout for Airbyte; include exponential backoff and robust error handling.
Estimated effort: 4–8 hours.

5 — Metadata & Data Quality (OpenMetadata + Great Expectations)
Goal: ingest metadata and run profile/expectations on ingested tables.
Agent prompt:




Add OpenMetadata deployment using Docker Compose and a connector that reads Postgres tables. Add a Great Expectations example suite that profiles the `orders` table and writes expectations to a directory. Add a Prefect task that runs GE validation and ingests results into OpenMetadata (or stores run metadata).
Expected outputs:

services/openmetadata/ compose files

services/great_expectations/ with great_expectations/ suite
Verification:

Great Expectations run returns success. OpenMetadata UI shows the orders dataset.
Common failures:

OpenMetadata DB connection; verify env & startup logs.
Estimated effort: 6–12 hours.

6 — Vector DB + RAG (Weaviate + LangChain)
Goal: ingest sample docs, vectorize and run a RAG answer for SQL prompts; demo: "Top 5 products by ROI".
Agent prompt:




Create a service to ingest sample product metadata (CSV) into Weaviate (dockerized). Build a LangChain pipeline that: 1) receives a natural language question, 2) uses semantic search in Weaviate to find relevant docs, 3) composes a DuckDB SQL query, 4) runs query against DuckDB, and 5) returns a combined answer. Expose this as a FastAPI endpoint /ai-sql.
Expected outputs:

services/weaviate/ compose config

services/fastapi/app/ai_sql.py using LangChain and duckdb-python
Verification:

POST /ai-sql {"q":"Top 5 products by ROI"} returns JSON with SQL used and results.
Common failures:

Embedding model access (if using OpenAI) — include fallback to open-source embedding (e.g., sentence-transformers) in requirements.
Estimated effort: 1–3 days (models/inference tuning).

7 — Feature store & MLflow integration
Goal: integrate Feast for feature ingestion and MLflow for experiment tracking.
Agent prompt:




Add a minimal Feast registry that reads features from DuckDB/Postgres and serves them via Feast online store (Redis or Postgres). Add an MLflow server (docker) and an example notebook/script showing a training run that logs metrics to MLflow and features to Feast. Provide helm charts for production.
Expected outputs:

services/feast/, services/mlflow/, sample notebook notebooks/train_demo.ipynb
Verification:

Query Feast online store returns expected feature vector for a sample entity. MLflow UI shows the run.
Common failures:

Feast store config mismatch; doc the ENV and helm values.
Estimated effort: 1–2 days.

8 — Auth & Secrets (Keycloak + Vault)
Goal: secure UI and APIs with Keycloak; store pipeline secrets in Vault.
Agent prompt:




Add Keycloak to docker-compose and integrate it with the FastAPI service (OIDC). Add HashiCorp Vault (dev mode OK for local) and a script that writes Airbyte & DB creds into Vault. Update Prefect and Airbyte configs to read secrets from Vault via env or sidecar.
Expected outputs:

services/keycloak/ compose config, services/vault/

services/fastapi/auth.py OIDC middleware
Verification:

Login via Keycloak returns JWT accepted by FastAPI endpoints.
Common failures:

Time skew in tokens — instruct to sync clocks in containers. Vault dev mode note: switch to production mode for real deploy.
Estimated effort: 1–2 days.

9 — Observability (Prometheus, Grafana, OpenTelemetry, Arize)
Goal: metrics, traces, LLM eval telemetry hookup.
Agent prompt:




Add Prometheus and Grafana to compose. Instrument FastAPI, Prefect flows and Airbyte exporter with OpenTelemetry/Prometheus metrics. Add Grafana dashboards (JSON) for Airbyte jobs, Prefect flow runtimes and DuckDB query latencies. Add a simple Arize mock (or use Arize SDK if key provided) to demonstrate LLM drift logging.
Expected outputs:

monitoring/prometheus.yml, monitoring/grafana/ dashboards

services/fastapi/instrumentation.py
Verification:

Metrics visible in Prometheus UI; Grafana imports dashboards.
Common failures:

Missing instrumentation libs; ensure opentelemetry-instrumentation-fastapi installed.
Estimated effort: 1–3 days.

10 — Frontend: React Flow pipeline builder + AI-SQL UI
Goal: build a minimal React app that can visually create DAGs and call the /ai-sql endpoint and Prefect API.
Agent prompt:

sql


Create a React + Vite + TypeScript app in services/frontend with: 
- React Flow canvas to drag connectors and save DAG as JSON.
- A panel to call /ai-sql and display results.
- Monaco or for raw SQL view and AG Grid for tabular results.
Add Dockerfile and compose entry.
Expected outputs:

services/frontend/ project with components: Flowor.tsx, AiSqlPanel.tsx
Verification:

App loads in browser; building a DAG and clicking "deploy" POSTs to Prefect stub endpoint.
Common failures:

CORS — add CORS middleware to FastAPI.
Estimated effort: 2–5 days.

11 — Helm charts, Argo CD, and GitOps
Goal: helm charts for production and Argo CD integration for GitOps.
Agent prompt:




Generate Helm charts for services: airbyte, prefect, fastapi, weaviate, weaviate. Add values.yaml examples for resource requests/limits and a sample Argo CD Application manifest that points to this repo chart path. Provide a Dagger pipeline (dagger.yml) to run helm lint, run tests, and push images.
Expected outputs:

helm/<service>/Chart.yaml + values.yaml

infra/argo/application.yaml
Verification:

helm lint passes; Argo CD app deploys to minikube (or k8s cluster).
Common failures:

RBAC in k8s — include example serviceAccount and RoleBinding.
Estimated effort: 2–4 days.

12 — CI/CD and automated tests
Goal: tests, unit & integration, and infra cost preview in PRs (Infracost skeleton).
Agent prompt:




Add tests: Python pytest for services, JS tests for frontend. Add GitHub Actions workflows: ci (lint/test), build-and-push (matrix), helm-lint. Add a job that runs infracost against terraform/helm values and posts a comment in PR (mocked token).
Expected outputs:

.github/workflows/ci.yml improvements, tests/ directories
Verification:

Actions run in GitHub Actions (or locally via act).
Common failures:

Secrets not configured in Actions; provide clear DOCS.
Estimated effort: 1–2 days.

13 — Load testing & cost demo (K6 + Komiser snapshot)
Goal: run K6 against DuckDB/Presto endpoints and produce a komiser cost snapshot for demo.
Agent prompt:




Add K6 scripts in infra/loadtest/k6 that benchmark DuckDB query endpoints. Add a sample Komiser config and instructions on how to run cost snapshot locally (Komiser requires cloud creds — provide demo mode or mock data). Provide sample results for demo claim: $320K → $56K (clearly label as demo projection).
Expected outputs:

infra/loadtest/k6/script.js, docs/cost_projection.md
Verification:

k6 run script.js produces metrics.
Common failures:

Komiser needs cloud access — include instructions to mock or use sample JSON.
Estimated effort: 1–2 days.

Repo structure (recommended)
kotlin


unified-data-orch/
├─ README.md
├─ Makefile
├─ docker-compose.yml
├─ compose.override.yml
├─ .env.example
├─ services/
│  ├─ fastapi/
│  ├─ prefect/
│  ├─ airbyte/
│  ├─ weaviate/
│  ├─ weaviate-embeddings/
│  ├─ mlflow/
│  ├─ feast/
│  └─ frontend/
├─ helm/
│  ├─ prefect/
│  ├─ airbyte/
│  └─ fastapi/
├─ infra/
│  ├─ argo/
│  ├─ k6/
│  └─ dagger/
├─ monitoring/
│  ├─ prometheus/
│  └─ grafana/
├─ scripts/
└─ samples/
The iteration loop (how to run this with an agent + Copilot)
Scaffold: run module 1 (repo scaffold). Human inspects README, runs make dev.

Local compose: run module 2. Fix env issues, pin images.

Airbyte → Prefect: implement modules 3 & 4. Run flows from Prefect UI.

Metadata & validation: module 5. Ensure GE suites pass.

RAG & AI-SQL: module 6. Use small open-source embedding locally first.

Feature & MLflow: module 7.

Auth, secrets, observability: modules 8 & 9.

Frontend: module 10, wire to local APIs (CORS).

Helm + GitOps: module 11. Deploy to a test kubernetes cluster (kind/minikube).

CI/CD & load testing: modules 12 & 13.