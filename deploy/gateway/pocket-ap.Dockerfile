# pocket-ap with Akashi's listener config baked in (no secrets: the app key comes from POCKET_APP_PRIVATE_KEY at
# runtime). Built by Coolify from the repo root: Dockerfile location /deploy/gateway/pocket-ap.Dockerfile.
FROM ghcr.io/pokt-network/pocket-ap:v0.1.2
COPY deploy/gateway/pocket-ap.yaml /config/pocket-ap.yaml
EXPOSE 8550
ENTRYPOINT ["/pocket-ap"]
CMD ["serve", "--config", "/config/pocket-ap.yaml"]
