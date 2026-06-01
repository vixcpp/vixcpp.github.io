#!/usr/bin/env sh
set -eu

MINISIGN_PUBKEY="RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ"

VIX_REPO="${VIX_REPO:-vixcpp/vix}"
VIX_VERSION="${VIX_VERSION:-latest}"

# sdk or cli
VIX_INSTALL_KIND="${VIX_INSTALL_KIND:-sdk}"

VIX_INSTALL_PREFIX="${VIX_INSTALL_PREFIX:-$HOME/.local}"
VIX_INSTALL_BIN_DIR="${VIX_INSTALL_BIN_DIR:-$HOME/.local/bin}"

BIN_NAME="vix"

if [ -t 2 ] && [ "${NO_COLOR:-}" = "" ]; then
  C_RESET="$(printf '\033[0m')"
  C_BOLD="$(printf '\033[1m')"
  C_RED="$(printf '\033[31m')"
  C_GREEN="$(printf '\033[32m')"
  C_YELLOW="$(printf '\033[33m')"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_GREEN=""
  C_YELLOW=""
fi

die() {
  printf "%s✖%s vix: %s\n" "$C_RED" "$C_RESET" "$*" >&2
  exit 1
}

info() {
  printf "› vix: %s\n" "$*" >&2
}

ok() {
  printf "%s✔%s vix: %s\n" "$C_GREEN" "$C_RESET" "$*" >&2
}

warn() {
  printf "%s!%s vix: %s\n" "$C_YELLOW" "$C_RESET" "$*" >&2
}

have() {
  command -v "$1" >/dev/null 2>&1
}

need_cmd() {
  have "$1" || die "missing dependency: $1"
}

fetch() {
  url="$1"
  out="$2"

  if have curl; then
    curl -fsSL "$url" -o "$out" >/dev/null 2>&1
    return
  fi

  if have wget; then
    wget -qO "$out" "$url" >/dev/null 2>&1
    return
  fi

  die "need curl or wget"
}

show_help() {
  cat <<EOF
Vix.cpp installer

Usage:
  install.sh             Install Vix SDK
  install.sh --cli-only  Install CLI only
  install.sh --sdk       Install SDK

Environment:
  VIX_VERSION            Release version. Example: v2.5.5. Default: latest
  VIX_REPO               GitHub repo. Default: vixcpp/vix
  VIX_INSTALL_KIND       sdk or cli. Default: sdk
  VIX_INSTALL_PREFIX     SDK install prefix. Default: \$HOME/.local
  VIX_INSTALL_BIN_DIR    CLI bin dir. Default: \$HOME/.local/bin
EOF
}

for arg in "$@"; do
  case "$arg" in
    --cli-only)
      VIX_INSTALL_KIND="cli"
      ;;
    --sdk)
      VIX_INSTALL_KIND="sdk"
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      die "unknown option: $arg"
      ;;
  esac
done

case "$VIX_INSTALL_KIND" in
  sdk|cli)
    ;;
  *)
    die "unsupported VIX_INSTALL_KIND='$VIX_INSTALL_KIND'"
    ;;
esac

need_cmd uname
need_cmd mktemp
need_cmd tar

detect_platform() {
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux)
      OS="linux"
      ;;
    Darwin)
      OS="macos"
      ;;
    *)
      die "unsupported OS: $os"
      ;;
  esac

  case "$arch" in
    x86_64|amd64)
      ARCH="x86_64"
      ;;
    arm64|aarch64)
      ARCH="aarch64"
      ;;
    *)
      die "unsupported architecture: $arch"
      ;;
  esac
}

resolve_version() {
  if [ "$VIX_VERSION" = "latest" ]; then
    have curl || die "curl is required to resolve latest, or set VIX_VERSION=vX.Y.Z"

    final="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$VIX_REPO/releases/latest")"
    tag="${final##*/}"

    [ -n "$tag" ] || die "could not resolve latest version"

    printf "%s" "$tag"
  else
    printf "%s" "$VIX_VERSION"
  fi
}

verify_checksum() {
  archive="$1"
  sha_file="$2"

  if ! have sha256sum && ! have shasum; then
    die "need sha256sum or shasum for checksum verification"
  fi

  expected="$(
    awk '
      /^[0-9a-fA-F]{64}/ { print $1; exit }
      /^SHA256 \(/ { print $NF; exit }
    ' "$sha_file"
  )"

  [ -n "$expected" ] || die "invalid sha256 file"

  if have sha256sum; then
    actual="$(sha256sum "$archive" | awk '{print $1}')"
  else
    actual="$(shasum -a 256 "$archive" | awk '{print $1}')"
  fi

  [ "$expected" = "$actual" ] || die "sha256 mismatch"
}

