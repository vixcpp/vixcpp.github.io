#!/usr/bin/env sh
set -eu

# Public key used to verify release archives when minisign is installed.
MINISIGN_PUBKEY="RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ"

VIX_REPO="${VIX_REPO:-vixcpp/vix}"

# "latest" means the latest release validated by the complete release CI.
VIX_VERSION="${VIX_VERSION:-latest}"

# This file must be updated only after:
# - all CI jobs succeed;
# - all release assets are uploaded;
# - checksums are uploaded;
# - installation tests succeed.
VIX_STABLE_URL="${VIX_STABLE_URL:-https://vixcpp.com/releases/stable.txt}"

# Emergency fallback used if stable.txt is unavailable, invalid,
# or points to an incomplete release.
VIX_FALLBACK_VERSION="${VIX_FALLBACK_VERSION:-v2.7.8}"

VIX_INSTALL_BIN_DIR="${VIX_INSTALL_BIN_DIR:-$HOME/.local/bin}"
VIX_INSTALL_SHARE_DIR="${VIX_INSTALL_SHARE_DIR:-$HOME/.local/share}"

BIN_NAME="vix"

TMP_DIR=""
BIN_STAGE=""
NOTE_STAGE=""
DEST=""

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

warn() {
  printf "  %s!%s  %s\n" "$C_YELLOW" "$C_RESET" "$*" >&2
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

cleanup() {
  if [ -n "${BIN_STAGE:-}" ]; then
    rm -f "$BIN_STAGE" >/dev/null 2>&1 || true
  fi

  if [ -n "${NOTE_STAGE:-}" ]; then
    rm -rf "$NOTE_STAGE" >/dev/null 2>&1 || true
  fi

  if [ -n "${TMP_DIR:-}" ]; then
    rm -rf "$TMP_DIR" >/dev/null 2>&1 || true
  fi
}

fetch() {
  url="$1"
  out="$2"

  if have curl; then
    curl \
      -fsSL \
      --retry 3 \
      --retry-delay 1 \
      --connect-timeout 15 \
      --max-time 300 \
      "$url" \
      -o "$out"
    return
  fi

  if have wget; then
    wget \
      -q \
      --tries=3 \
      --timeout=30 \
      -O "$out" \
      "$url"
    return
  fi

  return 1
}

fetch_text() {
  url="$1"

  if have curl; then
    curl \
      -fsSL \
      --retry 3 \
      --retry-delay 1 \
      --connect-timeout 15 \
      --max-time 60 \
      "$url"
    return
  fi

  if have wget; then
    wget \
      -q \
      --tries=3 \
      --timeout=30 \
      -O- \
      "$url"
    return
  fi

  return 1
}

url_exists() {
  url="$1"

  if have curl; then
    curl \
      -fsSIL \
      --retry 2 \
      --retry-delay 1 \
      --connect-timeout 15 \
      --max-time 60 \
      "$url" \
      >/dev/null 2>&1
    return
  fi

  if have wget; then
    wget \
      -q \
      --spider \
      --tries=2 \
      --timeout=30 \
      "$url" \
      >/dev/null 2>&1
    return
  fi

  return 1
}

valid_release_tag() {
  value="$1"

  printf "%s\n" "$value" |
    awk '
      /^v[0-9]+\.[0-9]+\.[0-9]+$/ {
        valid = 1
      }

      END {
        exit valid ? 0 : 1
      }
    '
}

show_help() {
  cat <<EOF
Vix.cpp installer

Usage:
  install.sh

Environment:
  VIX_VERSION
      Release version to install.

      Examples:
        latest
        v2.7.8
        v2.8.3

      Default: latest

      "latest" means the latest release validated by the complete
      Vix release CI, not necessarily the newest GitHub tag.

  VIX_STABLE_URL
      URL containing the latest validated release tag.

      Default:
        https://vixcpp.com/releases/stable.txt

  VIX_FALLBACK_VERSION
      Emergency fallback used when the stable release pointer is
      unavailable or incomplete.

      Default:
        v2.7.8

  VIX_REPO
      GitHub repository containing release assets.

      Default:
        vixcpp/vix

  VIX_INSTALL_BIN_DIR
      CLI installation directory.

      Default:
        \$HOME/.local/bin

  VIX_INSTALL_SHARE_DIR
      Runtime assets installation directory.

      Default:
        \$HOME/.local/share

After installation:
  vix upgrade
  vix upgrade --check
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
      # Kept for backward compatibility.
      # The installer installs the Vix CLI and its required runtime assets.
      ;;

    --sdk)
      die "SDK installation moved to: vix upgrade --sdk"
      ;;

    *)
      die "unknown option: $arg"
      ;;
  esac
