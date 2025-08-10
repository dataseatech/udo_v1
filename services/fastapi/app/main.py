from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import httpx
from .ai_sql import router as ai_sql_router  # registers /ai-sql endpoint
from .instrumentation import router as instrumentation_router
import jwt
from jwt import PyJWKClient

# Simple OIDC validation (Keycloak) - minimal
OIDC_ISSUER = os.getenv("OIDC_ISSUER", "http://keycloak:8080/realms/master")
OIDC_AUDIENCE = os.getenv("OIDC_AUDIENCE", "account")
JWK_URL = f"{OIDC_ISSUER}/protocol/openid-connect/certs"
jwk_client = PyJWKClient(JWK_URL)
http_bearer = HTTPBearer(auto_error=False)

def verify_token(creds: HTTPAuthorizationCredentials = Depends(http_bearer)):
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = creds.credentials
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token).key
        payload = jwt.decode(token, signing_key, algorithms=["RS256"], audience=OIDC_AUDIENCE, options={"verify_exp": True})
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

PREFECT_API_URL = os.getenv("PREFECT_API_URL", "http://prefect:4200/api")
AIRBYTE_API_URL = os.getenv("AIRBYTE_URL", "http://airbyte-server:8001/api/v1")
DEFAULT_CONNECTION_ID = os.getenv("AIRBYTE_CONNECTION_ID", "")

app = FastAPI(title="UDO API", version="0.1.0")
app.include_router(ai_sql_router)
app.include_router(instrumentation_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/trigger-sync")
async def trigger_sync(connection_id: str | None = None):
    cid = connection_id or DEFAULT_CONNECTION_ID
    if not cid:
        raise HTTPException(status_code=400, detail="connection_id required")
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{AIRBYTE_API_URL}/connections/sync", json={"connectionId": cid})
        if r.status_code >= 400:
            raise HTTPException(status_code=500, detail=f"Airbyte error: {r.text}")
        data = r.json()
    return {"triggered": True, "airbyte_response": data}


@app.get("/secure-info")
async def secure_info(user=Depends(verify_token)):
    return {"message": "secured", "sub": user.get("sub"), "preferred_username": user.get("preferred_username")}
