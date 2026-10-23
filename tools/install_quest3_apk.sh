#!/usr/bin/env bash
set -euo pipefail

APK_PATH="${1:-Unity/Build/Android/ORRoomScanStudio.apk}"
PACKAGE_ID="com.and14122001.orroomscanstudio"

if ! command -v adb >/dev/null 2>&1; then
  echo "ERROR: adb not found. Install Android Platform Tools first." >&2
  exit 2
fi
if [ ! -f "$APK_PATH" ]; then
  echo "ERROR: APK not found: $APK_PATH" >&2
  echo "Build it in Unity via OR RoomScan > Build Quest 3 APK first." >&2
  exit 2
fi

echo "Connected Android/Quest devices:"
adb devices
if ! adb devices | awk 'NR>1 && $2=="device" {found=1} END {exit !found}'; then
  echo "ERROR: no authorized ADB device. Enable Quest Developer Mode, connect USB, and accept the USB debugging prompt." >&2
  exit 3
fi

adb install -r "$APK_PATH"
adb shell monkey -p "$PACKAGE_ID" 1
echo "Install and launch commands completed. Confirm the app actually renders and scans on Quest 3."
