Get-Process | Where-Object {$_.ProcessName -like '*cloudflare*' -or $_.ProcessName -like '*tunnel*'} | Select-Object Id,ProcessName
