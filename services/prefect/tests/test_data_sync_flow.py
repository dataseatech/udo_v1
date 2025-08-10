import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
from flows.data_sync_flow import trigger_airbyte_sync, wait_for_sync_completion, run_duckdb_import
from flows.data_sync_flow import run_ge_validation
from flows.airbyte_to_duckdb import trigger_sync, wait_for_job


@pytest.mark.asyncio
async def test_trigger_airbyte_sync():
    """Test Airbyte sync trigger"""
    mock_response = MagicMock()
    mock_response.json.return_value = {"job": {"id": "test-job-id"}}
    mock_response.raise_for_status = MagicMock()
    
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)

        job_id = await trigger_airbyte_sync.fn("test-connection", "http://test-airbyte")
        assert job_id == "test-job-id"


@pytest.mark.asyncio
async def test_wait_for_sync_completion():
    """Test waiting for sync completion"""
    mock_response = MagicMock()
    mock_response.json.return_value = {"job": {"status": "succeeded"}}
    mock_response.raise_for_status = MagicMock()
    
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)

        result = await wait_for_sync_completion.fn("test-job", "http://test-airbyte")
        assert result["job"]["status"] == "succeeded"


def test_run_duckdb_import():
    """Test DuckDB import"""
    with patch("duckdb.connect") as mock_connect:
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn

        run_duckdb_import.fn("/tmp/test.db", "SELECT 1")
        mock_conn.execute.assert_called_once_with("SELECT 1")
        mock_conn.close.assert_called_once()

def test_ge_validation_smoke():
    """Test GE validation"""
    # Expect graceful failure if GE context not available in test env
    stats = run_ge_validation.fn(ge_root="/nonexistent/ge")
    assert isinstance(stats, dict)


@pytest.mark.asyncio
async def test_trigger_sync_and_wait_for_job():
    mock_trigger_resp = MagicMock()
    mock_trigger_resp.json.return_value = {"job": {"id": "abc123"}}
    mock_trigger_resp.raise_for_status = MagicMock()

    mock_status_resp = MagicMock()
    mock_status_resp.json.return_value = {"job": {"status": "succeeded"}}
    mock_status_resp.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client:
        instance = mock_client.return_value.__aenter__.return_value
        instance.post = AsyncMock(return_value=mock_trigger_resp)
        instance.get = AsyncMock(return_value=mock_status_resp)

        job_id = await trigger_sync.fn("conn", "http://airbyte")
        assert job_id == "abc123"
        data = await wait_for_job.fn(job_id, "http://airbyte", max_wait=5)
        assert data["job"]["status"].lower() == "succeeded"