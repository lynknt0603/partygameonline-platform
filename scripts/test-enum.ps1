Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class TestWin {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@

$count = 0
$cb = {
    param([IntPtr]$hWnd, [IntPtr]$lParam)
    if ([TestWin]::IsWindowVisible($hWnd)) {
        $sb = New-Object System.Text.StringBuilder 256
        [TestWin]::GetWindowText($hWnd, $sb, 256) | Out-Null
        $t = $sb.ToString()
        if ($t.Length -gt 0) {
            $pId = 0
            [TestWin]::GetWindowThreadProcessId($hWnd, [ref]$pId) | Out-Null
            $p = Get-Process -Id $pId -ErrorAction SilentlyContinue
            Write-Host "$($p.ProcessName) (PID $pId): $t"
            $script:count++
        }
    }
    return $true
}
[TestWin]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
Write-Host "Total visible windows with title: $count"
