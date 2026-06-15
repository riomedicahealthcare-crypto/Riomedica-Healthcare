@echo off
title Riomedica Healthcare SMTP Configurator
echo =========================================================
echo       RIOMEDICA SMTP CONFIGURATION & DIAGNOSTIC TOOL
echo =========================================================
echo.
echo This tool will help you set up your Gmail App Password and
echo verify that the server is able to send real-time Gmail OTPs.
echo.

:: Check if Node is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in PATH.
    echo Please install Node.js to use this configurator.
    pause
    exit /b 1
)

:: Run the interactive configuration tool
cd "%~dp0server"
node setup_smtp.mjs

echo.
echo Press any key to exit...
pause >nul
