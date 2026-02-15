#!/usr/bin/env sh
set -eu

# vix install.sh (stable + install.json)
# Usage:
#   curl -fsSL https://vixcpp.com/install.sh | sh
#
# Optional env:
#   VIX_REPO="vixcpp/vix"
#   VIX_VERSION="latest" or "v1.34.49"
#   VIX_INSTALL_DIR="$HOME/.local/bin"
#   VIX_STATS_FILE="$HOME/.local/share/vix/install.json"
#   VIX_REQUIRE_MINISIGN="0" or "1"
#   VIX_MINISIGN_PUBKEY="..."

MINISIGN_PUBKEY="${VIX_MINISIGN_PUBKEY:-RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ}"

REPO="${VIX_REPO:-vixcpp/vix}"
VERSION="${VIX_VERSION:-latest}"
INSTALL_DIR="${VIX_INSTALL_DIR:-$HOME/.local/bin}"
BIN_NAME="vix"

STATS_FILE="${VIX_STATS_FILE:-$HOME/.local/share/vix/install.json}"
STATS_DIR="$(dirname "$STATS_FILE")"

REQUIRE_MINISIGN="${VIX_REQUIRE_MINISIGN:-0}"

die()  { printf "vix install: error: %s\n" "$*" >&2; exit 1; }
info() { printf "vix install: %s\n" "$*" >&2; }
warn() { printf "vix install: warn: %s\n" "$*" >&2; }

have() { command -v "$1" >/dev/null 2>&1; }
need() { have "$1" || die "missing dependency: $1"; }

need uname
need mktemp
need tar
need mv
need chmod

fetch() {
  url="$1"
  out="$2"
  if have curl; then
    curl -fSsL "$url" -o "$out" >/dev/null 2>&1
  elif have wget; then
    wget -qO "$out" "$url" >/dev/null 2>&1
  else
    return 1
  fi
}

http_get() {
  url="$1"
  if have curl; then
    curl -fSsL "$url" 2>/dev/null
  elif have wget; then
    wget -qO- "$url" 2>/dev/null
  else
    return 1
  fi
}

http_head() {
  url="$1"
  if have curl; then
    curl -fsSLI "$url" 2>/dev/null
  elif have wget; then
    wget --spider -S "$url" 2>&1
  else
    return 1
  fi
}

remote_size_bytes() {
  url="$1"
  http_head "$url" \
    | awk -F': ' 'tolower($1)=="content-length"{print $2}' \
    | tr -d '\r' \
    | tail -n 1
}

human_size() {
  b="$1"
  awk -v b="$b" 'BEGIN{
    split("B KB MB GB TB",u," ");
    i=1;
    while(b>=1024 && i<5){ b/=1024; i++ }
    printf "%.2f %s", b, u[i]
  }'
}

resolve_version() {
  if [ "$VERSION" != "latest" ]; then
    printf "%s" "$VERSION"
    return 0
  fi

  tag="$(
    http_get "https://api.github.com/repos/${REPO}/releases/latest" \
      | awk -F'"' '/"tag_name"[[:space:]]*:/ { print $4; exit }' \
      || true
  )"
  [ -n "${tag:-}" ] && { printf "%s" "$tag"; return 0; }

  have curl || die "curl required to resolve latest (or set VIX_VERSION=vX.Y.Z)"
  final="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest")"
  tag="${final##*/}"
  [ -n "$tag" ] || die "could not resolve latest version"
  printf "%s" "$tag"
}

extract_version_token() {
  # last token like vX.Y.Z from `vix --version`
  printf "%s" "$1" | tr -d '\r' | awk '
    {
      for(i=NF;i>=1;i--){
        if($i ~ /^v[0-9]+\.[0-9]+\.[0-9]+([-.+].*)?$/){ print $i; exit }
      }
    }
  '
}

parse_sha_expected() {
  line="$(printf "%s" "$1" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  printf "%s" "$line" | awk '
    /^[0-9a-fA-F]{64}/ { print $1; exit }
    /^SHA256 \(/ { print $NF; exit }
    /=[[:space:]]*[0-9a-fA-F]{64}[[:space:]]*$/ { sub(/.*=[[:space:]]*/,""); print; exit }
  '
}

sha256_file() {
  file="$1"
  if have sha256sum; then
    sha256sum "$file" | awk "{print \$1}"
  elif have shasum; then
    shasum -a 256 "$file" | awk "{print \$1}"
  else
    die "need sha256sum (Linux) or shasum (macOS)"
  fi
}

# OS/ARCH
os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"

case "$os" in
  linux)  OS="linux" ;;
  darwin) OS="macos" ;;
  *) die "unsupported OS: $os (Linux/macOS only)" ;;
esac

case "$arch" in
  x86_64|amd64) ARCH="x86_64" ;;
  arm64|aarch64) ARCH="aarch64" ;;
  *) die "unsupported CPU arch: $arch" ;;
esac

TAG="$(resolve_version)"

