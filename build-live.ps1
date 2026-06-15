param (
    [Parameter(Mandatory=$true)]
    [string]$ServerUrl
)

# Ensure ServerUrl does not end with /api
$ServerUrl = $ServerUrl -replace "/api$", ""

Write-Host "Setting API base URL to: $ServerUrl"

# Set environment variable for Vite compiler
$env:VITE_API_URL = $ServerUrl

Write-Host "Building React production assets..."
Set-Location "client"
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Error "React build failed!"
    exit 1
}
Set-Location ".."

Write-Host "Copying compiled web bundle to mobile projects..."
cmd /c "xcopy client\dist\* mobile-admin\www\ /s /e /y && xcopy client\dist\* mobile\www\ /s /e /y"

Write-Host "Syncing mobile-admin project with Capacitor..."
Set-Location "mobile-admin"
cmd /c "npx cap sync android"
Set-Location ".."

Write-Host "Syncing mobile project with Capacitor..."
Set-Location "mobile"
cmd /c "npx cap sync android"
Set-Location ".."

Write-Host "Compiling Android APK for mobile-admin..."
Set-Location "mobile-admin\android"
cmd /c "gradlew assembleDebug"
if ($LASTEXITCODE -ne 0) {
    Write-Error "mobile-admin compilation failed!"
    exit 1
}
Set-Location "..\.."

Write-Host "Compiling Android APK for mobile..."
Set-Location "mobile\android"
cmd /c "gradlew assembleDebug"
if ($LASTEXITCODE -ne 0) {
    Write-Error "mobile compilation failed!"
    exit 1
}
Set-Location "..\.."

Write-Host "Copying built APK packages to workspace root..."
Copy-Item "mobile-admin\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "riomedica-admin.apk" -Force
Copy-Item "mobile\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "riomedica-healthcare.apk" -Force
Copy-Item "mobile\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "riomedica-android-testing\riomedica-healthcare.apk" -Force
Copy-Item "mobile\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "riomedica-android-testing\app-debug.apk" -Force

Write-Host "--------------------------------------------------------"
Write-Host "Success! APK packages compiled pointing to: $ServerUrl"
Write-Host "Find your ready-to-install APK files at the workspace root:"
Write-Host " - riomedica-healthcare.apk"
Write-Host " - riomedica-admin.apk"
Write-Host "--------------------------------------------------------"
