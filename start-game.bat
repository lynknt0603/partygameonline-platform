@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ======================================================================
echo    BOARDVERSE - KHOI CHAY HE THONG (BACKEND + FRONTEND)
echo ======================================================================
echo.

echo [1/3] Dang khoi dong Backend Spring Boot 8080 va PostgreSQL...
start "BoardVerse Backend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0apps\server\run.ps1"

echo [2/3] Dang khoi dong Frontend Vite 5173...
start "BoardVerse Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "cd '%~dp0'; npm run dev"

echo [3/3] Dang mo giao dien tren trinh duyet...
timeout /t 4 /nobreak >nul

start http://localhost:5173/rooms

echo.
echo ======================================================================
echo  [OK] He thong dang chay!
echo  - Backend API: http://127.0.0.1:8080
echo  - Frontend Web: http://localhost:5173/rooms
echo ======================================================================
pause
