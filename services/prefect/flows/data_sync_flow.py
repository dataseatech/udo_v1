import asyncio
import time
import logging
from typing import Dict, Any
import httpx
import duckdb
from prefect import flow, task, get_run_logger
from prometheus_client import Counter, Histogram, push_to_gateway
import great_expectations as ge
from great_expectations.checkpoint import CheckpointResult
import json


# Prometheus metrics
sync_counter = Counter('airbyte_syncs_total', 'Total Airbyte syncs')
sync_duration = Histogram('airbyte_sync_duration_seconds', 'Airbyte sync duration')


def _logger():
    """Return a Prefect run logger if in a task/flow context, else a standard logger.
    This allows task .fn() invocation in unit tests without raising MissingContextError."""
    try:
        return get_run_logger()
    except Exception:
        return logging.getLogger("prefect-fallback")

@task
async def trigger_airbyte_sync(connection_id: str, airbyte_url: str) -> str:
    """Trigger Airbyte sync and return job ID"""
    logger = _logger()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{airbyte_url}/api/v1/connections/sync",
            json={"connectionId": connection_id}
        )
        response.raise_for_status()
        job_id = response.json()["job"]["id"]
        logger.info(f"Triggered sync job: {job_id}")
        return job_id


@task
async def wait_for_sync_completion(job_id: str, airbyte_url: str) -> Dict[str, Any]:
    """Wait for Airbyte sync to complete"""
    logger = _logger()
    
    async with httpx.AsyncClient() as client:
        while True:
            response = await client.get(f"{airbyte_url}/api/v1/jobs/{job_id}")
            response.raise_for_status()
            job_data = response.json()
            
            status = job_data["job"]["status"]
            logger.info(f"Job {job_id} status: {status}")
            
            if status in ["succeeded", "failed", "cancelled"]:
                return job_data
            
            await asyncio.sleep(10)


@task
def run_duckdb_import(db_path: str, sql_script: str) -> None:
    """Run DuckDB import script"""
    logger = _logger()
    
    conn = duckdb.connect(db_path)
    conn.execute(sql_script)
    logger.info("DuckDB import completed")
    conn.close()


@task
def push_metrics(gateway_url: str, job_name: str, sync_status: str, duration: float) -> None:
    """Push metrics to Prometheus gateway"""
    logger = _logger()
    
    sync_counter.inc()
    sync_duration.observe(duration)
    
    push_to_gateway(gateway_url, job=job_name, registry=None)
    logger.info(f"Pushed metrics: status={sync_status}, duration={duration}s")


@task
def run_ge_validation(ge_root: str = "/app/services/great_expectations/great_expectations") -> dict:
    """Run Great Expectations checkpoint for orders and return summary dict.
    Adjust ge_root if directory mounted differently in container.
    """
    logger = _logger()
    try:
        context = ge.get_context(context_root_dir=ge_root)
        checkpoint_name = "orders_checkpoint"
        result: CheckpointResult = context.run_checkpoint(checkpoint_name=checkpoint_name)
        success = result.success
        stats = {"success": success, "validation_ids": list(result.run_results.keys())}
        logger.info("GE validation success=%s", success)
        return stats
    except Exception as e:
        logger.error(f"GE validation failed: {e}")
        return {"success": False, "error": str(e)}


@flow(name="data-sync-flow")
async def data_sync_flow(
    connection_id: str,
    airbyte_url: str = "http://airbyte-server:8001",
    db_path: str = "/tmp/data.db",
    sql_script: str = "CREATE TABLE IF NOT EXISTS synced_data AS SELECT * FROM read_csv_auto('/tmp/data.csv');",
    prometheus_gateway: str = "http://prometheus-pushgateway:9091",
    job_name: str = "data-sync"
) -> Dict[str, Any]:
    """Main data synchronization flow"""
    logger = get_run_logger()
    start_time = time.time()
    
    try:
        # Trigger Airbyte sync
        job_id = await trigger_airbyte_sync(connection_id, airbyte_url)

        # Wait for completion
        job_result = await wait_for_sync_completion(job_id, airbyte_url)

        # Run DuckDB import if sync succeeded
        if job_result["job"]["status"] == "succeeded":
            run_duckdb_import(db_path, sql_script)
            status = "success"
        else:
            status = "failed"
            logger.error(f"Sync failed: {job_result}")

        # Run data quality validation
        ge_stats = run_ge_validation()
        logger.info(f"GE stats: {json.dumps(ge_stats)[:400]}")

        # Push metrics
        duration = time.time() - start_time
        push_metrics(prometheus_gateway, job_name, status, duration)

        return {"status": status, "job_id": job_id, "duration": duration, "ge": ge_stats}

    except Exception as e:
        logger.error(f"Flow failed: {e}")
        duration = time.time() - start_time
        push_metrics(prometheus_gateway, job_name, "error", duration)
        raise


if __name__ == "__main__":
    asyncio.run(data_sync_flow("your-connection-id"))