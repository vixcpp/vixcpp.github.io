#!/usr/bin/env sh
set -eu

# minisign public key (ONLY the base64 key, without the comment line)
MINISIGN_PUBKEY="RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ"

REPO="${VIX_REPO:-vixcpp/vix}"
VERSION="${VIX_VERSION:-latest}"   # "latest" or "vX.Y.Z"

# install kind: sdk or cli
INSTALL_KIND="${VIX_INSTALL_KIND:-sdk}"

# SDK installs a full prefix, CLI installs only the binary
PREFIX_DIR="${VIX_INSTALL_PREFIX:-$HOME/.local}"
BIN_DIR="${VIX_INSTALL_BIN_DIR:-$HOME/.local/bin}"
BIN_NAME="vix"

die() { printf "vix install: %s\n" "$*" >&2; exit 1; }
info() { printf "vix install: %s\n" "$*" >&2; }

have() { command -v "$1" >/dev/null 2>&1; }
need_cmd() { have "$1" || die "missing dependency: $1"; }

fetch() {
  url="$1"
  out="$2"
  if have curl; then
    curl -fsSL "$url" -o "$out" >/dev/null 2>&1
  elif have wget; then
    wget -qO "$out" "$url" >/dev/null 2>&1
  else
    die "need curl or wget"
  fi
}

need_cmd uname
need_cmd mktemp
need_cmd tar

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"

case "$os" in
  linux)  OS="linux" ;;
  darwin) OS="macos" ;;
  *) die "unsupported OS: $os (only Linux/macOS supported by install.sh)" ;;
esac

case "$arch" in
  x86_64|amd64) ARCH="x86_64" ;;
  arm64|aarch64) ARCH="aarch64" ;;
  *) die "unsupported CPU arch: $arch" ;;
esac

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t vix)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT INT TERM

resolve_version() {
  if [ "$VERSION" = "latest" ]; then
    have curl || die "curl is required to resolve latest (or set VIX_VERSION=vX.Y.Z)"
    final="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest")"
    tag="${final##*/}"
    [ -n "$tag" ] || die "could not resolve latest version"
    printf "%s" "$tag"
  else
    printf "%s" "$VERSION"
  fi
}

TAG="$(resolve_version)"
info "repo=$REPO version=$TAG os=$OS arch=$ARCH kind=$INSTALL_KIND"

case "$INSTALL_KIND" in
  sdk)
    ASSET="vix-sdk-${OS}-${ARCH}.tar.gz"
    ;;
  cli)
    ASSET="vix-${OS}-${ARCH}.tar.gz"
    ;;
  *)
    die "unsupported VIX_INSTALL_KIND='$INSTALL_KIND' (expected sdk or cli)"
    ;;
esac

BASE_URL="https://github.com/${REPO}/releases/download/${TAG}"
URL_BIN="${BASE_URL}/${ASSET}"
URL_SHA="${URL_BIN}.sha256"
URL_MINISIG="${URL_BIN}.minisig"

ARCHIVE_PATH="${TMP_DIR}/${ASSET}"
SHA_PATH="${TMP_DIR}/${ASSET}.sha256"
SIG_PATH="${TMP_DIR}/${ASSET}.minisig"
EXTRACT_DIR="${TMP_DIR}/extract"

info "downloading: $URL_BIN"
fetch "$URL_BIN" "$ARCHIVE_PATH" || die "download failed"

info "trying sha256 verification..."
if fetch "$URL_SHA" "$SHA_PATH"; then
  if ! have sha256sum && ! have shasum; then
    die "need sha256sum (Linux) or shasum (macOS) for verification"
  fi

  expected="$(
    awk '
      /^[0-9a-fA-F]{64}/ { print $1; exit }
      /^SHA256 \(/ { print $NF; exit }
    ' "$SHA_PATH"
  )"
  [ -n "$expected" ] || die "invalid sha256 file"

  if have sha256sum; then
    actual="$(sha256sum "$ARCHIVE_PATH" | awk '{print $1}')"
  else
    actual="$(shasum -a 256 "$ARCHIVE_PATH" | awk '{print $1}')"
  fi

  [ "$expected" = "$actual" ] || die "sha256 mismatch"
  info "sha256 ok"
else
  info "sha256 file not found"
fi

info "trying minisign verification..."
if fetch "$URL_MINISIG" "$SIG_PATH"; then
  if have minisign; then
    if minisign -Vm "$ARCHIVE_PATH" -P "$MINISIGN_PUBKEY" >/dev/null 2>&1; then
      info "minisign ok"
    else
      die "minisign verification failed"
    fi
  else
    info "minisig is published but minisign is not installed"
    info "continuing because archive download already succeeded"
  fi
else
  info "minisig not found"
fi

mkdir -p "$EXTRACT_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$EXTRACT_DIR"

if [ "$INSTALL_KIND" = "cli" ]; then
  mkdir -p "$BIN_DIR"

  [ -f "${EXTRACT_DIR}/${BIN_NAME}" ] || die "archive does not contain '${BIN_NAME}'"

  chmod +x "${EXTRACT_DIR}/${BIN_NAME}"
  dest="${BIN_DIR}/${BIN_NAME}"

  info "installing CLI to: $dest"
  mv -f "${EXTRACT_DIR}/${BIN_NAME}" "$dest"
else
  mkdir -p "$PREFIX_DIR" "$BIN_DIR"

  info "installing SDK to: $PREFIX_DIR"
  cp -R "${EXTRACT_DIR}/." "$PREFIX_DIR/"

  if [ -f "${PREFIX_DIR}/bin/${BIN_NAME}" ]; then
    target="${PREFIX_DIR}/bin/${BIN_NAME}"
  elif [ -f "${PREFIX_DIR}/install/bin/${BIN_NAME}" ]; then
    target="${PREFIX_DIR}/install/bin/${BIN_NAME}"
  else
    target="$(find "$PREFIX_DIR" -type f -path "*/bin/${BIN_NAME}" 2>/dev/null | head -n 1 || true)"
  fi

  [ -n "$target" ] || die "could not find installed '${BIN_NAME}' in SDK"

  chmod +x "$target"
  ln -sf "$target" "${BIN_DIR}/${BIN_NAME}"
  dest="${BIN_DIR}/${BIN_NAME}"

  info "linked CLI to: $dest"
fi

if "$dest" --version >/dev/null 2>&1; then
  info "installed: $("$dest" --version 2>/dev/null || true)"
else
  info "installed, but running 'vix --version' failed (PATH or runtime issue)"
fi

case ":$PATH:" in
  *":$BIN_DIR:"*) : ;;
  *)
    info "NOTE: '$BIN_DIR' is not in your PATH."
    info "Add this to your shell config:"
    info "  export PATH=\"$BIN_DIR:\$PATH\""
    ;;
esac

info "done"
