# pocket-ap with Akashi's listener config baked in (no secrets: the app key comes from POCKET_APP_PRIVATE_KEY at
# runtime). Built by Coolify from the repo root: Dockerfile location /deploy/gateway/pocket-ap.Dockerfile.
# The upstream image (FROM scratch, uid 65534) runs `/pocket-ap serve -config /etc/pocket-ap/config.yaml`.
FROM ghcr.io/pokt-network/pocket-ap:v0.1.2
COPY deploy/gateway/pocket-ap.yaml /etc/pocket-ap/config.yaml
EXPOSE 8550
