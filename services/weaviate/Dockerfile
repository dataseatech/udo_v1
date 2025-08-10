FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir weaviate-client==4.5.4 pandas==2.2.2 sentence-transformers==2.6.1
COPY ingest.py ingest.py
CMD ["python", "ingest.py"]
