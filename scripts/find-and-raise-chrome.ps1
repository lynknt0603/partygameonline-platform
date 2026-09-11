Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinSearch {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}
"@

$chromePids = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like '*bv_chrome_profiles*' } | Select-Object -ExpandProperty ProcessId

$pidHash = @{}
foreach ($p in $chromePids) { $pidHash[$p] = $true }

$found = 0
$callback = {
    param([IntPtr]$hWnd, [IntPtr]$lParam)
    $pId = 0
    [WinSearch]::GetWindowThreadProcessId($hWnd, [ref]$pId) | Out-Null
    if ($pidHash.ContainsKey($pId)) {
        $sbText = New-Object System.Text.StringBuilder 512
        [WinSearch]::GetWindowText($hWnd, $sbText, 512) | Out-Null
        $sbClass = New-Object System.Text.StringBuilder 256
        [WinSearch]::GetClassName($hWnd, $sbClass, 256) | Out-Null
        $visible = [WinSearch]::IsWindowVisible($hWnd)
        
        Write-Host ("HWND: 0x{0:X} | PID: {1} | Visible: {2} | Class: {3} | Title: {4}" -f $hWnd.ToInt64(), $pId, $visible, $sbClass.ToString(), $sbText.ToString())
        
        # If it's a Chrome widget window or visible window, bring to top!
        if ($sbClass.ToString() -like "*Chrome_WidgetWin*") {
            [WinSearch]::ShowWindow($hWnd, 9) | Out-Null # SW_RESTORE
            [WinSearch]::SetWindowPos($hWnd, [IntPtr](-1), 0, 0, 0, 0, 0x0001 -bor 0x0002 -bor 0x0040) | Out-Null
            [WinSearch]::SetWindowPos($hWnd, [IntPtr](-2), 0, 0, 0, 0, 0x0001 -bor 0x0002 -bor 0x0040) | Out-Null
            [WinSearch]::BringWindowToTop($hWnd) | Out-Null
            [WinSearch]::SetForegroundWindow($hWnd) | Out-Null
        }
    }
    return $true
}

[WinSearch]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
