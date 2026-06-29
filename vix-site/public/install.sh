#!/usr/bin/env sh
set -eu

MINISIGN_PUBKEY="RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ"

VIX_REPO="${VIX_REPO:-vixcpp/vix}"
VIX_VERSION="${VIX_VERSION:-latest}"
VIX_INSTALL_BIN_DIR="${VIX_INSTALL_BIN_DIR:-$HOME/.local/bin}"

BIN_NAME="vix"

if [ -t 2 ] && [ "${NO_COLOR:-}" = "" ]; then
  C_RESET="$(printf '\033[0m')"
  C_BOLD="$(printf '\033[1m')"
  C_RED="$(printf '\033[31m')"
  C_GREEN="$(printf '\033[32m')"
  C_YELLOW="$(printf '\033[33m')"
  C_DIM="$(printf '\033[2m')"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_GREEN=""
  C_YELLOW=""
  C_DIM=""
fi

die() {
  printf "  %s✗%s  %s\n" "$C_RED" "$C_RESET" "$*" >&2
  exit 1
}

step() {
  printf "  →  %s\n" "$*" >&2
}

ok() {
  printf "  %s✓%s  %s\n" "$C_GREEN" "$C_RESET" "$*" >&2
}

hint() {
  printf "  ·  %s%s%s\n" "$C_DIM" "$*" "$C_RESET" >&2
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
  install.sh

Environment:
  VIX_VERSION            Release version. Example: v2.7.0. Default: latest
  VIX_REPO               GitHub repo. Default: vixcpp/vix
  VIX_INSTALL_BIN_DIR    CLI install dir. Default: \$HOME/.local/bin

After install:
  vix upgrade
  vix upgrade --sdk list
  vix upgrade --sdk web
EOF
}

for arg in "$@"; do
  case "$arg" in
    --help|-h)
      show_help
      exit 0
      ;;
    --cli-only|--cli)
      # Kept for compatibility. The installer is CLI-only now.
      ;;
    --sdk)
      die "SDK install moved to: vix upgrade --sdk"
      ;;
    *)
      die "unknown option: $arg"
      ;;
  esac
done

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
    sed -n 's/^\([0-9a-fA-F][0-9a-fA-F]*\).*/\1/p' "$sha_file" | head -n 1
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

  minisign -Vm "$archive" -x "$sig_file" -P "$MINISIGN_PUBKEY" >/dev/null 2>&1 \
    || die "signature verification failed"
}

download_and_verify_asset() {
  base_url="$1"
  asset="$2"

  archive="$TMP_DIR/$asset"
  sha_file="$TMP_DIR/$asset.sha256"
  sig_file="$TMP_DIR/$asset.minisig"

  step "Downloading $asset"

  fetch "$base_url/$asset" "$archive" || die "download failed"
  fetch "$base_url/$asset.sha256" "$sha_file" || die "checksum not found"

  verify_checksum "$archive" "$sha_file"
  ok "sha256 verified"

  if fetch "$base_url/$asset.minisig" "$sig_file"; then
    verify_signature "$archive" "$sig_file"
    if have minisign; then
      ok "minisign verified"
    fi
  fi

  printf "%s" "$archive"
}

install_cli() {
  archive="$(download_and_verify_asset "$BASE_URL" "$ASSET")"
  extract_dir="$TMP_DIR/cli"

  rm -rf "$extract_dir"
  mkdir -p "$extract_dir" "$VIX_INSTALL_BIN_DIR"

  step "Installing to $VIX_INSTALL_BIN_DIR/$BIN_NAME"

  tar -xzf "$archive" -C "$extract_dir"

  if [ -f "$extract_dir/$BIN_NAME" ]; then
    src="$extract_dir/$BIN_NAME"
  elif [ -f "$extract_dir/bin/$BIN_NAME" ]; then
    src="$extract_dir/bin/$BIN_NAME"
  else
    src="$(find "$extract_dir" -type f -name "$BIN_NAME" 2>/dev/null | head -n 1 || true)"
  fi

  [ -n "$src" ] || die "$BIN_NAME not found in archive"

  chmod +x "$src"
  cp "$src" "$VIX_INSTALL_BIN_DIR/$BIN_NAME"
  chmod +x "$VIX_INSTALL_BIN_DIR/$BIN_NAME"

  DEST="$VIX_INSTALL_BIN_DIR/$BIN_NAME"
}

detect_platform

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t vix)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

TAG="$(resolve_version)"
BASE_URL="https://github.com/${VIX_REPO}/releases/download/${TAG}"
ASSET="vix-${OS}-${ARCH}.tar.gz"

printf "  ▲  %sVix.cpp%s  %sinstaller%s\n" "$C_BOLD" "$C_RESET" "$C_DIM" "$C_RESET" >&2
printf "  ------------------------------------\n" >&2
printf "  version   %s\n" "$TAG" >&2
printf "  platform  %s/%s\n" "$OS" "$ARCH" >&2
printf "\n" >&2

install_cli

if "$DEST" --version >/dev/null 2>&1; then
  ok "Done — vix $TAG installed"
else
  die "installed, but '$BIN_NAME --version' failed"
fi

case ":$PATH:" in
  *":$VIX_INSTALL_BIN_DIR:"*)
    hint "run: vix upgrade --check"
    hint "sdk: vix upgrade --sdk list"
    ;;
  *)
    hint "add $VIX_INSTALL_BIN_DIR to PATH"
    hint "then run: vix upgrade --sdk list"
    ;;
esac
