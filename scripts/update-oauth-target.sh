#!/bin/bash
# Update OAuth proxy target URL (called by restart-tunnel.sh)
# Usage: scripts/update-oauth-target.sh https://new-tunnel-url.trycloudflare.com

set -e

NEW_URL="$1"
PROXY_DIR="$(cd "$(dirname "$0")/../infra/oauth-proxy" && pwd)"

if [ -z "$NEW_URL" ]; then
  echo "Usage: $0 <new-tunnel-url>"
  exit 1
fi

echo "Updating OAuth proxy target to: $NEW_URL"

cd "$PROXY_DIR"
wrangler kv key put --binding=OAUTH_KV --remote target-url "$NEW_URL"

echo "OAuth proxy updated ✓"
echo "All OAuth callbacks will now redirect to: $NEW_URL"
