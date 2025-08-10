import os
import duckdb
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pathlib

PRODUCTS_METRICS_CSV = os.getenv("PRODUCTS_METRICS_CSV", "/app/samples/products_metrics.csv")

router = APIRouter()

DUCKDB_PATH = os.getenv("DUCKDB_PATH", ":memory:")


class QueryRequest(BaseModel):
    q: str


@router.post("/ai-sql")
def ai_sql(req: QueryRequest):
    question = req.q.lower()
    if "top" in question and "roi" in question:
        sql = (
            "SELECT product_id, roi FROM products ORDER BY roi DESC LIMIT 5"
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported query in demo")

    con = duckdb.connect(DUCKDB_PATH)
    try:
        # Lazily load metrics CSV into DuckDB if not already.
        tables = [t[0] for t in con.execute("show tables").fetchall()]
        if "products" not in tables:
            if not pathlib.Path(PRODUCTS_METRICS_CSV).exists():
                raise HTTPException(status_code=500, detail="Products metrics CSV missing")
            con.execute(f"CREATE TABLE products AS SELECT * FROM read_csv_auto('{PRODUCTS_METRICS_CSV}')")
        results = con.execute(sql).fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DuckDB error: {e}")
    return {"sql": sql, "results": results}
