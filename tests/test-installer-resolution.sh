#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
INSTALLER="$ROOT_DIR/install.sh"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT HUP INT TERM

mkdir -p "$TMP_DIR/bin"

cat >"$TMP_DIR/bin/curl" <<'EOF'
#!/usr/bin/env sh
set -eu

url=""
for arg in "$@"; do
  case "$arg" in
    http://*|https://*) url="$arg" ;;
  esac
done

case "$url" in
  *stable-ok*) printf '%s\n' 'v2.8.99' ;;
  *stable-invalid*) printf '%s\n' 'not-a-tag' ;;
  *stable-unavailable*) exit 22 ;;
  */releases/download/*)
    case "${VIX_TEST_MODE:-}" in
      installable) exit 0 ;;
      incomplete) exit 22 ;;
      *) exit 22 ;;
    esac
    ;;
  *) exit 22 ;;
esac
EOF
chmod +x "$TMP_DIR/bin/curl"

run_case() {
  expected_status="$1"
  expected_text="$2"
  shift 2

  set +e
  output=$(PATH="$TMP_DIR/bin:$PATH" "$@" 2>&1)
  status=$?
  set -e

  [ "$status" -eq "$expected_status" ] || {
    printf 'expected status %s, got %s:\n%s\n' "$expected_status" "$status" "$output" >&2
    exit 1
  }

  printf '%s' "$output" | grep -F "$expected_text" >/dev/null || {
    printf 'expected output to contain %s:\n%s\n' "$expected_text" "$output" >&2
    exit 1
  }
}

run_case 1 'Could not resolve the latest validated Vix release. Please try again later.' \
  env VIX_STABLE_URL=https://test.invalid/stable-unavailable "$INSTALLER"

run_case 1 'Could not resolve the latest validated Vix release. Please try again later.' \
  env VIX_STABLE_URL=https://test.invalid/stable-invalid "$INSTALLER"

run_case 1 'Could not resolve the latest validated Vix release. Please try again later.' \
  env VIX_TEST_MODE=incomplete VIX_STABLE_URL=https://test.invalid/stable-ok "$INSTALLER"

run_case 1 'version   v2.8.99' \
  env VIX_TEST_MODE=installable VIX_STABLE_URL=https://test.invalid/stable-ok "$INSTALLER"

run_case 1 'version   v2.8.99' \
  env VIX_TEST_MODE=installable VIX_VERSION=v2.8.99 "$INSTALLER"

if rg -n '2\.7\.8|VIX_FALLBACK_VERSION|FALLBACK_VERSION' \
  "$ROOT_DIR/install.sh" \
  "$ROOT_DIR/install.ps1" \
  "$ROOT_DIR/vix-site/public/install.sh" \
  "$ROOT_DIR/vix-site/public/install.ps1"; then
  printf '%s\n' 'found a versioned fallback in a public installer' >&2
  exit 1
fi

if ! rg -q 'Windows ARM64 is not supported by this Vix release channel\.' \
  "$ROOT_DIR/vix-site/public/install.ps1"; then
  printf '%s\n' 'Windows ARM64 rejection is missing from the canonical PowerShell installer' >&2
  exit 1
fi

if rg -U -q '"\^ARM64\$"[[:space:]]*\{[[:space:]]*return "aarch64"' \
  "$ROOT_DIR/vix-site/public/install.ps1"; then
  printf '%s\n' 'canonical PowerShell installer still accepts Windows ARM64' >&2
  exit 1
fi

cmp -s "$ROOT_DIR/install.sh" "$ROOT_DIR/vix-site/public/install.sh"
cmp -s "$ROOT_DIR/install.ps1" "$ROOT_DIR/vix-site/public/install.ps1"

printf '%s\n' 'installer resolution tests passed'
