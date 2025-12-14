#!/usr/bin/env bash
set -e

echo "=== SidMail Production Deploy ==="

APP_DIR="/client/SidMail"
COMPOSE_FILE="docker-compose.prod.yml"

cd "$APP_DIR"

echo "[1/6] Fetching latest code"
git fetch origin
git reset --hard origin/main
git clean -fd

echo "[2/6] Stopping containers"
docker compose -f "$COMPOSE_FILE" down

echo "[3/6] Building containers (no cache)"
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "[4/6] Starting containers"
docker compose -f "$COMPOSE_FILE" up -d

echo "[5/6] Checking containers"
docker ps

echo "[6/6] Deployment complete"
