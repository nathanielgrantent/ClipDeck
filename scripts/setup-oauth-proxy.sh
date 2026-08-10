#!/bin/bash
# Setup ClipDeck OAuth Proxy (one-time)
# Creates a fixed URL that redirects OAuth callbacks to your current tunnel
#
# Prerequisites:
#   1. Free Cloudflare account: https://dash.cloudflare.com/sign-up
#   2. npm install -g wrangler
#   3. wrangler login (authenticates with Cloudflare)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROXY_DIR="$SCRIPT_DIR/../infra/oauth-proxy"

echo "=== ClipDeck OAuth Proxy Setup ==="
echo ""

# Check wrangler
if ! command -v wrangler &>/dev/null; then
  echo "Installing wrangler..."
  npm install -g wrangler
fi

# Check auth
echo "[1/4] Checking Cloudflare authentication..."
if ! wrangler whoami &>/dev/null 2>&1; then
  echo "  Not authenticated. Opening browser for login..."
  wrangler login
fi
echo "  Authenticated ✓"

# Create KV namespace
echo "[2/4] Creating KV namespace for OAuth proxy..."
cd "$PROXY_DIR"
KV_OUTPUT=$(wrangler kv namespace create OAUTH_KV 2>&1)
echo "$KV_OUTPUT"

# Extract KV ID
KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+')
if [ -z "$KV_ID" ]; then
  echo "ERROR: Failed to create KV namespace"
  exit 1
fi
echo "  KV ID: $KV_ID"

# Update wrangler.toml with real KV ID
sed -i "s/REPLACE_WITH_YOUR_KV_NAMESPACE_ID/$KV_ID/" wrangler.toml
echo "  Updated wrangler.toml ✓"

# Deploy worker
echo "[3/4] Deploying OAuth proxy worker..."
wrangler deploy
echo "  Deployed ✓"

# Get worker URL
WORKER_NAME=$(grep '^name' wrangler.toml | cut -d'"' -f2)
WORKER_URL="https://${WORKER_NAME}.workers.dev"
echo "  Worker URL: $WORKER_URL"

# Set initial target (current tunnel URL)
echo "[4/4] Setting initial target URL..."
TUNNEL_URL=$(grep -oP 'AUTH_URL="\K[^"]+' "$SCRIPT_DIR/../apps/web/.env" || true)
if [ -n "$TUNNEL_URL" ]; then
  wrangler kv key put --binding=OAUTH_KV --remote target-url "$TUNNEL_URL"
  echo "  Target: $TUNNEL_URL ✓"
else
  echo "  WARNING: No AUTH_URL found in .env. Run scripts/restart-tunnel.sh first."
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Worker URL: $WORKER_URL"
echo ""
echo "Register these ONE TIME in your OAuth consoles:"
echo ""
echo "Google (https://console.cloud.google.com/apis/credentials):"
echo "  $WORKER_URL/api/auth/callback/google"
echo ""
echo "Discord (https://discord.com/developers/applications):"
echo "  $WORKER_URL/api/auth/callback/discord"
echo ""
echo "After registering, update your .env:"
echo "  AUTH_URL=\"$WORKER_URL\""
echo "  NEXT_PUBLIC_APP_URL=\"(your tunnel URL)\""
echo ""
