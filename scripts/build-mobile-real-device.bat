@echo off
REM Build a release APK pointing to a real Android device's LAN backend.
REM Usage: build-mobile-real-device.bat [HOST_IP]
REM If no HOST_IP is provided, the script tries to auto-detect the active Wi-Fi/LAN IP.

setlocal
set "HOST_IP=%~1"

if "%HOST_IP%"=="" (
  for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match '^192\.168\.' } | Select-Object -First 1).IPAddress"`) do (
    set "HOST_IP=%%a"
  )
)

if "%HOST_IP%"=="" set "HOST_IP=192.168.11.114"

echo Building mobile app for real device using backend at %HOST_IP%
echo.

cd /d "%~dp0..\mobile-app"

flutter build apk --release ^
  --dart-define=API_BASE_URL=http://%HOST_IP%:8080/api ^
  --dart-define=WS_BASE_URL=http://%HOST_IP%:8080/api ^
  --dart-define=AI_BASE_URL=http://%HOST_IP%:8000

if %errorlevel% neq 0 (
  echo Build failed.
  exit /b %errorlevel%
)

echo.
echo APK ready: mobile-app\build\app\outputs\flutter-apk\app-release.apk
echo Install with: adb install mobile-app\build\app\outputs\flutter-apk\app-release.apk
