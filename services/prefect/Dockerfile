FROM python:3.11-slim

WORKDIR /app

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy tests early to install test requirements
COPY tests/ tests/
RUN if [ -f tests/requirements.txt ]; then pip install --no-cache-dir -r tests/requirements.txt; fi
RUN pip install --no-cache-dir pytest pytest-asyncio

# Copy source code and tests
COPY flows/ flows/

# Default command: start Prefect server (for local orchestration + UI)
EXPOSE 4200
CMD ["prefect", "server", "start", "--host", "0.0.0.0", "--port", "4200"]