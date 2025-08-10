#!/usr/bin/env bash
set -euo pipefail

echo "[Airbyte] Starting abctl install inside WSL..."

if ! command -v abctl >/dev/null 2>&1; then
  echo "abctl not found in PATH (inside WSL). Install Airbyte CLI (abctl) first." >&2
  exit 1
fi

FLAG=""
if abctl local install --help 2>&1 | grep -q -- '--migrate'; then
  FLAG="--migrate"
fi

if [[ -n "${ABCTL_FLAGS:-}" ]]; then
  FLAG="${ABCTL_FLAGS}"
fi

echo "[Airbyte] Using flag: ${FLAG:-<none>}"
set -x
abctl local install ${FLAG}
set +x

echo "[Airbyte] abctl install command invoked. (Check: abctl local status)"
