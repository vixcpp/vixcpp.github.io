#!/usr/bin/env bash
set -euo pipefail

info() { echo "vix install: $*"; }
die()  { echo "vix install: $*" >&2; exit 1; }

REPO="${VIX_REPO:-vixcpp/vix}"
VERSION="${VIX_VERSION:-latest}"
INSTALL_DIR="${VIX_INSTALL_DIR:-$HOME/.local/bin}"
BIN_NAME="vix"

STATS_DIR="$HOME/.local/share/vix"
STATS_FILE="$STATS_DIR/install.json"

need_cmd() { command -v "$1" >/dev/null 2>&1; }

detect_os() {
  case "$(uname -s)" in
    Linux)  echo "linux" ;;
    Darwin) echo "macos" ;;
    *) die "unsupported OS: $(uname -s)" ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "x86_64" ;;
    aarch64|arm64) echo "aarch64" ;;
    *) die "unsupported arch: $(uname -m)" ;;
  esac
}

http_get() {
  local url="$1"
  if need_cmd curl; then
    curl -fsSL "$url"
  elif need_cmd wget; then
    wget -qO- "$url"
  else
    die "need curl or wget"
  fi
}

resolve_latest_tag() {
  local api="https://api.github.com/repos/$REPO/releases/latest"
  local body
  body="$(http_get "$api" || true)"
  [[ -n "$body" ]] || die "could not resolve latest tag (GitHub API). Set VIX_VERSION=vX.Y.Z"

  # extract "tag_name":"vX.Y.Z"
  local tag
  tag="$(printf "%s" "$body" | tr -d '\r' | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p' | head -n 1)"
  [[ -n "$tag" ]] || die "could not resolve latest tag. Set VIX_VERSION=vX.Y.Z"
  echo "$tag"
}

parse_sha_expected() {
  # accepts: "<sha>  file" OR "SHA256 (file) = <sha>"
  local line="$1"
  line="$(echo "$line" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  if echo "$line" | grep -Eq '^[0-9a-fA-F]{64}'; then
    echo "$line" | awk '{print $1}'
    return
  fi
  echo "$line" | sed -n 's/.*=\s*\([0-9a-fA-F]\{64\}\)\s*$/\1/p'
}

sha256_file() {
  local file="$1"
  if need_cmd sha256sum; then
    sha256sum "$file" | awk '{print $1}'
  elif need_cmd shasum; then
    shasum -a 256 "$file" | awk '{print $1}'
  else
    die "need sha256sum (Linux) or shasum (macOS)"
  fi
}

main() {
  local os arch tag asset base url_bin url_sha url_sig
  os="$(detect_os)"
  arch="$(detect_arch)"

  if [[ "$VERSION" == "latest" ]]; then
    tag="$(resolve_latest_tag)"
  else
    tag="$VERSION"
  fi

  asset="vix-$os-$arch.tar.gz"
  base="https://github.com/$REPO/releases/download/$tag"
  url_bin="$base/$asset"
  url_sha="$url_bin.sha256"
  url_sig="$url_bin.minisig"

  info "repo=$REPO version=$tag os=$os arch=$arch"
  info "install_dir=$INSTALL_DIR"
  info "asset=$asset"
  info "url=$url_bin"

  mkdir -p "$INSTALL_DIR" || die "cannot create install dir: $INSTALL_DIR"
  mkdir -p "$STATS_DIR" || die "cannot create stats dir: $STATS_DIR"

  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp" >/dev/null 2>&1 || true' EXIT

  local archive="$tmp/$asset"
  local sha_path="$tmp/$asset.sha256"
  local sig_path="$tmp/$asset.minisig"
  local extract_dir="$tmp/extract"

  info "downloading..."
  http_get "$url_bin" > "$archive" || die "download failed"

  info "verifying sha256..."
  http_get "$url_sha" > "$sha_path" || die "sha256 file not found ($url_sha). refusing to install."

  local first expected actual
  first="$(head -n 1 "$sha_path" || true)"
  expected="$(parse_sha_expected "$first")"
  [[ -n "$expected" ]] || die "invalid sha256 format"

  actual="$(sha256_file "$archive")"
  [[ "${expected,,}" == "${actual,,}" ]] || die "sha256 mismatch"
  info "sha256 ok"

  # minisign optional: verify only if minisign exists AND minisig exists
  if need_cmd minisign; then
    if http_get "$url_sig" > "$sig_path" 2>/dev/null; then
      local pubkey="RWTB+/RzT24X6uPqrPGKrqODmbchU4N1G00fWzQSUc+qkz7pBUnEys58"
      minisign -Vm "$archive" -P "$pubkey" >/dev/null 2>&1 || die "minisign verification failed"
      info "minisign ok"
    else
      info "minisig not found (sha256 already verified)"
    fi
  else
    info "minisign not installed (optional; sha256 already verified)"
  fi

  info "extracting..."
  mkdir -p "$extract_dir"
  tar -xzf "$archive" -C "$extract_dir" || die "failed to extract archive"

  local bin="$extract_dir/$BIN_NAME"
  if [[ ! -f "$bin" ]]; then
    bin="$(find "$extract_dir" -type f -name "$BIN_NAME" 2>/dev/null | head -n 1 || true)"
  fi
  [[ -f "$bin" ]] || die "archive does not contain $BIN_NAME"

  chmod +x "$bin" || true

  local dest="$INSTALL_DIR/$BIN_NAME"
  local staged="$INSTALL_DIR/$BIN_NAME.tmp.$$"
  cp -f "$bin" "$staged" || die "failed to stage binary"
  chmod +x "$staged" || true
  mv -f "$staged" "$dest" || die "failed to install to $dest"

  local installed_version
  installed_version="$("$dest" --version 2>/dev/null | tr -d '\r' | sed -n 's/.*\(v[0-9]\+\.[0-9]\+\.[0-9]\+\([-.+][0-9A-Za-z\.-]\+\)\?\).*/\1/p' | tail -n 1)"
  [[ -n "$installed_version" ]] || installed_version="$tag"

  cat > "$STATS_FILE" <<EOF
{
  "repo": "$REPO",
  "version": "$tag",
  "installed_version": "$installed_version",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "os": "$os",
  "arch": "$arch",
  "install_dir": "$INSTALL_DIR",
  "download_bytes": null,
  "asset_url": "$url_bin"
}
EOF

  info "installed to $dest"
  info "wrote stats: $STATS_FILE"

  if ! echo ":$PATH:" | grep -q ":$INSTALL_DIR:"; then
    echo "vix install: PATH missing install_dir"
    echo "vix install: add to your shell config:"
    echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
  fi

  info "done"
}

main "$@"
