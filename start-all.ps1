# Kill all node and cloudflared processes, start fresh
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Start Next.js dev server
$nextDir = "C:\Users\snipe\OneDrive\Documents\Default Project\apps\web"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$nextDir`" && npx next dev --port 3000" -WindowStyle Hidden
Start-Sleep -Seconds 20

# Verify Next.js is up
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 30
    Write-Host "Next.js is UP - Status: $($response.StatusCode)"
} catch {
    Write-Host "Next.js FAILED: $_"
    exit 1
}

# Start cloudflared tunnel
$cfPath = "C:\Users\snipe\OneDrive\Documents\Default Project\cloudflared.exe"
Start-Process -FilePath $cfPath -ArgumentList "tunnel --url http://localhost:3000" -RedirectStandardOutput "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stdout.log" -RedirectStandardError "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stderr.log"
Start-Sleep -Seconds 15

# Read tunnel output
Write-Host "`n=== Cloudflared stdout ==="
Get-Content "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stdout.log" -ErrorAction SilentlyContinue
Write-Host "`n=== Cloudflared stderr ==="
Get-Content "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stderr.log" -ErrorAction SilentlyContinue
