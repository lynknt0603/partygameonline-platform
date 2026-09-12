$wshell = New-Object -ComObject WScript.Shell
$success = $wshell.AppActivate("Party Game Online")
Write-Host "AppActivate 'Party Game Online' result: $success"
