Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like '*bv_chrome_profiles*' } | Select-Object ProcessId, CommandLine | Format-List
