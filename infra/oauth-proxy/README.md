# ClipDeck OAuth Proxy

A free Cloudflare Worker that gives you a **permanent OAuth callback URL** that always redirects to your current tunnel.

## Why?

Cloudflare quick tunnels give you a free URL, but it changes on restart. Google and Discord don't have APIs to auto-update redirect URIs. This worker solves that:

1. You register the worker URL ONCE in Google/Discord
2. The worker always redirects to your current tunnel URL
3. When the tunnel restarts, the worker auto-updates (via restart-tunnel.sh)

## Setup (one-time, ~5 minutes)

### Prerequisites
- Free Cloudflare account: https://dash.cloudflare.com/sign-up
- Node.js installed

### Steps

```bash
# 1. Install wrangler (Cloudflare CLI)
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Run the setup script
scripts/setup-oauth-proxy.sh
```

The script will:
- Create a KV namespace for storing the target URL
- Deploy the worker
- Give you the fixed callback URL

### Register the fixed URL (one time)

Go to your OAuth consoles and add the worker URL:

**Google** (https://console.cloud.google.com/apis/credentials):
```
https://clipdeck-oauth-proxy.workers.dev/callback/google
```

**Discord** (https://discord.com/developers/applications → OAuth2 → Redirects):
```
https://clipdeck-oauth-proxy.workers.dev/callback/discord
```

### Update your .env

```bash
# Set AUTH_URL to the worker URL (so OAuth uses the fixed callback)
AUTH_URL="https://clipdeck-oauth-proxy.workers.dev"

# Keep NEXT_PUBLIC_APP_URL as your tunnel URL (for serving the app)
NEXT_PUBLIC_APP_URL="https://your-current-tunnel.trycloudflare.com"
```

## How It Works

```
User clicks "Sign in with Google"
  → App redirects to Google with redirect_uri=https://clipdeck-oauth-proxy.workers.dev/callback/google
  → Google authenticates user
  → Google redirects to https://clipdeck-oauth-proxy.workers.dev/callback/google?code=...&state=...
  → Worker reads current tunnel URL from KV
  → Worker redirects to https://your-current-tunnel.trycloudflare.com/api/auth/callback/google?code=...&state=...
  → App receives callback and completes sign-in
```

## When Tunnel URL Changes

Just run the restart script:
```bash
scripts/restart-tunnel.sh
```

It automatically:
1. Starts a new tunnel with a new URL
2. Updates .env with the new URL
3. Updates the OAuth proxy KV store with the new URL
4. Prints the new site URL

**No manual OAuth console updates needed!**

## Manual Target Update

If you need to update the target URL manually:
```bash
cd infra/oauth-proxy
wrangler kv key put --binding=OAUTH_KV target-url "https://new-tunnel-url.trycloudflare.com"
```

## Check Current Target

```bash
cd infra/oauth-proxy
wrangler kv key get --binding=OAUTH_KV target-url
```

## Cost

Free tier covers:
- Cloudflare Workers: 100,000 requests/day
- Cloudflare KV: 100,000 reads/day, 1,000 writes/day

This is more than enough for OAuth callbacks.
