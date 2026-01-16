@echo off
title ACD AI Toolkit Demo Platform
color 0A

echo.
echo  =====================================================
echo  ^|    ACD AI TOOLKIT DEMO PLATFORM                  ^|
echo  ^|    Statik Frontend - Backend Gerekmez            ^|
echo  =====================================================
echo.

:: Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi! Lutfen Node.js 18+ yukleyin.
    pause
    exit /b 1
)

echo [1/2] Frontend bagimliliklari kontrol ediliyor...
cd frontend
if not exist node_modules (
    echo       npm install calistiriliyor...
    npm install
)

echo [2/2] Frontend sunucusu baslatiliyor...
echo.
echo  =====================================================
echo  ^|  Demo hazir! Tarayiciniz otomatik acilacak.      ^|
echo  ^|                                                   ^|
echo  ^|  Adres: http://localhost:3000                    ^|
echo  ^|                                                   ^|
echo  ^|  NOT: Backend gerekmez - tamamen statik!         ^|
echo  ^|                                                   ^|
echo  ^|  Kapatmak icin ENTER tusuna basin                ^|
echo  =====================================================
echo.

:: Open browser after short delay
timeout /t 3 >nul
start http://localhost:3000

:: Start frontend dev server
start "ACD-Frontend" /MIN cmd /c "npm run dev"

echo.
echo  Sunucu baslatildi. Durdurmak icin ENTER tusuna basin...
echo.
pause >nul

:: Cleanup
echo.
echo  Sunucu durduruluyor...
taskkill /FI "WINDOWTITLE eq ACD-Frontend*" /F >nul 2>&1

:: Kill processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  Tamamlandi!
timeout /t 2 >nul
