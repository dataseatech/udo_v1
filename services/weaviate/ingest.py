import os
import weaviate
import pandas as pd
from sentence_transformers import SentenceTransformer

WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8085")
PRODUCTS_CSV = os.getenv("PRODUCTS_CSV", "/data/products.csv")
CLASS_NAME = "ProductDoc"

client = weaviate.Client(WEAVIATE_URL)
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def ensure_schema():
    if not client.schema.exists(CLASS_NAME):
        client.schema.create_class({
            "class": CLASS_NAME,
            "vectorizer": "none",
            "properties": [
                {"name": "product_id", "dataType": ["text"]},
                {"name": "description", "dataType": ["text"]},
                {"name": "category", "dataType": ["text"]},
            ]
        })


def ingest():
    df = pd.read_csv(PRODUCTS_CSV)
    with client.batch as batch:
        batch.batch_size=32
        for _, row in df.iterrows():
            text = f"{row['product_id']} {row['description']} {row.get('category','')}"
            vec = model.encode(text).tolist()
            client.batch.add_data_object({
                "product_id": str(row['product_id']),
                "description": row['description'],
                "category": row.get('category','')
            }, CLASS_NAME, vector=vec)

if __name__ == "__main__":
    ensure_schema()
    ingest()
    print("Weaviate ingestion completed")
