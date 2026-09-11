param(
    [string]$RoomCode = "",
    [int]$Count = 6
)

$ErrorActionPreference = "Stop"

$BackendUrl = "http://127.0.0.1:8080"
$WebUrl = "http://localhost:5173"
$Password = "Password123!"

$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $ChromePath)) {
    $ChromePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "BOARDVERSE - MULTI-BROWSER WINDOW LAUNCHER (POWERSHELL)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Browser: $ChromePath"
Write-Host "Windows count: $Count"

Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$availW = $screen.Width
$availH = $screen.Height - 80

$cols = 3
$rows = 2
$winW = [math]::Floor($availW / $cols)
$winH = [math]::Floor($availH / $rows)

$playersDef = @(
    @{ User = "sim_p_1"; Name = "P1_Host" },
    @{ User = "sim_p_2"; Name = "P2_Vampire" },
    @{ User = "sim_p_3"; Name = "P3_Assassin" },
    @{ User = "sim_p_4"; Name = "P4_Knight" },
    @{ User = "sim_p_5"; Name = "P5_Oracle" },
    @{ User = "sim_p_6"; Name = "P6_Guardian" }
)

Write-Host ""
Write-Host "Authenticating $Count players..." -ForegroundColor Yellow
$auths = @()

for ($i = 0; $i -lt $Count; $i++) {
    $p = $playersDef[$i]
    $body = @{ username = $p.User; password = $Password } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$BackendUrl/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    } catch {
        $regBody = @{ username = $p.User; password = $Password; displayName = $p.Name } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$BackendUrl/api/v1/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    }
    # Leave old room if in one
    try {
        $me = Invoke-RestMethod -Uri "$BackendUrl/api/v1/session/me" -Headers @{ Authorization = "Bearer $($res.accessToken)" }
        if ($me.currentRoomId) {
            Invoke-RestMethod -Uri "$BackendUrl/api/v1/rooms/$($me.currentRoomId)/leave" -Method Post -Headers @{ Authorization = "Bearer $($res.accessToken)" } | Out-Null
        }
    } catch {
        # ignore
    }

    $auths += @{
        User = $p.User
        Name = $p.Name
        Token = $res.accessToken
        PlayerId = $res.playerId
    }
    Write-Host "  OK: $($p.Name) ($($p.User))" -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($RoomCode)) {
    Write-Host ""
    Write-Host "Creating online room for Blood Bound ($Count players)..." -ForegroundColor Yellow
    $roomBody = @{
        gameId = "blood-bound"
        name = "Room 6P"
        maxPlayers = $Count
        visibility = "PUBLIC"
    } | ConvertTo-Json

    $hostHeader = @{ Authorization = "Bearer $($auths[0].Token)" }
    $room = Invoke-RestMethod -Uri "$BackendUrl/api/v1/rooms" -Method Post -Body $roomBody -ContentType "application/json" -Headers $hostHeader
    $RoomCode = $room.id
    Write-Host "Room created: [$RoomCode]" -ForegroundColor Green

    for ($i = 1; $i -lt $Count; $i++) {
        $pHeader = @{ Authorization = "Bearer $($auths[$i].Token)" }
        try {
            Invoke-RestMethod -Uri "$BackendUrl/api/v1/rooms/$RoomCode/join" -Method Post -Headers $pHeader | Out-Null
            $readyBody = @{ ready = $true } | ConvertTo-Json
            Invoke-RestMethod -Uri "$BackendUrl/api/v1/rooms/$RoomCode/ready" -Method Put -Body $readyBody -ContentType "application/json" -Headers $pHeader | Out-Null
            Write-Host "  OK: $($auths[$i].Name) joined and READY" -ForegroundColor Green
        } catch {
            Write-Warning "Join error for $($auths[$i].Name): $_"
        }
    }

    # Host starts match automatically
    try {
        Start-Sleep -Milliseconds 600
        Invoke-RestMethod -Uri "$BackendUrl/api/v1/rooms/$RoomCode/start" -Method Post -Headers $hostHeader | Out-Null
        Write-Host "  OK: Host started match! Room is now IN_GAME" -ForegroundColor Green
    } catch {
        Write-Warning "Start match error: $_"
    }
}

$profilesRoot = Join-Path $env:TEMP "bv_chrome_profiles"
if (-not (Test-Path $profilesRoot)) {
    New-Item -ItemType Directory -Path $profilesRoot | Out-Null
}

Write-Host ""
Write-Host "Opening $Count Chrome windows in 3x2 grid..." -ForegroundColor Cyan

for ($i = 0; $i -lt $Count; $i++) {
    $col = $i % $cols
    $row = [math]::Floor($i / $cols)
    $posX = $col * $winW
    $posY = $row * $winH

    $p = $auths[$i]
    $profileDir = Join-Path $profilesRoot "player_$($i + 1)"
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir | Out-Null
    }

    $nameEnc = [System.Uri]::EscapeDataString($p.Name)
    $url = "$WebUrl/play/$RoomCode" + "?name=" + $nameEnc + "&token=" + $p.Token

    $argsList = @(
        "--no-sandbox",
        "--user-data-dir=$profileDir",
        "--window-position=$posX,$posY",
        "--window-size=$winW,$winH",
        "--no-first-run",
        "--no-default-browser-check",
        $url
    )

    Start-Process -FilePath $ChromePath -ArgumentList $argsList
    Write-Host "  [Window $($i + 1)] $($p.Name) -> Pos: ($posX, $posY) Size: ${winW}x${winH}"
    Start-Sleep -Milliseconds 600
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "ALL $Count WINDOWS OPENED ON SCREEN!" -ForegroundColor Green
Write-Host "Room ID: $RoomCode" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

# Keep process alive so Windows Job Object does not kill child browser windows
Start-Sleep -Seconds 3600
