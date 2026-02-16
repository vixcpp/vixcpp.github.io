#!/usr/bin/env sh
set -eu

# minisign public key (ONLY the base64 key, without the comment line)
MINISIGN_PUBKEY="RWTB+/RzT24X6uPqrPGKrqODmbchU4N1G00fWzQSUc+qkz7pBUnEys58"

REPO="${VIX_REPO:-vixcpp/vix}"
VERSION="${VIX_VERSION:-latest}"   # "latest" or "v1.20.1"
INSTALL_DIR="${VIX_INSTALL_DIR:-$HOME/.local/bin}"
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
info "repo=$REPO version=$TAG os=$OS arch=$ARCH"

ASSET="vix-${OS}-${ARCH}.tar.gz"
BASE_URL="https://github.com/${REPO}/releases/download/${TAG}"
URL_BIN="${BASE_URL}/${ASSET}"
URL_SHA="${URL_BIN}.sha256"
URL_MINISIG="${URL_BIN}.minisig"

bin_tgz="${TMP_DIR}/${ASSET}"
sha_file="${TMP_DIR}/${ASSET}.sha256"
sig_file="${TMP_DIR}/${ASSET}.minisig"

info "downloading: $URL_BIN"
fetch "$URL_BIN" "$bin_tgz" || die "download failed"

# ---- Verification policy ----
# Require at least one verification method (sha256 or minisign).
have_sha=0
have_sig=0

info "trying sha256 verification..."
if fetch "$URL_SHA" "$sha_file"; then
  have_sha=1
  if ! have sha256sum && ! have shasum; then
    die "need sha256sum (Linux) or shasum (macOS) for verification"
  fi

  # support both formats:
  # 1) "<sha>  <file>"
  # 2) "SHA256 (file) = <sha>"
  expected="$(
    awk '
      /^[0-9a-fA-F]{64}/ { print $1; exit }
      /^SHA256 \(/ { print $NF; exit }
    ' "$sha_file"
  )"
  [ -n "$expected" ] || die "invalid sha256 file"

  if have sha256sum; then
    actual="$(sha256sum "$bin_tgz" | awk '{print $1}')"
  else
    actual="$(shasum -a 256 "$bin_tgz" | awk '{print $1}')"
  fi

  [ "$expected" = "$actual" ] || die "sha256 mismatch"
  info "sha256 ok"
else
  info "sha256 file not found"
fi

info "trying minisign verification..."
if fetch "$URL_MINISIG" "$sig_file"; then
  have_sig=1
  have minisign || die "minisig is published but minisign is not installed"
  minisign -Vm "$bin_tgz" -P "$MINISIGN_PUBKEY" >/dev/null 2>&1 \
    || die "minisign verification failed"
  info "minisign ok"
else
  info "minisig not found"
fi

if [ "$have_sha" -eq 0 ] && [ "$have_sig" -eq 0 ]; then
  die "no verification file found (.sha256 or .minisig). refusing to install."
fi

# Extract and install
mkdir -p "$INSTALL_DIR"
tar -xzf "$bin_tgz" -C "$TMP_DIR"
[ -f "${TMP_DIR}/${BIN_NAME}" ] || die "archive does not contain '${BIN_NAME}'"

chmod +x "${TMP_DIR}/${BIN_NAME}"
dest="${INSTALL_DIR}/${BIN_NAME}"
info "installing to: $dest"
mv -f "${TMP_DIR}/${BIN_NAME}" "$dest"

if "$dest" --version >/dev/null 2>&1; then
  info "installed: $("$dest" --version 2>/dev/null || true)"
else
  info "installed, but running 'vix --version' failed (PATH or runtime issue)"
fi

case ":$PATH:" in
  *":$INSTALL_DIR:"*) : ;;
  *)
    info "NOTE: '$INSTALL_DIR' is not in your PATH."
    info "Add this to your shell config:"
    info "  export PATH=\"$INSTALL_DIR:\$PATH\""
    ;;
esac

info "done"
