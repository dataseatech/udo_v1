from datetime import datetime
import pandas as pd
from feast import Entity, FeatureView, Field
from feast.types import Int64, Float64
from feast import FileSource

# Offline source (placeholder CSV later produced from DuckDB)
products_metrics_source = FileSource(
    path="/workspace/samples/products_metrics.csv",
    timestamp_field=None,
)

product = Entity(name="product_id", join_keys=["product_id"])

products_metrics_view = FeatureView(
    name="product_metrics",
    entities=[product],
    ttl=None,
    schema=[
        Field(name="roi", dtype=Float64),
        Field(name="revenue", dtype=Int64),
        Field(name="cost", dtype=Int64),
    ],
    online=True,
    source=products_metrics_source,
)
