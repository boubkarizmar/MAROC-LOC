#!/usr/bin/env bash
# Install the release APK on the connected Android device.
# Make sure the device is connected and USB debugging is enabled.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "${SCRIPT_DIR}/.."

adb install -r "mobile-app/build/app/outputs/flutter-apk/app-release.apk"

echo "APK installed successfully."
