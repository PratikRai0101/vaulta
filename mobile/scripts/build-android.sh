#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
source "$HERE/android-env.sh"
cd "$ROOT"
if [[ ! -x android/gradlew ]]; then
  CI=1 npx expo prebuild --platform android --no-install
fi
ARTIFACT="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
DEST_DIR="$ROOT/builds"
DEST="$DEST_DIR/vaulta.apk"
echo 'Building Vaulta standalone release APK (local debug keystore; not production signing).'
cd "$ROOT/android"
./gradlew assembleRelease --console=plain --max-workers="${GRADLE_MAX_WORKERS:-4}" "-PreactNativeArchitectures=${ANDROID_ARCHITECTURES:-arm64-v8a}" "$@"
if [[ ! -f "$ARTIFACT" ]]; then
  echo "Build did not produce $ARTIFACT" >&2
  exit 1
fi
mkdir -p "$DEST_DIR"
cp "$ARTIFACT" "$DEST"
echo "Done: $DEST"
echo 'Install: adb install -r builds/vaulta.apk'
echo 'Launch: adb shell am start -n com.vaulta.wallet/.MainActivity'