done

need_cmd uname
need_cmd mktemp
need_cmd tar
need_cmd awk
need_cmd find
need_cmd mkdir
need_cmd rm
need_cmd cp
need_cmd mv
need_cmd chmod

if ! have curl && ! have wget; then
  die "need curl or wget"
fi

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

resolve_stable_pointer() {
  stable="$(
    fetch_text "$VIX_STABLE_URL" 2>/dev/null |
      awk '
        {
          gsub(/\r/, "", $0)
        }

        NF {
          print $1
          exit
        }
      '
  )" || return 1

  [ -n "$stable" ] || return 1
  valid_release_tag "$stable" || return 1

  printf "%s" "$stable"
}

release_is_installable() {
  tag="$1"
  base_url="https://github.com/${VIX_REPO}/releases/download/${tag}"

  valid_release_tag "$tag" || return 1

  url_exists "$base_url/$ASSET" || return 1
  url_exists "$base_url/$ASSET.sha256" || return 1

  return 0
}

resolve_version() {
  if [ "$VIX_VERSION" != "latest" ]; then
    valid_release_tag "$VIX_VERSION" \
      || die "invalid release version: $VIX_VERSION"

    release_is_installable "$VIX_VERSION" \
      || die "release $VIX_VERSION is incomplete for $OS/$ARCH"

    printf "%s" "$VIX_VERSION"
    return
  fi

  stable="$(resolve_stable_pointer || true)"

  if [ -n "$stable" ]; then
    if release_is_installable "$stable"; then
      printf "%s" "$stable"
      return
    fi

    warn "validated stable release $stable is incomplete for $OS/$ARCH"
  else
    warn "could not resolve the validated stable release"
  fi

  if valid_release_tag "$VIX_FALLBACK_VERSION" &&
     [ "$VIX_FALLBACK_VERSION" != "$stable" ] &&
     release_is_installable "$VIX_FALLBACK_VERSION"; then
    step "Falling back to stable release $VIX_FALLBACK_VERSION"
    printf "%s" "$VIX_FALLBACK_VERSION"
    return
  fi

  die "no installable Vix release found for $OS/$ARCH"
}

verify_checksum() {
  archive="$1"
  sha_file="$2"

  if ! have sha256sum && ! have shasum; then
    die "need sha256sum or shasum for checksum verification"
  fi

  expected="$(
    awk '
      {
        for (i = 1; i <= NF; i++) {
          if (
            length($i) == 64 &&
            $i !~ /[^0-9a-fA-F]/
          ) {
            print tolower($i)
            exit
          }
        }
      }
    ' "$sha_file"
  )"

  [ -n "$expected" ] || die "invalid sha256 file"

  if have sha256sum; then
    actual="$(sha256sum "$archive" | awk '{print tolower($1)}')"
  else
    actual="$(shasum -a 256 "$archive" | awk '{print tolower($1)}')"
  fi

  [ -n "$actual" ] || die "could not calculate archive sha256"

  [ "$expected" = "$actual" ] || die "sha256 mismatch"
}

verify_signature() {
  archive="$1"
  sig_file="$2"

  minisign \
    -Vm "$archive" \
    -x "$sig_file" \
    -P "$MINISIGN_PUBKEY" \
    >/dev/null 2>&1 \
    || die "signature verification failed"
}

download_and_verify_asset() {
  base_url="$1"
  asset="$2"

  archive="$TMP_DIR/$asset"
  sha_file="$TMP_DIR/$asset.sha256"
  sig_file="$TMP_DIR/$asset.minisig"

  step "Downloading $asset"

  fetch "$base_url/$asset" "$archive" \
    || die "failed to download $asset"

  fetch "$base_url/$asset.sha256" "$sha_file" \
    || die "checksum not found for $asset"

  verify_checksum "$archive" "$sha_file"
  ok "sha256 verified"

  if fetch "$base_url/$asset.minisig" "$sig_file" 2>/dev/null; then
    if have minisign; then
      verify_signature "$archive" "$sig_file"
      ok "minisign verified"
    else
      hint "minisign is not installed; signature verification skipped"
    fi
  fi

  printf "%s" "$archive"
}

