$procs = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like '*bv_chrome_profiles*' }
foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Host "Killed $($procs.Count) temp chrome processes."
