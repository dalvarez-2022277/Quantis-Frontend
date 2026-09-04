#!/usr/bin/env bash
# Builds the frontend image for the Orange Pi (linux/arm64) using the values
# in the local .env (production config), ships only the image (no source)
# to the server, and restarts the container there.
#
# Usage: ./deploy-to-server.sh [host] [remote_dir]
# Defaults match the current home server (see ~/.ssh/config for the
# "orangepi" alias and key-based auth).
set -euo pipefail

REMOTE="${1:-orangepi}"
REMOTE_DIR="${2:-/home/orangepi/quantis/Quantis-Frontend}"
IMAGE="quantis-frontend-web:latest"
TARBALL="quantis-frontend-web.tar.gz"

echo "==> Building $IMAGE for linux/arm64 (VITE_* baked from local .env)"
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker compose build web

echo "==> Saving image to $TARBALL"
docker save "$IMAGE" | gzip > "$TARBALL"

echo "==> Copying image to $REMOTE"
scp "$TARBALL" "$REMOTE:/tmp/$TARBALL"

echo "==> Loading image and restarting container on $REMOTE"
ssh "$REMOTE" "docker load -i /tmp/$TARBALL && rm -f /tmp/$TARBALL && cd '$REMOTE_DIR' && docker compose up -d web"

echo "==> Cleaning up local tarball"
rm -f "$TARBALL"

echo "==> Done. The web container was updated without touching its source tree."