install_cli() {
  archive="$(download_and_verify_asset "$BASE_URL" "$ASSET")"
  extract_dir="$TMP_DIR/cli"

  rm -rf "$extract_dir"
  mkdir -p "$extract_dir"

  step "Extracting $ASSET"

  tar -xzf "$archive" -C "$extract_dir" \
    || die "failed to extract $ASSET"

  if [ -f "$extract_dir/$BIN_NAME" ]; then
    src="$extract_dir/$BIN_NAME"
  elif [ -f "$extract_dir/bin/$BIN_NAME" ]; then
    src="$extract_dir/bin/$BIN_NAME"
  else
    src="$(
      find "$extract_dir" -type f -name "$BIN_NAME" 2>/dev/null |
        awk 'NR == 1 { print; exit }'
    )"
  fi

  [ -n "$src" ] || die "$BIN_NAME not found in archive"
  [ -f "$src" ] || die "invalid $BIN_NAME executable in archive"

  note_src="$extract_dir/share/vix/note"
  note_dest="$VIX_INSTALL_SHARE_DIR/vix/note"
  note_parent="$VIX_INSTALL_SHARE_DIR/vix"

  [ -f "$note_src/index.html" ] \
    || die "missing Vix Note asset: index.html"

  [ -f "$note_src/assets/note.css" ] \
    || die "missing Vix Note asset: note.css"

  [ -f "$note_src/assets/note.js" ] \
    || die "missing Vix Note asset: note.js"

  mkdir -p "$VIX_INSTALL_BIN_DIR"
  mkdir -p "$note_parent"

  BIN_STAGE="$VIX_INSTALL_BIN_DIR/.${BIN_NAME}.install.$$"
  NOTE_STAGE="$note_parent/.note.install.$$"

  rm -f "$BIN_STAGE"
  rm -rf "$NOTE_STAGE"

  step "Preparing $VIX_INSTALL_BIN_DIR/$BIN_NAME"

  cp "$src" "$BIN_STAGE" \
    || die "failed to prepare $BIN_NAME executable"

  chmod +x "$BIN_STAGE" \
    || die "failed to make $BIN_NAME executable"

  if ! "$BIN_STAGE" --version >/dev/null 2>&1; then
    die "downloaded $BIN_NAME executable failed its version check"
  fi

  step "Preparing Vix Note assets"

  cp -R "$note_src" "$NOTE_STAGE" \
    || die "failed to prepare Vix Note assets"

  [ -f "$NOTE_STAGE/index.html" ] \
    || die "failed to prepare Vix Note index.html"

  [ -f "$NOTE_STAGE/assets/note.css" ] \
    || die "failed to prepare Vix Note note.css"

  [ -f "$NOTE_STAGE/assets/note.js" ] \
    || die "failed to prepare Vix Note note.js"

  step "Installing Vix Note assets to $note_dest"

  rm -rf "$note_dest"

  mv "$NOTE_STAGE" "$note_dest" \
    || die "failed to install Vix Note assets"

  NOTE_STAGE=""

  step "Installing to $VIX_INSTALL_BIN_DIR/$BIN_NAME"

  DEST="$VIX_INSTALL_BIN_DIR/$BIN_NAME"

  mv "$BIN_STAGE" "$DEST" \
    || die "failed to install $BIN_NAME"

  BIN_STAGE=""

  chmod +x "$DEST" \
    || die "failed to make installed $BIN_NAME executable"

  ok "Vix Note assets installed"
}

detect_platform

ASSET="vix-${OS}-${ARCH}.tar.gz"

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t vix)"

trap cleanup EXIT HUP INT TERM

printf "  ▲  %sVix.cpp%s  %sinstaller%s\n" \
  "$C_BOLD" \
  "$C_RESET" \
  "$C_DIM" \
  "$C_RESET" \
  >&2

printf "  ------------------------------------\n" >&2

TAG="$(resolve_version)"
BASE_URL="https://github.com/${VIX_REPO}/releases/download/${TAG}"

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
