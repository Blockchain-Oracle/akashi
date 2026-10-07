#!/bin/sh
# Copy the RelayMiner configs (no secrets) to the server: Coolify deploys only compose.yaml, so the stack mounts
# them from /opt/pocket/config by absolute path, next to /opt/pocket/secrets/supplier-keys.yaml.
#   deploy/pocket/sync-config.sh [ssh-host]   (default agari-box), then redeploy the stack in Coolify
set -eu
HOST="${1:-agari-box}"
DIR="$(cd "$(dirname "$0")" && pwd)"
tar czf - -C "$DIR" miner-config.yaml relayer-config.yaml | \
  ssh "$HOST" 'mkdir -p /opt/pocket/config && tar xzf - -C /opt/pocket/config && chown 1000:1000 /opt/pocket/config/*.yaml && chmod 0444 /opt/pocket/config/*.yaml && ls -l /opt/pocket/config'
