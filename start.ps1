Write-Host "[Airbyte] Installing (abctl)" -ForegroundColor Cyan
wsl abctl local install --low-resource-mode
docker-compose down
Write-Host "[Compose] Up (includes airbyte-proxy)" -ForegroundColor Cyan
docker-compose up -d
