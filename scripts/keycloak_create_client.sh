#!/bin/sh
# Automated Keycloak client creation (development only) using kcadm.
# Requires running Keycloak dev container (admin/admin) and embedded kcadm.sh.
# Usage (from repo root): sh scripts/keycloak_create_client.sh

set -e
KC_CONTAINER=${KC_CONTAINER:-$(docker ps --format '{{.Names}}' | grep keycloak | head -1)}
REALM=${REALM:-master}
CLIENT_ID=${CLIENT_ID:-udo}
# Redirect URI now points to backend (adjust if external frontend repo runs on another origin)
REDIRECT_URI=${REDIRECT_URI:-http://localhost:8800/*}
WEB_ORIGIN=${WEB_ORIGIN:-http://localhost:8800}

if [ -z "$KC_CONTAINER" ]; then
  echo "Keycloak container not found" >&2
  exit 1
fi

echo "Using Keycloak container: $KC_CONTAINER"

docker exec "$KC_CONTAINER" /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

EXISTS=$(docker exec "$KC_CONTAINER" /opt/keycloak/bin/kcadm.sh get clients -r "$REALM" -q clientId=$CLIENT_ID --fields id --format csv --noquotes | tail -1 || true)
if [ -n "$EXISTS" ]; then
  echo "Client $CLIENT_ID exists: updating redirectUris and webOrigins"
  docker exec "$KC_CONTAINER" /opt/keycloak/bin/kcadm.sh update clients/$EXISTS -r "$REALM" -s "redirectUris=[\"$REDIRECT_URI\"]" -s "webOrigins=[\"$WEB_ORIGIN\"]"
else
  echo "Creating client $CLIENT_ID"
  docker exec "$KC_CONTAINER" /opt/keycloak/bin/kcadm.sh create clients -r "$REALM" \
    -s clientId="$CLIENT_ID" \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=false \
    -s implicitFlowEnabled=false \
    -s "redirectUris=[\"$REDIRECT_URI\"]" \
    -s "webOrigins=[\"$WEB_ORIGIN\"]"
fi

echo "Done."
