@echo off
REM Setup ClipDeck OAuth Proxy (one-time)
REM Creates a fixed URL that redirects OAuth callbacks to your current tunnel
REM
REM Prerequisites:
REM   1. Free Cloudflare account: https://dash.cloudflare.com/sign-up
REM   2. npm install -g wrangler
REM   3. wrangler login

set SCRIPT_DIR=%~dp0
set PROXY_DIR=%SCRIPT_DIR%..\infra\oauth-proxy

echo === ClipDeck OAuth Proxy Setup ===

REM Check wrangler
where wrangler >nul 2>&1
if errorlevel 1 (
    echo Installing wrangler...
    npm install -g wrangler
)

REM Check auth
echo [1/4] Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo   Not authenticated. Opening browser for login...
    wrangler login
)
echo   Authenticated

REM Create KV namespace
echo [2/4] Creating KV namespace...
cd /d "%PROXY_DIR%"
for /f "tokens=*" %%a in ('wrangler kv namespace create OAUTH_KV 2^>^&1') do (
    echo   %%a
    echo %%a | findstr /r "id = " >nul && (
        for /f tokens^=2 delims^=^" %%b in ("%%a") do set KV_ID=%%b
    )
)
echo   KV ID: %KV_ID%

REM Update wrangler.toml
powershell -Command "(Get-Content 'wrangler.toml') -replace 'REPLACE_WITH_YOUR_KV_NAMESPACE_ID', '%KV_ID%' | Set-Content 'wrangler.toml'"
echo   Updated wrangler.toml

REM Deploy
echo [3/4] Deploying...
wrangler deploy
echo   Deployed

REM Set target
echo [4/4] Setting target URL...
for /f "tokens=2 delims==" %%a in ('findstr "AUTH_URL" "%SCRIPT_DIR%..\apps\web\.env"') do set TUNNEL_URL=%%~a
if defined TUNNEL_URL (
    wrangler kv key put --binding=OAUTH_KV target-url "%TUNNEL_URL%"
    echo   Target: %TUNNEL_URL%
)

echo.
echo === Done ===
echo Worker URL: https://clipdeck-oauth-proxy.workers.dev
echo.
echo Register this ONE TIME in Google/Discord:
echo   Google:  https://clipdeck-oauth-proxy.workers.dev/api/auth/callback/google
echo   Discord: https://clipdeck-oauth-proxy.workers.dev/api/auth/callback/discord
echo.
