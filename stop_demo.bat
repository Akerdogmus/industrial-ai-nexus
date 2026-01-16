@echo off
title ACD Demo - Durdur
color 0C

echo.
echo  =====================================================
echo  ^|    ACD AI TOOLKIT - PROCESSLERI DURDUR           ^|
echo  =====================================================
echo.

echo  Frontend sunucusu durduruluyor...
echo.

:: Kill by window title
taskkill /FI "WINDOWTITLE eq ACD-Frontend*" /F >nul 2>&1

:: Kill by port 3000 (Frontend default)
echo  Port 3000 kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo    PID %%a sonlandiriliyor...
    taskkill /PID %%a /F >nul 2>&1
)

:: Also check port 3001 (alternative port)
echo  Port 3001 kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    echo    PID %%a sonlandiriliyor...
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill any node processes related to npm dev server
taskkill /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq npm*" /F >nul 2>&1

echo.
echo  Tum ACD demo processleri durduruldu!
echo.
timeout /t 3
