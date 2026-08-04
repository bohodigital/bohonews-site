#!/usr/bin/env bash
set -euo pipefail

PIN="3c3632259d298ab62aafa8a5858823569ab1af46"
LICENSE_SHA256="43c5b4a4304e7f9d162cda91028ea83f640cd56341744057b9aeed3f10ae55ab"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENDOR_ROOT="${TATHAM_VENDOR_ROOT:-/srv/local1/vendor/tatham-puzzles}"
BUILD_ROOT="${TATHAM_BUILD_ROOT:-/srv/local1/runtime/bohonews-site/tatham-build/$PIN}"
OUTPUT_ROOT="${TATHAM_OUTPUT_ROOT:-$PROJECT_ROOT/public/vendor/tatham/$PIN}"

fail() { printf 'build-tatham: %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null || fail "git is required"
command -v cmake >/dev/null || fail "cmake is required"
command -v emcmake >/dev/null || fail "an activated, pinned Emscripten SDK is required"
command -v ninja >/dev/null || fail "ninja is required"
test -d "$VENDOR_ROOT/.git" || fail "pinned vendor checkout not found at $VENDOR_ROOT"

ACTUAL_PIN="$(git -C "$VENDOR_ROOT" rev-parse HEAD)"
test "$ACTUAL_PIN" = "$PIN" || fail "vendor checkout is $ACTUAL_PIN; expected $PIN"
ACTUAL_LICENSE_SHA256="$(shasum -a 256 "$VENDOR_ROOT/LICENCE" | awk '{print $1}')"
test "$ACTUAL_LICENSE_SHA256" = "$LICENSE_SHA256" || fail "upstream LICENCE digest changed"

mkdir -p "$BUILD_ROOT" "$OUTPUT_ROOT"
emcmake cmake \
  -S "$VENDOR_ROOT" \
  -B "$BUILD_ROOT" \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DMIN_CHROME_VERSION=120 \
  -DMIN_FIREFOX_VERSION=120 \
  -DMIN_SAFARI_VERSION=170000
(
  cd "$BUILD_ROOT"
  cmake --build . --target mines pattern
)

for game in mines pattern; do
  js_source="$(find "$BUILD_ROOT" -type f -name "$game.js" -print -quit)"
  wasm_source="$(find "$BUILD_ROOT" -type f -name "$game.wasm" -print -quit)"
  test -n "$js_source" || fail "$game.js was not produced"
  test -n "$wasm_source" || fail "$game.wasm was not produced"
  install -m 0644 "$js_source" "$OUTPUT_ROOT/$game.js"
  install -m 0644 "$wasm_source" "$OUTPUT_ROOT/$game.wasm"
done

install -m 0644 "$VENDOR_ROOT/LICENCE" "$OUTPUT_ROOT/LICENCE"
install -m 0644 "$PROJECT_ROOT/docs/games/vendor/tatham-puzzles.lock.json" "$OUTPUT_ROOT/source-lock.json"
(
  cd "$OUTPUT_ROOT"
  shasum -a 256 LICENCE source-lock.json mines.js mines.wasm pattern.js pattern.wasm
) > "$OUTPUT_ROOT/SHA256SUMS"

printf 'Built pinned Tatham web assets at %s\n' "$OUTPUT_ROOT"
