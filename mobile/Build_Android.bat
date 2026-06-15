@echo off
title Riomedica Healthcare - Android Build Tool
color 0A

echo.
echo  ====================================================
echo   RIOMEDICA HEALTHCARE - ANDROID BUILDER
echo   Google Play Store Deployment Tool
echo  ====================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if Java JDK is installed
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Java JDK is not installed or not in PATH.
    echo  Please download JDK 17+ from: https://adoptium.net
    pause
    exit /b 1
)

echo  [1/5] Installing Capacitor dependencies...
call npm install
if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo  [2/5] Building React web app...
cd ..\client
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo  [ERROR] Web build failed. Check for errors above.
    cd ..\mobile
    pause
    exit /b 1
)
cd ..\mobile

echo.
echo  [3/5] Adding Android platform...
call npx cap add android 2>nul
echo  (If already added, skipping...)

echo.
echo  [4/5] Syncing web build to Android project...
call npx cap sync android
if %errorlevel% neq 0 (
    echo  [ERROR] Cap sync failed.
    pause
    exit /b 1
)

echo.
echo  [5/5] Opening Android Studio...
echo  - In Android Studio: Build > Generate Signed Bundle/APK
echo  - Choose "Android App Bundle" for Play Store upload
echo  - Choose "APK" for direct installation/testing
echo.
call npx cap open android

echo.
echo  ====================================================
echo   ANDROID STUDIO IS OPENING...
echo   
echo   NEXT STEPS IN ANDROID STUDIO:
echo   1. Wait for Gradle sync to complete
echo   2. Go to Build > Generate Signed Bundle / APK
echo   3. Create or use your keystore file
echo   4. Build RELEASE version
echo   5. Upload .aab file to Google Play Console
echo  ====================================================
echo.
pause
