Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WindowUtil {
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

$HWND_TOP = [IntPtr]::Zero
$HWND_TOPMOST = [IntPtr](-1)
$HWND_NOTOPMOST = [IntPtr](-2)
$SW_RESTORE = 9
$SW_SHOW = 5
$SWP_SHOWWINDOW = 0x0040

$chromePids = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like '*bv_chrome_profiles*' -and $_.CommandLine -notlike '*--type=*' } | Select-Object -ExpandProperty ProcessId

Write-Host "Found $($chromePids.Count) main Chrome processes:"
foreach ($pidVal in $chromePids) {
    $proc = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
    if ($proc) {
        $hwnd = $proc.MainWindowHandle
        Write-Host "PID: $pidVal | MainWindowHandle: $hwnd | Title: $($proc.MainWindowTitle)"
        if ($hwnd -ne [IntPtr]::Zero) {
            [WindowUtil]::ShowWindow($hwnd, $SW_RESTORE) | Out-Null
            [WindowUtil]::SetWindowPos($hwnd, $HWND_TOPMOST, 0, 0, 0, 0, 0x0001 -bor 0x0002 -bor $SWP_SHOWWINDOW) | Out-Null
            [WindowUtil]::SetWindowPos($hwnd, $HWND_NOTOPMOST, 0, 0, 0, 0, 0x0001 -bor 0x0002 -bor $SWP_SHOWWINDOW) | Out-Null
            [WindowUtil]::SetForegroundWindow($hwnd) | Out-Null
            [WindowUtil]::BringWindowToTop($hwnd) | Out-Null
        }
    }
}
