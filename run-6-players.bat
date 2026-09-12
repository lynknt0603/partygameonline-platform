@echo off
chcp 65001 >nul
title BoardVerse 6-Player Chrome Launcher
echo ======================================================================
echo    🎮 BOARDVERSE — KHỞI CHẠY 6 CỬA SỔ CHROME TRÊN MÀN HÌNH CHÍNH
echo ======================================================================
echo.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File scripts\launch-multiplayer-browsers.ps1
echo.
echo ======================================================================
echo  [✓] Đã khởi chạy xong 6 cửa sổ Chrome.
echo ======================================================================
pause
