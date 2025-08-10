import requests
import json
import os

AIRBYTE_URL = os.getenv("AIRBYTE_URL", "http://localhost:8001/api/v1")

# Source: MinIO CSV
source_config = {
    "name": "minio-csv-source",
    "sourceDefinitionId": "b2e713cd-cc70-4c0a-bb70-1a1f7b5a6c5e",  # Example: CSV source
    "workspaceId": "default",
    "connectionConfiguration": {
        "endpoint": "http://minio:9000",
        "access_key_id": os.getenv("MINIO_ROOT_USER", "minioadmin"),
        "secret_access_key": os.getenv("MINIO_ROOT_PASSWORD", "minioadmin"),
        "bucket": "udo-csv",
        "path": "sample.csv"
    }
}

# Destination: Postgres
postgres_config = {
    "name": "udo-postgres-dest",
    "destinationDefinitionId": "25c5221d-dce2-4163-ade9-739ef8fd4d7e",  # Example: Postgres destination
    "workspaceId": "default",
    "connectionConfiguration": {
        "host": "udo-postgres",
        "port": 5432,
        "username": os.getenv("POSTGRES_USER", "udo"),
        "password": os.getenv("POSTGRES_PASSWORD", "udo_pass"),
        "database": os.getenv("POSTGRES_DB", "udo_db"),
        "ssl": False
    }
}

def create_source():
    resp = requests.post(f"{AIRBYTE_URL}/sources/create", json=source_config)
    print("Source response:", resp.json())
    return resp.json().get("sourceId")

def create_destination():
    resp = requests.post(f"{AIRBYTE_URL}/destinations/create", json=postgres_config)
    print("Destination response:", resp.json())
    return resp.json().get("destinationId")

def create_connection(source_id, destination_id):
    connection_config = {
        "sourceId": source_id,
        "destinationId": destination_id,
        "name": "minio-csv-to-postgres",
        "syncCatalog": {},  # Should be filled with discovered schema
        "status": "active"
    }
    resp = requests.post(f"{AIRBYTE_URL}/connections/create", json=connection_config)
    print("Connection response:", resp.json())
    return resp.json().get("connectionId")

if __name__ == "__main__":
    src_id = create_source()
    dst_id = create_destination()
    conn_id = create_connection(src_id, dst_id)
    print(f"Connection created: {conn_id}")
