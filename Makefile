build:
	docker-compose build

up:
	docker-compose up --build

down:
	docker-compose down

test:
	docker run --rm -v $(CURDIR)/services/prefect:/app udo/prefect pytest tests/ && \
	docker run --rm -v $(CURDIR)/services/fastapi:/app udo/fastapi pytest tests/

lint:
	docker run --rm -v $(CURDIR):/repo python:3.11-slim bash -c "pip install flake8 black && flake8 && black --check ."

# --- Airbyte (abctl) automation ---
# Note: Run these inside WSL/Linux shell where abctl is installed and Docker Desktop is running.
# If values.yaml or secrets.yaml exist under infra/airbyte/, they will be used instead of --migrate.
ABCTL?=abctl
AIRBYTE_VALUES?=infra/airbyte/values.yaml
AIRBYTE_SECRETS?=infra/airbyte/secrets.yaml

airbyte-install:
	@if [ -f $(AIRBYTE_VALUES) ] && [ -f $(AIRBYTE_SECRETS) ]; then \
	  echo "Installing Airbyte with custom values/secrets"; \
	  $(ABCTL) local install --values $(AIRBYTE_VALUES) --secret $(AIRBYTE_SECRETS); \
	else \
	  echo "Installing Airbyte with migrate flag (fallback)"; \
	  $(ABCTL) local install --migrate; \
	fi

airbyte-status:
	$(ABCTL) local status

airbyte-uninstall:
	$(ABCTL) local uninstall

airbyte-reinstall: airbyte-uninstall airbyte-install

airbyte-open:
	@python - <<'EOF'
import webbrowser, time
time.sleep(1)
webbrowser.open('http://localhost:8000')
EOF
