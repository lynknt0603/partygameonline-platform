Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WindowFinder {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
}
'@

$count = 0
[WindowFinder]::EnumWindows({
    param($hwnd, $lParam)
    $procId = 0
    [WindowFinder]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null
    $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($p) {
        $sb = New-Object System.Text.StringBuilder 256
        [WindowFinder]::GetWindowText($hwnd, $sb, 256) | Out-Null
        $title = $sb.ToString()
        if ($title.Length -gt 0) {
            $visible = [WindowFinder]::IsWindowVisible($hwnd)
            Write-Host "HWND: $hwnd | Proc: $($p.ProcessName) | PID: $procId | Visible: $visible | Title: $title"
            $script:count++
        }
    }
    return $true
}, [IntPtr]::Zero) | Out-Null

Write-Host "Total titled windows: $count"
