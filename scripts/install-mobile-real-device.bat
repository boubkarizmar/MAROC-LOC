@echo off
REM Install the release APK on the connected Android device.
REM Make sure the device is connected and USB debugging is enabled.

cd /d "%~dp0.."

adb install -r "mobile-app\build\app\outputs\flutter-apk\app-release.apk"

if %errorlevel% neq 0 (
  echo Install failed. Is the device connected and adb available?
  exit /b %errorlevel%
)

echo APK installed successfully.
