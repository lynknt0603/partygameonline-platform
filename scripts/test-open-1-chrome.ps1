$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$profile = Join-Path $env:TEMP "bv_chrome_1"
$url = "http://localhost:5173/play/demo-blood-bound"

$p = Start-Process -FilePath $chrome -ArgumentList @(
    "--no-sandbox",
    "--user-data-dir=$profile",
    "--window-position=0,0",
    "--window-size=800,600",
    "--no-first-run",
    "--no-default-browser-check",
    $url
) -PassThru

Write-Host "Started PID: $($p.Id)"
Start-Sleep -Seconds 3
Write-Host "After 3s HasExited: $($p.HasExited)"
