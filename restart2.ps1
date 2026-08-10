Stop-Process -Id 25304 -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"C:\Users\snipe\OneDrive\Documents\Default Project\run-tunnel2.bat`"" -WindowStyle Hidden
Start-Sleep -Seconds 15
Get-Content "C:\Users\snipe\OneDrive\Documents\Default Project\tunnel-url.txt" -ErrorAction SilentlyContinue
