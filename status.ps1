# Check what's running
Write-Host "=== Checking processes ==="
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Select-Object Id,StartTime
Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id,ProcessName | Format-Table

# Verify Next.js is up
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    Write-Host "Next.js: $($r.StatusCode)"
} catch {
    Write-Host "Next.js: DOWN - $_"
}
