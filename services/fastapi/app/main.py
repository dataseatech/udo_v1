from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import httpx
from urllib.parse import urlencode
import base64, hashlib, secrets
from .ai_sql import router as ai_sql_router  # registers AI SQL endpoints
from .instrumentation import init_instrumentation
import jwt
from jwt import PyJWKClient

# Simple OIDC validation (Keycloak) - minimal
OIDC_ISSUER = os.getenv("OIDC_ISSUER", "http://keycloak:8080/realms/master")
OIDC_PUBLIC_ISSUER = os.getenv("OIDC_PUBLIC_ISSUER", OIDC_ISSUER)
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
        # Be permissive on audience for local dev; tokens from Keycloak often use different audiences
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False},
        )
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

PREFECT_API_URL = os.getenv("PREFECT_API_URL", "http://prefect:4200/api")
AIRBYTE_API_URL = os.getenv("AIRBYTE_URL", "http://airbyte-server:8001/api/v1")
DEFAULT_CONNECTION_ID = os.getenv("AIRBYTE_CONNECTION_ID", "")

OPENMETADATA_HOST = os.getenv("OPENMETADATA_HOST", "openmetadata-server")
OPENMETADATA_PORT = os.getenv("OPENMETADATA_PORT", "8585")
OPENMETADATA_BASE = f"http://{OPENMETADATA_HOST}:{OPENMETADATA_PORT}"

# Default the client ID to "udo" to match common local dev setups; override via env var when using a different client
OIDC_CLIENT_ID = os.getenv("OIDC_CLIENT_ID", "udo")
OIDC_CLIENT_SECRET = os.getenv("OIDC_CLIENT_SECRET", "")
OIDC_REDIRECT_URI = os.getenv("OIDC_REDIRECT_URI", "")
OIDC_TOKEN_ENDPOINT = f"{OIDC_ISSUER}/protocol/openid-connect/token"

app = FastAPI(title="UDO API", version="0.1.0")
app.include_router(ai_sql_router, prefix="/api/v1")
init_instrumentation(app)


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/auth/start-login")
async def start_login(
    request: Request,
    use_pkce: bool = True,
    redirect_uri: str | None = None,
    client_id: str | None = None,
):
    issuer_for_browser = OIDC_PUBLIC_ISSUER or OIDC_ISSUER
    incoming_host = request.headers.get("host", "localhost:3000")
    # Try to infer the frontend origin from Referer; fall back to env or host
    referer = request.headers.get("referer") or request.headers.get("origin")
    frontend_origin = None
    if referer:
        try:
            from urllib.parse import urlparse
            p = urlparse(referer)
            frontend_origin = f"{p.scheme}://{p.netloc}"
        except Exception:
            frontend_origin = None
    runtime_base = f"http://{incoming_host}"
    # Allow explicit redirect_uri override via query param. Otherwise prefer the
    # actual frontend origin detected from the browser, then env var, then backend host
    redirect_uri = redirect_uri or frontend_origin or OIDC_REDIRECT_URI or runtime_base
    # Fallback: if issuer still references internal docker hostname 'keycloak' but browser host is localhost, rewrite for dev UX.
    if "keycloak" in issuer_for_browser and incoming_host.startswith("localhost"):
        issuer_for_browser = issuer_for_browser.replace("keycloak", "localhost")
    params = {
        "client_id": client_id or OIDC_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email"
    }
    code_verifier = None
    if use_pkce:
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip('=')
        digest = hashlib.sha256(code_verifier.encode()).digest()
        code_challenge = base64.urlsafe_b64encode(digest).decode().rstrip('=')
        params["code_challenge"] = code_challenge
        params["code_challenge_method"] = "S256"
    # Store verifier in a simple cookie for dev (replace with server session in prod)
    resp = Response(status_code=302)
    resp.headers["Location"] = f"{issuer_for_browser}/protocol/openid-connect/auth?{urlencode(params)}"
    if code_verifier:
        resp.set_cookie("pkce_verifier", code_verifier, httponly=False, secure=False, max_age=300)
    return resp


@app.get("/api/auth/me")
async def auth_me(user=Depends(verify_token)):
    return user


@app.get("/api/auth/callback")
async def auth_callback(code: str | None = None, request: Request = None, redirect_uri: str | None = None):
    if not code:
        raise HTTPException(status_code=400, detail="code required")
    # If the frontend passes redirect_uri, prefer it. Else fallback to env or request base_url
    effective_redirect_uri = redirect_uri or OIDC_REDIRECT_URI
    if not effective_redirect_uri and request is not None:
        effective_redirect_uri = str(request.base_url).rstrip('/')

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": effective_redirect_uri,
        "client_id": OIDC_CLIENT_ID,
    }
    # PKCE support
    if request is not None:
        verifier = request.cookies.get("pkce_verifier")
        if verifier:
            data["code_verifier"] = verifier
    if OIDC_CLIENT_SECRET:
        data["client_secret"] = OIDC_CLIENT_SECRET
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    # Ensure we call the browser-accessible issuer if we're in docker with internal hostname
    token_endpoint = OIDC_TOKEN_ENDPOINT
    if "keycloak" in token_endpoint and (OIDC_PUBLIC_ISSUER and "localhost" in OIDC_PUBLIC_ISSUER):
        token_endpoint = token_endpoint.replace("keycloak", "localhost")
    async with httpx.AsyncClient() as client:
        r = await client.post(token_endpoint, data=data, headers=headers)
        if r.status_code >= 400:
            raise HTTPException(status_code=500, detail=f"token exchange failed: {r.text}")
        tokens = r.json()
    # Don't store server-side; return to frontend (dev). Consider HttpOnly cookie for production.
    return {"access_token": tokens.get("access_token"), "refresh_token": tokens.get("refresh_token"), "id_token": tokens.get("id_token")}


@app.get("/api/auth/logout")
async def auth_logout():
    # Frontend can redirect to Keycloak end-session endpoint
    end_session = f"{OIDC_ISSUER}/protocol/openid-connect/logout"
    return {"logout": True, "end_session_endpoint": end_session}


@app.api_route("/openmetadata/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def openmetadata_proxy(full_path: str, request: Request):
    method = request.method
    url = f"{OPENMETADATA_BASE}/{full_path}"
    async with httpx.AsyncClient() as client:
        body = await request.body()
        headers = {k:v for k,v in request.headers.items() if k.lower() not in {"host", "content-length"}}
        r = await client.request(method, url, content=body, headers=headers, params=dict(request.query_params))
        return Response(status_code=r.status_code, content=r.content, headers={"content-type": r.headers.get("content-type", "application/json")})


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
