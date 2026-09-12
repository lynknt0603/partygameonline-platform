$shell = New-Object -ComObject Shell.Application
$shell.ShellExecute("c:\Users\HUNG\.kiro\crew\workspace\boardgames\run-6-players.bat", "", "c:\Users\HUNG\.kiro\crew\workspace\boardgames", "open", 1)
Write-Host "Triggered run-6-players.bat via ShellExecute"
