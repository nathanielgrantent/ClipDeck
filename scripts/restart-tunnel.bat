@echo off
REM Restart Cloudflare tunnel and update .env with new URL
REM If OAuth proxy is set up, also updates the proxy target (no manual URI changes needed)
REM Usage: scripts\restart-tunnel.bat

set PROJECT_DIR=%~dp0..
set ENV_FILE=%PROJECT_DIR%\apps\web\.env
set LOG_FILE=%PROJECT_DIR%\cf-url.log
set CLOUDFLARED=%PROJECT_DIR%\cloudflared.exe
set PROXY_DIR=%PROJECT_DIR%\infra\oauth-proxy

echo === ClipDeck Tunnel Manager ===

echo [1/5] Stopping existing tunnel...
taskkill /f /im cloudflared.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Starting new tunnel...
echo. > "%LOG_FILE%"
start /b "" "%CLOUDFLARED%" tunnel --url http://localhost:3001 > "%LOG_FILE%" 2>&1

echo [3/5] Waiting for tunnel URL...
set NEW_URL=
:WAIT_LOOP
timeout /t 1 /nobreak >nul
for /f "tokens=*" %%a in ('findstr /r "https://[a-z0-9-]*\.trycloudflare\.com" "%LOG_FILE%"') do (
    set NEW_URL=%%a
)
if "%NEW_URL%"=="" goto WAIT_LOOP

echo    New URL: %NEW_URL%

echo [4/5] Updating .env...
powershell -Command "(Get-Content '%ENV_FILE%') -replace 'NEXT_PUBLIC_APP_URL=\"[^\"]*\"', 'NEXT_PUBLIC_APP_URL=\"%NEW_URL%\"' -replace 'AUTH_URL=\"[^\"]*\"', 'AUTH_URL=\"%NEW_URL%\"' | Set-Content '%ENV_FILE%'"

echo [5/5] Checking OAuth proxy...
if exist "%PROXY_DIR%\wrangler.toml" (
    cd /d "%PROXY_DIR%"
    wrangler kv key put --binding=OAUTH_KV target-url "%NEW_URL%" >nul 2>&1 && (
        echo    OAuth proxy updated
        for /f "tokens=2 delims==" %%b in ('findstr "^name" wrangler.toml') do set WORKER_NAME=%%~b
        echo    Fixed OAuth URL: https://%WORKER_NAME%.workers.dev
    ) || (
        echo    WARNING: Failed to update OAuth proxy
    )
) else (
    echo    OAuth proxy not deployed (run scripts\setup-oauth-proxy.bat first)
)

echo.
echo === Done! ===
echo.
echo Site URL: %NEW_URL%
echo.
echo If OAuth proxy is set up, no manual URI updates needed!
echo.