ASSET="vix-${OS}-${ARCH}.tar.gz"
BASE_URL="https://github.com/${REPO}/releases/download/${TAG}"
URL_BIN="${BASE_URL}/${ASSET}"
URL_SHA="${URL_BIN}.sha256"
URL_SIG="${URL_BIN}.minisig"

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t vix)"
cleanup() { rm -rf "$TMP_DIR" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM

bin_tgz="${TMP_DIR}/${ASSET}"
sha_file="${TMP_DIR}/${ASSET}.sha256"
sig_file="${TMP_DIR}/${ASSET}.minisig"

dest="${INSTALL_DIR}/${BIN_NAME}"

info "repo=$REPO version=$TAG os=$OS arch=$ARCH"
info "install_dir=$INSTALL_DIR"
info "asset=$ASSET"
info "url=$URL_BIN"

# Skip if already installed and matches
if [ -x "$dest" ]; then
  installed_raw="$("$dest" --version 2>/dev/null || true)"
  installed_tag="$(extract_version_token "$installed_raw" || true)"
  if [ -n "${installed_tag:-}" ] && [ "$installed_tag" = "$TAG" ]; then
    info "already installed: $installed_tag (no download needed)"
    mkdir -p "$STATS_DIR" || true
    cat > "$STATS_FILE" <<EOF
{
  "repo": "$REPO",
  "version": "$TAG",
  "installed_version": "$installed_tag",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "os": "$OS",
  "arch": "$ARCH",
  "install_dir": "$INSTALL_DIR",
  "download_bytes": null,
  "asset_url": "$URL_BIN"
}
EOF
    info "wrote stats: $STATS_FILE"
    exit 0
  fi
fi

# Download size (best effort)
size_b="$(remote_size_bytes "$URL_BIN" || true)"
download_bytes="null"
if [ -n "${size_b:-}" ] && printf "%s" "$size_b" | awk 'BEGIN{ok=1} /^[0-9]+$/ {ok=0} END{exit ok}'; then
  info "download_size=$(human_size "$size_b") (${size_b} bytes)"
  download_bytes="$size_b"
else
  info "download_size=unknown"
fi

# Download
info "downloading..."
fetch "$URL_BIN" "$bin_tgz" || die "download failed"

# SHA256 required
info "verifying sha256..."
fetch "$URL_SHA" "$sha_file" || die "sha256 file not found ($URL_SHA). refusing to install."

first="$(head -n 1 "$sha_file" || true)"
expected="$(parse_sha_expected "$first")"
[ -n "${expected:-}" ] || die "invalid sha256 format"

actual="$(sha256_file "$bin_tgz")"
[ "$(printf "%s" "$expected" | tr '[:upper:]' '[:lower:]')" = "$(printf "%s" "$actual" | tr '[:upper:]' '[:lower:]')" ] \
  || die "sha256 mismatch"
info "sha256 ok"

# Minisign optional (strict if VIX_REQUIRE_MINISIGN=1)
if fetch "$URL_SIG" "$sig_file"; then
  if have minisign; then
    if minisign -Vm "$bin_tgz" -P "$MINISIGN_PUBKEY" >/dev/null 2>&1; then
      info "minisign ok"
    else
      if [ "$REQUIRE_MINISIGN" = "1" ]; then
        die "minisign verification failed (VIX_REQUIRE_MINISIGN=1)"
      fi
      warn "minisign verification failed (sha256 ok)"
    fi
  else
    if [ "$REQUIRE_MINISIGN" = "1" ]; then
      die "minisig exists but minisign is not installed (VIX_REQUIRE_MINISIGN=1)"
    fi
    warn "minisig exists but minisign is not installed (sha256 ok)"
  fi
else
  if [ "$REQUIRE_MINISIGN" = "1" ]; then
    die "minisig not found (VIX_REQUIRE_MINISIGN=1)"
  fi
  info "minisig not found (sha256 ok)"
fi

# Extract + atomic install
info "extracting..."
mkdir -p "$INSTALL_DIR"
tar -xzf "$bin_tgz" -C "$TMP_DIR" || die "failed to extract archive"
[ -f "${TMP_DIR}/${BIN_NAME}" ] || die "archive does not contain '${BIN_NAME}'"

chmod +x "${TMP_DIR}/${BIN_NAME}" || true

tmp_dest="${dest}.tmp.$$"
info "installing to: $dest"
mv -f "${TMP_DIR}/${BIN_NAME}" "$tmp_dest"
mv -f "$tmp_dest" "$dest"

installed_raw="$("$dest" --version 2>/dev/null || true)"
installed_version="$(extract_version_token "$installed_raw" || true)"
[ -n "${installed_version:-}" ] || installed_version="$TAG"

mkdir -p "$STATS_DIR" || die "cannot create stats dir: $STATS_DIR"
cat > "$STATS_FILE" <<EOF
{
  "repo": "$REPO",
  "version": "$TAG",
  "installed_version": "$installed_version",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "os": "$OS",
  "arch": "$ARCH",
  "install_dir": "$INSTALL_DIR",
  "download_bytes": $download_bytes,
  "asset_url": "$URL_BIN"
}
EOF

info "installed to $dest"
info "wrote stats: $STATS_FILE"

case ":$PATH:" in
  *":$INSTALL_DIR:"*) : ;;
  *)
    warn "PATH missing install_dir"
    info "add to your shell config:"
    info "  export PATH=\"$INSTALL_DIR:\$PATH\""
    ;;
esac

info "done"
