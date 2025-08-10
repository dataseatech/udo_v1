"""Airbyte -> DuckDB Prefect flow with exponential backoff and Prometheus metrics.

Expected by task 4: provides a flow that:
 1. Triggers an Airbyte sync
 2. Polls for completion with exponential backoff (bounded)
 3. Executes one or more DuckDB SQL statements (import / transform)
 4. Pushes basic metrics to a Prometheus Pushgateway

This file is intentionally focused on the core orchestration (no GE / metadata).
"""

from __future__ import annotations

import asyncio
import time
import logging
from typing import List, Dict, Any

import httpx
import duckdb
from prefect import flow, task, get_run_logger
from prometheus_client import Counter, Histogram, push_to_gateway

SYNC_COUNTER = Counter("airbyte_sync_total", "Total Airbyte sync executions")
SYNC_DURATION = Histogram("airbyte_sync_duration_seconds", "Airbyte sync total duration")


def _logger():
    try:
        return get_run_logger()
    except Exception:
        return logging.getLogger("prefect-fallback")


@task
async def trigger_sync(connection_id: str, airbyte_url: str) -> str:
    log = _logger()
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(f"{airbyte_url}/api/v1/connections/sync", json={"connectionId": connection_id})
        r.raise_for_status()
        job_id = r.json()["job"]["id"]
    log.info("Triggered Airbyte sync job_id=%s", job_id)
    return job_id


@task
async def wait_for_job(job_id: str, airbyte_url: str, max_wait: int = 1800) -> Dict[str, Any]:
    """Poll Airbyte job until terminal state with exponential backoff.

    max_wait: cap total wait seconds.
    """
    log = _logger()
    delay = 5
    waited = 0
    async with httpx.AsyncClient(timeout=60) as client:
        while True:
            r = await client.get(f"{airbyte_url}/api/v1/jobs/{job_id}")
            r.raise_for_status()
            data = r.json()
            status = data["job"]["status"].lower()
            log.info("Job %s status=%s waited=%ss", job_id, status, waited)
            if status in {"succeeded", "failed", "cancelled", "incomplete"}:
                return data
            await asyncio.sleep(delay)
            waited += delay
            if waited >= max_wait:
                log.error("Job %s timeout after %ss", job_id, waited)
                data["timed_out"] = True
                return data
            delay = min(delay * 2, 60)  # cap backoff


@task
def run_duckdb_sql(db_path: str, sql_statements: List[str]) -> None:
    log = _logger()
    con = duckdb.connect(db_path)
    try:
        for sql in sql_statements:
            log.info("Executing DuckDB SQL: %s", sql.split("\n")[0][:120])
            con.execute(sql)
    finally:
        con.close()
    log.info("DuckDB statements executed count=%d", len(sql_statements))


@task
def push_metrics(gateway_url: str, job_name: str, status: str, duration: float) -> None:
    log = _logger()
    SYNC_COUNTER.inc()
    SYNC_DURATION.observe(duration)
    try:
        push_to_gateway(gateway_url, job=job_name, registry=None)
        log.info("Metrics pushed status=%s duration=%.2fs", status, duration)
    except Exception as e:
        log.error("Pushgateway error: %s", e)


@flow(name="airbyte-to-duckdb")
async def airbyte_to_duckdb_flow(
    connection_id: str,
    airbyte_url: str = "http://airbyte-proxy:8000",
    duckdb_path: str = "/tmp/airbyte.duckdb",
    sql: List[str] | None = None,
    prometheus_gateway: str = "http://prometheus-pushgateway:9091",
    job_name: str = "airbyte-to-duckdb"
) -> Dict[str, Any]:
    log = get_run_logger()
    start = time.time()
    sql = sql or [
        "CREATE TABLE IF NOT EXISTS raw_sync_log(job_id VARCHAR, loaded_at TIMESTAMP DEFAULT now());"
    ]
    try:
        job_id = await trigger_sync(connection_id, airbyte_url)
        job_data = await wait_for_job(job_id, airbyte_url)
        job_status = job_data["job"]["status"].lower()
        if job_status == "succeeded":
            run_duckdb_sql(duckdb_path, sql)
            status = "success"
        else:
            status = job_status
            log.warning("Airbyte job finished with status=%s", job_status)
        duration = time.time() - start
        push_metrics(prometheus_gateway, job_name, status, duration)
        return {"status": status, "duration": duration, "job_id": job_id}
    except Exception as e:
        duration = time.time() - start
        push_metrics(prometheus_gateway, job_name, "error", duration)
        log.error("Flow error: %s", e)
        raise


if __name__ == "__main__":  # manual run demo
    asyncio.run(airbyte_to_duckdb_flow("dummy-connection-id"))