verify_signature() {
  archive="$1"
  sig_file="$2"

  if ! have minisign; then
    return
  fi

  minisign -Vm "$archive" -P "$MINISIGN_PUBKEY" >/dev/null 2>&1 || die "signature verification failed"
}

download_and_verify_asset() {
  base_url="$1"
  asset="$2"

  archive="$TMP_DIR/$asset"
  sha_file="$TMP_DIR/$asset.sha256"
  sig_file="$TMP_DIR/$asset.minisig"

  info "downloading $asset"

  fetch "$base_url/$asset" "$archive" || die "download failed"
  fetch "$base_url/$asset.sha256" "$sha_file" || die "checksum not found"

  verify_checksum "$archive" "$sha_file"

  if fetch "$base_url/$asset.minisig" "$sig_file"; then
    verify_signature "$archive" "$sig_file"
  fi

  printf "%s" "$archive"
}

install_cli() {
  archive="$(download_and_verify_asset "$BASE_URL" "$ASSET")"
  extract_dir="$TMP_DIR/cli"

  rm -rf "$extract_dir"
  mkdir -p "$extract_dir" "$VIX_INSTALL_BIN_DIR"

  tar -xzf "$archive" -C "$extract_dir"

  if [ -f "$extract_dir/$BIN_NAME" ]; then
    src="$extract_dir/$BIN_NAME"
  elif [ -f "$extract_dir/bin/$BIN_NAME" ]; then
    src="$extract_dir/bin/$BIN_NAME"
  else
    die "$BIN_NAME not found in archive"
  fi

  chmod +x "$src"
  cp "$src" "$VIX_INSTALL_BIN_DIR/$BIN_NAME"
  chmod +x "$VIX_INSTALL_BIN_DIR/$BIN_NAME"

  DEST="$VIX_INSTALL_BIN_DIR/$BIN_NAME"
}

install_sdk() {
  archive="$(download_and_verify_asset "$BASE_URL" "$ASSET")"
  extract_dir="$TMP_DIR/sdk"

  rm -rf "$extract_dir"
  mkdir -p "$extract_dir" "$VIX_INSTALL_PREFIX" "$VIX_INSTALL_BIN_DIR"

  tar -xzf "$archive" -C "$extract_dir"

  cp -R "$extract_dir/." "$VIX_INSTALL_PREFIX/"

  if [ -f "$VIX_INSTALL_PREFIX/bin/$BIN_NAME" ]; then
    target="$VIX_INSTALL_PREFIX/bin/$BIN_NAME"
  elif [ -f "$VIX_INSTALL_PREFIX/install/bin/$BIN_NAME" ]; then
    target="$VIX_INSTALL_PREFIX/install/bin/$BIN_NAME"
  else
    target="$(find "$VIX_INSTALL_PREFIX" -type f -path "*/bin/$BIN_NAME" 2>/dev/null | head -n 1 || true)"
  fi

  [ -n "$target" ] || die "could not find installed '$BIN_NAME'"

  chmod +x "$target"

  DEST="$VIX_INSTALL_BIN_DIR/$BIN_NAME"

  if [ "$target" != "$DEST" ]; then
    ln -sf "$target" "$DEST"
  fi
}

detect_platform

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t vix)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

TAG="$(resolve_version)"
BASE_URL="https://github.com/${VIX_REPO}/releases/download/${TAG}"

case "$VIX_INSTALL_KIND" in
  sdk)
    ASSET="vix-sdk-${OS}-${ARCH}.tar.gz"
    ;;
  cli)
    ASSET="vix-${OS}-${ARCH}.tar.gz"
    ;;
esac

printf "%s%sVix.cpp%s\n" "$C_BOLD" "$C_GREEN" "$C_RESET" >&2
info "installing $TAG ($VIX_INSTALL_KIND, ${OS}-${ARCH})"

case "$VIX_INSTALL_KIND" in
  sdk)
    install_sdk
    ;;
  cli)
    install_cli
    ;;
esac

if "$DEST" --version >/dev/null 2>&1; then
  ok "installed $TAG"
else
  warn "installed, but '$BIN_NAME --version' failed"
fi

case ":$PATH:" in
  *":$VIX_INSTALL_BIN_DIR:"*)
    ok "ready"
    ;;
  *)
    warn "installed, open a new terminal if '$BIN_NAME' is not found"
    ;;
esac
