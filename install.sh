# Vix.cpp installer (Windows PowerShell) + install.json
# Usage:
#   irm https://vixcpp.com/install.ps1 | iex
# Optional:
#   $env:VIX_VERSION="v1.20.1"
#   $env:VIX_INSTALL_DIR="$env:LOCALAPPDATA\Vix\bin"
#   $env:VIX_REPO="vixcpp/vix"

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Info([string]$msg) { Write-Host "vix install: $msg" }
function Die([string]$msg)  { throw "vix install: $msg" }

$Repo       = if ($env:VIX_REPO)        { $env:VIX_REPO }        else { "vixcpp/vix" }
$Version    = if ($env:VIX_VERSION)     { $env:VIX_VERSION }     else { "latest" }
$InstallDir = if ($env:VIX_INSTALL_DIR) { $env:VIX_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "Vix\bin" }
$BinName    = "vix.exe"

$StatsDir  = Join-Path $env:LOCALAPPDATA "Vix"
$StatsFile = Join-Path $StatsDir "install.json"

function Normalize-Dir([string]$p) {
  if (-not $p) { return $p }
  try { return ([System.IO.Path]::GetFullPath($p)).TrimEnd('\') } catch { return $p.TrimEnd('\') }
}

function Resolve-LatestTag([string]$repo) {
  $api = "https://api.github.com/repos/$repo/releases/latest"
  try {
    $resp = Invoke-RestMethod -Uri $api -Headers @{ "User-Agent" = "vix-installer" }
    if (-not $resp.tag_name) { Die "could not resolve latest tag. Set VIX_VERSION=vX.Y.Z" }
    return [string]$resp.tag_name
  } catch {
    Die "could not resolve latest tag (GitHub API). Set VIX_VERSION=vX.Y.Z"
  }
}

function Get-RemoteContentLength([string]$url) {
  try {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method = "HEAD"
    $req.UserAgent = "vix-installer"
    $req.AllowAutoRedirect = $true
    $resp = $req.GetResponse()
    try {
      if ($resp.ContentLength -gt 0) { return [int64]$resp.ContentLength }
      return $null
    } finally { $resp.Close() }
  } catch { return $null }
}

function Format-Bytes([Int64]$bytes) {
  if ($bytes -lt 1024) { return "$bytes B" }
  $units = @("KB","MB","GB","TB")
  $v = [double]$bytes
  $i = 0
  while ($v -ge 1024 -and $i -lt $units.Length) { $v /= 1024; $i++ }
  return ("{0:N2} {1}" -f $v, $units[[Math]::Max(0,$i-1)])
}

function Extract-VersionToken([string]$verText) {
  if (-not $verText) { return $null }
  $m = [regex]::Match($verText, 'v\d+\.\d+\.\d+([-.+][0-9A-Za-z\.-]+)?')
  if ($m.Success) { return $m.Value }
  return $null
}

function Get-InstalledVersion([string]$exePath) {
  if (-not (Test-Path -LiteralPath $exePath)) { return $null }
  try {
    $raw = & $exePath --version 2>$null
    return (Extract-VersionToken ([string]$raw))
  } catch { return $null }
}

function Write-InstallStats([string]$repo, [string]$tag, [string]$arch, [string]$installDir, [Nullable[Int64]]$downloadBytes, [string]$installedVersion) {
  New-Item -ItemType Directory -Force -Path $StatsDir | Out-Null
  $obj = [ordered]@{
    repo              = $repo
    version           = $tag
    installed_version = $installedVersion
    installed_at      = [DateTime]::UtcNow.ToString("o")
    os                = "windows"
    arch              = $arch
    install_dir       = $installDir
    download_bytes    = $downloadBytes
  }
  ($obj | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath $StatsFile -Encoding UTF8
  Info "wrote stats: $StatsFile"
}

$InstallDirNorm = Normalize-Dir $InstallDir
$Exe = Join-Path $InstallDirNorm $BinName

$Arch = if ([Environment]::Is64BitOperatingSystem) {
  if ($env:PROCESSOR_ARCHITECTURE -match '^ARM' -or $env:PROCESSOR_ARCHITEW6432 -match '^ARM') { "aarch64" } else { "x86_64" }
} else { Die "unsupported OS: 32-bit Windows" }

$Tag = if ($Version -eq "latest") { Resolve-LatestTag $Repo } else { $Version }

$Asset   = "vix-windows-$Arch.zip"
$BaseUrl = "https://github.com/$Repo/releases/download/$Tag"
$UrlBin  = "$BaseUrl/$Asset"
$UrlSha  = "$UrlBin.sha256"

Info "repo=$Repo version=$Tag arch=$Arch"
Info "install_dir=$InstallDirNorm"

# Skip if already installed and matches
$installedTag = Get-InstalledVersion $Exe
if ($installedTag -and $installedTag -eq $Tag) {
  Info "already installed: $installedTag (no download needed)"
  Write-InstallStats $Repo $Tag $Arch $InstallDirNorm $null $installedTag
  Info "done"
  exit 0
}

# Temp dir unique
$TmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("vix-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

try {
  $ZipPath = Join-Path $TmpDir $Asset
  $ShaPath = Join-Path $TmpDir ($Asset + ".sha256")

  $len = Get-RemoteContentLength $UrlBin
  if ($len) { Info ("download size: {0} ({1} bytes)" -f (Format-Bytes $len), $len) }
  else { Info "download size: unknown (no Content-Length)" }

  Info "downloading: $UrlBin"
  Invoke-WebRequest -Uri $UrlBin -OutFile $ZipPath -Headers @{ "User-Agent" = "vix-installer" }

  Info "trying sha256 verification..."
  $downloadBytes = $null
  if ($len) { $downloadBytes = [int64]$len }

  $haveSha = $false
  try {
    Invoke-WebRequest -Uri $UrlSha -OutFile $ShaPath -Headers @{ "User-Agent" = "vix-installer" }
    $haveSha = $true

    $first = (Get-Content -LiteralPath $ShaPath -TotalCount 1).Trim()
    if (-not $first) { Die "invalid sha256 file" }

    $expected = $null
    if ($first -match "^[0-9a-fA-F]{64}") { $expected = ($first -split "\s+")[0] }
    elseif ($first -match "=\s*([0-9a-fA-F]{64})\s*$") { $expected = $Matches[1] }
    if (-not $expected) { Die "invalid sha256 format" }

    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $ZipPath).Hash
    if ($expected.ToLowerInvariant() -ne $actual.ToLowerInvariant()) { Die "sha256 mismatch" }

    Info "sha256 ok"
  } catch {
    if ($haveSha) { throw }
    Die "sha256 file not found ($UrlSha). refusing to install."
  }

  $ExtractDir = Join-Path $TmpDir "extract"
  New-Item -ItemType Directory -Force -Path $ExtractDir | Out-Null
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $ExtractDir -Force

  $ExeCandidate = Get-ChildItem -LiteralPath $ExtractDir -Recurse -File -Filter $BinName | Select-Object -First 1
  if (-not $ExeCandidate) { Die "archive does not contain $BinName" }

  New-Item -ItemType Directory -Force -Path $InstallDirNorm | Out-Null

  $TmpExe = Join-Path $InstallDirNorm ("$BinName.tmp." + [System.Diagnostics.Process]::GetCurrentProcess().Id)
  Copy-Item -LiteralPath $ExeCandidate.FullName -Destination $TmpExe -Force
  Move-Item -LiteralPath $TmpExe -Destination $Exe -Force

  Info "installed to $Exe"

  # Add to user PATH (idempotent)
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $userPath) { $userPath = "" }

  $segments = $userPath -split ";" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
  $already = $false
  foreach ($s in $segments) {
    if ([string]::Equals((Normalize-Dir $s), $InstallDirNorm, [System.StringComparison]::OrdinalIgnoreCase)) { $already = $true; break }
  }

  if (-not $already) {
    $newPath = ($segments + $InstallDirNorm) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Info "added to PATH (restart your terminal)"
  } else {
    Info "PATH already contains install_dir"
  }

  $installedVersion = $null
  try {
    $raw = & $Exe --version 2>$null
    $installedVersion = Extract-VersionToken ([string]$raw)
    if ($raw) { Info "version: $raw" }
  } catch { }

  if (-not $installedVersion) { $installedVersion = $Tag }

  Write-InstallStats $Repo $Tag $Arch $InstallDirNorm $downloadBytes $installedVersion

  Info "done"
}
finally {
  Remove-Item -LiteralPath $TmpDir -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
}
