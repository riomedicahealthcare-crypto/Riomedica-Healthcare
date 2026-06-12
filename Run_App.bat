@echo off
setlocal enabledelayedexpansion

title Riomedica Healthcare Detailing & Admin Launcher

:: 1. Check for Node.js using node -v (more robust than 'where')
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo =========================================================
    echo  [ERROR] Node.js is NOT installed on this computer!
    echo =========================================================
    echo.
    echo This application requires Node.js to run.
    echo Please download and install the Node.js LTS version from:
    echo 👉 https://nodejs.org/
    echo.
    echo Once installed, restart your computer and run this file again.
    echo.
    echo Press any key to close...
    pause >nul
    exit /b 1
)

:: 2. Get Local Network IP Address
set "local_ip="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "ipv4" ^| findstr /v "127.0.0.1"') do (
    set "temp_ip=%%a"
    set "temp_ip=!temp_ip: =!"
    if not defined local_ip (
        set "local_ip=!temp_ip!"
    )
)

if not defined local_ip (
    set "local_ip=localhost"
)

echo =========================================================
echo       RIOMEDICA HEALTHCARE APP - NETWORK LAUNCHER
echo =========================================================
echo.
echo Detected Server IP Address: %local_ip%
echo.
echo Choose your startup mode:
echo   [1] RUN LIVE APP (Production Mode - RECOMMENDED)
echo       * Compiles frontend assets and launches backend
echo       * Runs everything on a single port (5000)
echo       * Perfect for testing from other computers / phones!
echo.
echo   [2] RUN DEVELOPER APP (Concurrent Dev Mode)
echo       * Runs frontend on port 5174 and backend API on 5000
echo       * Allows live code editing and hot-reloading
echo.
set /p choice="Enter your choice (1 or 2, default is 1): "

if "%choice%"=="2" (
    echo.
    echo [INFO] Installing required packages...
    call npm install
    if %errorlevel% neq 0 goto error_install
    echo [INFO] Launching developer instances...
    start http://localhost:5173
    call npm run dev
    if %errorlevel% neq 0 goto error_run
    goto end
)

:: Option 1: Production Mode
echo.
echo [INFO] Step 1: Installing all dependencies (might take a moment)...
call npm run install-all
if %errorlevel% neq 0 goto error_install

echo.
echo [INFO] Step 2: Compiling React UI assets...
call npm run build
if %errorlevel% neq 0 goto error_build

echo.
echo =========================================================
echo              RIOMEDICA APP IS NOW ONLINE!
echo =========================================================
echo.
echo  🖥️  LOCAL ACCESS (on this computer):
echo      👉 http://localhost:5000
echo.
echo  🌐 NETWORK ACCESS (from other computers, tablets, or phones
echo      connected to the same Wi-Fi/local network):
echo      👉 http://%local_ip%:5000
echo.
echo  [Note: Keep this window open. Press Ctrl+C to close the app.]
echo =========================================================
echo.

:: Automatically open browser locally
start http://localhost:5000

:: Start Express production server
call npm run prod
if %errorlevel% neq 0 goto error_run
goto end

:error_install
echo.
echo =========================================================
echo  [ERROR] Failed to install package dependencies!
echo =========================================================
echo This usually happens because:
echo  1. You do not have an active internet connection.
echo  2. The folder is in a restricted path (like Program Files).
echo     *Try moving the "mobile app" folder to your Desktop and try again.*
echo.
echo Press any key to close...
pause >nul
exit /b 1

:error_build
echo.
echo =========================================================
echo  [ERROR] Failed to compile React frontend static assets!
echo =========================================================
echo Press any key to close...
pause >nul
exit /b 1

:error_run
echo.
echo =========================================================
echo  [ERROR] The application server crashed or was terminated!
echo =========================================================
echo Press any key to close...
pause >nul
exit /b 1

:end
pause
