#!/usr/bin/env bash
# Build a release APK pointing to a real Android device's LAN backend.
# Usage: ./scripts/build-mobile-real-device.sh [HOST_IP]
# If no HOST_IP is provided, the script tries to auto-detect the active Wi-Fi/LAN IP.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-detect a reasonable LAN IP if not provided.
if [ -n "$1" ]; then
  HOST_IP="$1"
else
  # Try common interfaces; adjust for your machine if needed.
  HOST_IP="$(ip route get 1 2>/dev/null | awk '{print $7; exit}')" || true
  if [ -z "$HOST_IP" ]; then
    HOST_IP="$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?192\.168\.[0-9]+\.[0-9]+' | awk '{print $NF}' | head -1)" || true
  fi
  if [ -z "$HOST_IP" ]; then
    HOST_IP="192.168.11.119"
  fi
fi

echo "Building mobile app for real device using backend at ${HOST_IP}"
echo ""

cd "${SCRIPT_DIR}/../mobile-app"

flutter build apk --release \
  --dart-define=API_BASE_URL="http://${HOST_IP}:8080/api" \
  --dart-define=WS_BASE_URL="http://${HOST_IP}:8080/api" \
  --dart-define=AI_BASE_URL="http://${HOST_IP}:8000"

echo ""
echo "APK ready: mobile-app/build/app/outputs/flutter-apk/app-release.apk"
echo "Install with: adb install mobile-app/build/app/outputs/flutter-apk/app-release.apk"
