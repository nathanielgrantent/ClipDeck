# Kill old processes
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Start Next.js dev server
$nextDir = "C:\Users\snipe\OneDrive\Documents\Default Project\apps\web"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$nextDir`" && npx next dev --port 3000" -WindowStyle Hidden
Write-Host "Waiting for Next.js to start..."
Start-Sleep -Seconds 25

# Verify Next.js
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 30
    Write-Host "Next.js: OK ($($r.StatusCode))"
} catch {
    Write-Host "Next.js FAILED: $_"
    exit 1
}

# Start cloudflared
$cf = "C:\Users\snipe\OneDrive\Documents\Default Project\cloudflared.exe"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$cf`" tunnel --url http://localhost:3000 > `"C:\Users\snipe\OneDrive\Documents\Default Project\cf-url.log`" 2>&1"
Write-Host "Waiting for tunnel..."
Start-Sleep -Seconds 15

# Show URL
Write-Host "`n=== TUNNEL URL ==="
Select-String -Path "C:\Users\snipe\OneDrive\Documents\Default Project\cf-url.log" -Pattern "trycloudflare.com" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.Line }
