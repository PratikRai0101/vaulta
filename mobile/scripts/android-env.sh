#!/usr/bin/env bash
# Shared by the local Android build and native warm-up scripts.
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  VAULTA_JAVA_VERSION="$("$JAVA_HOME/bin/java" -version 2>&1 | head -n 1)"
  if [[ "$VAULTA_JAVA_VERSION" != *'version "21.'* ]]; then
    unset JAVA_HOME
  fi
fi
if [[ -z "${JAVA_HOME:-}" || ! -x "$JAVA_HOME/bin/java" ]]; then
  for candidate in "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" "/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"; do
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi
if [[ -z "${JAVA_HOME:-}" ]] && [[ -x /usr/libexec/java_home ]]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
  export JAVA_HOME
fi
if [[ -z "${JAVA_HOME:-}" || ! -x "$JAVA_HOME/bin/java" ]]; then
  echo 'Java 21 is required. Install openjdk@21 or set JAVA_HOME to its JDK home.' >&2
  exit 1
fi
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if [[ ! -d "$ANDROID_HOME/platforms" ]]; then
  echo "Android SDK not found at $ANDROID_HOME. Set ANDROID_HOME." >&2
  exit 1
fi
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
export NODE_BINARY="${NODE_BINARY:-$(command -v node)}"
