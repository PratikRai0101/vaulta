#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
source "$HERE/android-env.sh"
cd "$ROOT"
if [[ ! -x android/gradlew ]]; then
  CI=1 npx expo prebuild --platform android --no-install
fi
cd "$ROOT/android"
echo 'Warming release native dependencies only; this does not create a runnable APK.'
./gradlew :app:compileReleaseKotlin :app:compileReleaseJavaWithJavac :app:externalNativeBuildRelease \
  -x :app:createBundleReleaseJsAndAssets --console=plain \
  --max-workers="${GRADLE_MAX_WORKERS:-4}" \
  "-PreactNativeArchitectures=${ANDROID_ARCHITECTURES:-arm64-v8a}" "$@"
