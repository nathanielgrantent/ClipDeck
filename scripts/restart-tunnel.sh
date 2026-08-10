#!/bin/bash
# Restart Cloudflare tunnel and update .env with new URL
# If OAuth proxy is set up, also updates the proxy target (no manual URI changes needed)
# Usage: bash scripts/restart-tunnel.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/apps/web/.env"
LOG_FILE="$PROJECT_DIR/cf-url.log"
CLOUDFLARED="$PROJECT_DIR/cloudflared.exe"
PROXY_DIR="$PROJECT_DIR/infra/oauth-proxy"

echo "=== ClipDeck Tunnel Manager ==="

# Kill existing cloudflared
echo "[1/5] Stopping existing tunnel..."
taskkill //f //im cloudflared.exe 2>/dev/null || true
sleep 2

# Clear old log
> "$LOG_FILE"

# Start new tunnel
echo "[2/5] Starting new tunnel..."
"$CLOUDFLARED" tunnel --url http://localhost:3001 > "$LOG_FILE" 2>&1 &
TUNNEL_PID=$!

# Wait for URL
echo "[3/5] Waiting for tunnel URL..."
NEW_URL=""
for i in $(seq 1 30); do
  sleep 1
  NEW_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_FILE" | tail -1 || true)
  if [ -n "$NEW_URL" ]; then
    break
  fi
done

if [ -z "$NEW_URL" ]; then
  echo "ERROR: Failed to get tunnel URL after 30 seconds"
  exit 1
fi

echo "   New URL: $NEW_URL"

# Update .env
echo "[4/5] Updating .env..."
sed -i "s|NEXT_PUBLIC_APP_URL=\"[^\"]*\"|NEXT_PUBLIC_APP_URL=\"$NEW_URL\"|g" "$ENV_FILE"
sed -i "s|AUTH_URL=\"[^\"]*\"|AUTH_URL=\"$NEW_URL\"|g" "$ENV_FILE"

# Update OAuth proxy if deployed
echo "[5/5] Checking OAuth proxy..."
if [ -f "$PROXY_DIR/wrangler.toml" ] && grep -q "kv_namespaces" "$PROXY_DIR/wrangler.toml" 2>/dev/null; then
  cd "$PROXY_DIR"
  wrangler kv key put --binding=OAUTH_KV --remote target-url "$NEW_URL" 2>/dev/null && {
    echo "   OAuth proxy updated ✓"
    WORKER_NAME=$(grep '^name' wrangler.toml | cut -d'"' -f2)
    echo "   Fixed OAuth URL: https://${WORKER_NAME}.workers.dev"
  } || {
    echo "   WARNING: Failed to update OAuth proxy"
  }
else
  echo "   OAuth proxy not deployed (run scripts/setup-oauth-proxy.sh first)"
fi

echo ""
echo "=== Done! ==="
echo ""
echo "Site URL: $NEW_URL"
echo ""
echo "If OAuth proxy is set up, no manual URI updates needed!"
echo "Otherwise, update these in your OAuth consoles:"
echo "  Google:  $NEW_URL/api/auth/callback/google"
echo "  Discord: $NEW_URL/api/auth/callback/discord"
echo ""
echo "Tunnel PID: $TUNNEL_PID"
