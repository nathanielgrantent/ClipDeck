# Kill old cloudflared
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Start fresh tunnel
$cfPath = "C:\Users\snipe\OneDrive\Documents\Default Project\cloudflared.exe"
Start-Process -FilePath $cfPath -ArgumentList "tunnel --url http://localhost:3000" -RedirectStandardOutput "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stdout.log" -RedirectStandardError "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stderr.log"
Start-Sleep -Seconds 15

# Show output
Write-Host "=== stdout ==="
Get-Content "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stdout.log" -ErrorAction SilentlyContinue
Write-Host "`n=== stderr (last 20 lines) ==="
Get-Content "C:\Users\snipe\OneDrive\Documents\Default Project\cf-stderr.log" -Tail 20 -ErrorAction SilentlyContinue
