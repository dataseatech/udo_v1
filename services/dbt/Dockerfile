# Verified minimal Python base + dbt-core + adapter
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps for Postgres adapter (psycopg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl git libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Pin dbt components for reproducibility
ARG DBT_VERSION=1.7.7
RUN pip install --upgrade pip && \
    pip install "dbt-core==${DBT_VERSION}" "dbt-postgres==${DBT_VERSION}" && \
    dbt --version

WORKDIR /usr/app
COPY . /usr/app

# Default command overridden by compose (tail) to keep container alive for exec
ENTRYPOINT ["dbt"]
CMD ["--help"]
