@echo off
echo Checking service status...
docker-compose ps

echo.
echo ===========================================
echo SERVICE CREDENTIALS
echo ===========================================
echo.
echo PostgreSQL (udo-postgres):
echo   Host: localhost:5432
echo   User: udo
echo   Password: udo_pass
echo   Database: udo_db
echo.
echo MinIO:
echo   Console: http://localhost:9001
echo   User: minioadmin
echo   Password: minioadmin
echo.
echo Keycloak:
echo   URL: http://localhost:8080
echo   Admin: admin
echo   Password: admin
echo.
echo Grafana:
echo   URL: http://localhost:3000
echo   User: admin
echo   Password: admin
echo.
echo Prefect:
echo   URL: http://localhost:4200
echo.
echo Airbyte:
echo   URL: http://localhost:8000
echo.
echo OpenMetadata:
echo   URL: http://localhost:8585
echo   MySQL User: openmetadata_user
echo   MySQL Password: openmetadata_password
echo.
echo Vault:
echo   URL: http://localhost:8200
echo   Token: root
echo.
echo ===========================================