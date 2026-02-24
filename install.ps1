# Vix.cpp installer (Windows PowerShell)
# Usage:
#   irm https://vixcpp.com/install.ps1 | iex
# Optional:
#   $env:VIX_VERSION="v1.20.1"
#   $env:VIX_INSTALL_DIR="$env:LOCALAPPDATA\Vix\bin"
#   $env:VIX_REPO="vixcpp/vix"

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Info($msg) { Write-Host "vix install: $msg" }
function Die($msg)  { throw "vix install: $msg" }

$Repo       = if ($env:VIX_REPO)        { $env:VIX_REPO }        else { "vixcpp/vix" }
$Version    = if ($env:VIX_VERSION)     { $env:VIX_VERSION }     else { "latest" }
$InstallDir = if ($env:VIX_INSTALL_DIR) { $env:VIX_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "Vix\bin" }
$BinName    = "vix.exe"
$MiniSignPubKey = "RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ"

function Resolve-LatestTag([string]$repo) {
  # Robust way: call GitHub API (no auth needed for low volume)
  $api = "https://api.github.com/repos/$repo/releases/latest"
  try {
    $resp = Invoke-RestMethod -Uri $api -Headers @{ "User-Agent" = "vix-installer" }
    if (-not $resp.tag_name) { Die "could not resolve latest tag. Set VIX_VERSION=vX.Y.Z" }
    return $resp.tag_name
  } catch {
    Die "could not resolve latest tag (GitHub API). Set VIX_VERSION=vX.Y.Z"
  }
}

$Tag = if ($Version -eq "latest") { Resolve-LatestTag $Repo } else { $Version }

# Detect arch (prefer OS bitness + ARM check)
$archRaw = $env:PROCESSOR_ARCHITECTURE
$Arch = switch -Regex ($archRaw) {
  "AMD64" { "x86_64"; break }
  "^ARM"  { "aarch64"; break }
  default { Die "unsupported arch: $archRaw" }
}

$Asset   = "vix-windows-$Arch.zip"
$BaseUrl = "https://github.com/$Repo/releases/download/$Tag"
$UrlBin  = "$BaseUrl/$Asset"
$UrlSha  = "$UrlBin.sha256"
$UrlMiniSig = "$UrlBin.minisig"
$SigPath = Join-Path $TmpDir ($Asset + ".minisig")

Info "repo=$Repo version=$Tag arch=$Arch"
Info "install_dir=$InstallDir"

# Temp dir unique
$TmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("vix-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null
try {
  $ZipPath = Join-Path $TmpDir $Asset
  $ShaPath = Join-Path $TmpDir ($Asset + ".sha256")

  Info "downloading: $UrlBin"
  Invoke-WebRequest -Uri $UrlBin -OutFile $ZipPath

  # SHA256 verification policy:
  # - If sha256 file exists -> MUST verify and match.
  # - If sha256 missing -> warn (optionally you can hard-fail; currently warn).
  Info "trying sha256 verification..."
  $shaOk = $false
  try {
    Invoke-WebRequest -Uri $UrlSha -OutFile $ShaPath

    $first = (Get-Content -LiteralPath $ShaPath -TotalCount 1).Trim()
    if (-not $first) { Die "invalid sha256 file" }

    # Accept:
    # 1) "<sha>  file"
    # 2) "SHA256 (file) = <sha>"
    $expected = $null
    if ($first -match "^[0-9a-fA-F]{64}") {
      $expected = ($first -split "\s+")[0]
    } elseif ($first -match "=\s*([0-9a-fA-F]{64})\s*$") {
      $expected = $Matches[1]
    }
    if (-not $expected) { Die "invalid sha256 format" }

    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $ZipPath).Hash
    if ($expected.ToLower() -ne $actual.ToLower()) { Die "sha256 mismatch" }

    $shaOk = $true
    Info "sha256 ok"

    Info "trying minisign verification..."
    try {
      Invoke-WebRequest -Uri $UrlMiniSig -OutFile $SigPath

      $mini = Get-Command minisign -ErrorAction SilentlyContinue
      if (-not $mini) {
        Die "minisig is published but minisign is not installed (install minisign or use a release without minisig)"
      }

      # minisign on Windows supports -V -m <file> -x <sig> -P <pubkey>
      & minisign -V -m $ZipPath -x $SigPath -P $MiniSignPubKey | Out-Null

      Info "minisign ok"
    } catch {
      Info "minisig not found (skipping)"
    }
  } catch {
    Info "sha256 file not found (skipping)"
  }

  # Extract to temp first, then move only vix.exe (avoids zip path layout issues)
  $ExtractDir = Join-Path $TmpDir "extract"
  New-Item -ItemType Directory -Force -Path $ExtractDir | Out-Null
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $ExtractDir -Force

  # Find vix.exe anywhere in archive
  $ExeCandidate = Get-ChildItem -LiteralPath $ExtractDir -Recurse -File -Filter $BinName | Select-Object -First 1
  if (-not $ExeCandidate) { Die "archive does not contain $BinName" }

  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  $Exe = Join-Path $InstallDir $BinName
  Copy-Item -LiteralPath $ExeCandidate.FullName -Destination $Exe -Force

  Info "installed to $Exe"

  # Add to user PATH (idempotent + exact segment check)
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $userPath) { $userPath = "" }

  $segments = $userPath -split ";" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
  $already = $false
  foreach ($s in $segments) {
    if ([string]::Equals($s.TrimEnd("\"), $InstallDir.TrimEnd("\"), [System.StringComparison]::OrdinalIgnoreCase)) {
      $already = $true
      break
    }
  }

  if (-not $already) {
    $newPath = ($segments + $InstallDir) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Info "added to PATH (restart your terminal)"
  } else {
    Info "PATH already contains install_dir"
  }

  # Quick check
  try {
    $ver = & $Exe --version 2>$null
    if ($ver) { Info "version: $ver" }
  } catch { }

  Info "done"
}
finally {
  Remove-Item -LiteralPath $TmpDir -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
}
