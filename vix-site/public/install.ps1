# Vix.cpp installer for Windows PowerShell
# Usage:
#   irm https://vixcpp.com/install.ps1 | iex
#
# Optional:
#   $env:VIX_VERSION="v2.7.0"
#   $env:VIX_REPO="vixcpp/vix"
#   $env:VIX_INSTALL_DIR="$env:LOCALAPPDATA\Vix\bin"

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$MinisignPubkey = "RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ"

function Step($msg) {
  Write-Host "  →  $msg"
}

function Ok($msg) {
  Write-Host "  ✓  $msg" -ForegroundColor Green
}

function Hint($msg) {
  Write-Host "  ·  $msg" -ForegroundColor DarkGray
}

function Die($msg) {
  Write-Host "  ✗  $msg" -ForegroundColor Red
  exit 1
}

function Show-Help {
  Write-Host @"
Vix.cpp installer

Usage:
  install.ps1

Environment:
  VIX_VERSION          Release version. Example: v2.7.0. Default: latest
  VIX_REPO             GitHub repo. Default: vixcpp/vix
  VIX_INSTALL_DIR      CLI bin dir. Default: %LOCALAPPDATA%\Vix\bin

After install:
  vix upgrade
  vix upgrade --sdk list
  vix upgrade --sdk web
"@
}

foreach ($arg in $args) {
  switch ($arg) {
    "--help" {
      Show-Help
      exit 0
    }
    "-h" {
      Show-Help
      exit 0
    }
    "--cli-only" {
      # Kept for compatibility. The installer is CLI-only now.
    }
    "--cli" {
      # Kept for compatibility. The installer is CLI-only now.
    }
    "--sdk" {
      Die "SDK install moved to: vix upgrade --sdk"
    }
    default {
      Die "unknown option: $arg"
    }
  }
}

$Repo = if ($env:VIX_REPO) {
  $env:VIX_REPO
} else {
  "vixcpp/vix"
}

$Version = if ($env:VIX_VERSION) {
  $env:VIX_VERSION
} else {
  "latest"
}

$BinDir = if ($env:VIX_INSTALL_DIR) {
  $env:VIX_INSTALL_DIR
} else {
  Join-Path $env:LOCALAPPDATA "Vix\bin"
}

$BinName = "vix.exe"

function Resolve-LatestTag([string]$repo) {
  $api = "https://api.github.com/repos/$repo/releases/latest"

  try {
    $resp = Invoke-RestMethod -Uri $api -Headers @{ "User-Agent" = "vix-installer" }

    if (-not $resp.tag_name) {
      Die "could not resolve latest tag. Set VIX_VERSION=vX.Y.Z"
    }

    return $resp.tag_name
  } catch {
    Die "could not resolve latest tag. Set VIX_VERSION=vX.Y.Z"
  }
}

function Detect-Architecture {
  $archRaw = $env:PROCESSOR_ARCHITECTURE

  switch -Regex ($archRaw) {
    "AMD64" {
      return "x86_64"
    }
    "^ARM" {
      return "aarch64"
    }
    default {
      Die "unsupported architecture: $archRaw"
    }
  }
}

function Verify-Checksum([string]$archivePath, [string]$shaPath) {
  $first = (Get-Content -LiteralPath $shaPath -TotalCount 1).Trim()

  if (-not $first) {
    Die "invalid sha256 file"
  }

  $expected = $null

  if ($first -match "^[0-9a-fA-F]{64}") {
    $expected = ($first -split "\s+")[0]
  } elseif ($first -match "=\s*([0-9a-fA-F]{64})\s*$") {
    $expected = $Matches[1]
  }

  if (-not $expected) {
    Die "invalid sha256 format"
  }

  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash

  if ($expected.ToLowerInvariant() -ne $actual.ToLowerInvariant()) {
    Die "sha256 mismatch"
  }
}

function Verify-Signature([string]$archivePath, [string]$sigPath) {
  $minisign = Get-Command minisign -ErrorAction SilentlyContinue

  if (-not $minisign) {
    return
  }

  & minisign -Vm $archivePath -x $sigPath -P $MinisignPubkey *> $null

  if ($LASTEXITCODE -ne 0) {
    Die "signature verification failed"
  }

  Ok "minisign verified"
}

function Download-And-Verify-Asset([string]$baseUrl, [string]$asset, [string]$tmpDir) {
  $archivePath = Join-Path $tmpDir $asset
  $shaPath = Join-Path $tmpDir ($asset + ".sha256")
  $sigPath = Join-Path $tmpDir ($asset + ".minisig")

  $assetUrl = "$baseUrl/$asset"
  $shaUrl = "$baseUrl/$asset.sha256"
  $sigUrl = "$baseUrl/$asset.minisig"

  Step "Downloading $asset"

  try {
    Invoke-WebRequest -Uri $assetUrl -OutFile $archivePath
  } catch {
    Die "release asset not found: $asset"
  }

  try {
    Invoke-WebRequest -Uri $shaUrl -OutFile $shaPath
  } catch {
    Die "checksum file not found: $asset.sha256"
  }

  Verify-Checksum $archivePath $shaPath
  Ok "sha256 verified"

  try {
    Invoke-WebRequest -Uri $sigUrl -OutFile $sigPath
    Verify-Signature $archivePath $sigPath
  } catch {
    # minisign is optional for bootstrap install.
  }

  return $archivePath
}

function Install-SqliteDll([string]$installBin, [string]$tmpDir) {
  $sqliteDll = Join-Path $installBin "sqlite3.dll"

  if (Test-Path -LiteralPath $sqliteDll) {
    return
  }

  $archRaw = $env:PROCESSOR_ARCHITECTURE

  switch -Regex ($archRaw) {
    "AMD64" {
      $sqliteAsset = "sqlite-dll-win-x64-3530200.zip"
    }
    "^ARM" {
      $sqliteAsset = "sqlite-dll-win-arm64-3530200.zip"
    }
    "x86" {
      $sqliteAsset = "sqlite-dll-win-x86-3530200.zip"
    }
    default {
      Hint "sqlite runtime skipped: unsupported architecture $archRaw"
      return
    }
  }

  $sqliteUrl = "https://www.sqlite.org/2026/$sqliteAsset"
  $sqliteDir = Join-Path $tmpDir "sqlite"
  $sqliteZip = Join-Path $sqliteDir $sqliteAsset

  New-Item -ItemType Directory -Force -Path $sqliteDir | Out-Null
  New-Item -ItemType Directory -Force -Path $installBin | Out-Null

  Step "Installing SQLite runtime"

  try {
    Invoke-WebRequest -Uri $sqliteUrl -OutFile $sqliteZip
  } catch {
    Hint "sqlite runtime skipped"
    return
  }

  try {
    Expand-Archive -LiteralPath $sqliteZip -DestinationPath $sqliteDir -Force
  } catch {
    Hint "sqlite runtime skipped"
    return
  }

  $dllCandidate = Get-ChildItem -LiteralPath $sqliteDir -Recurse -File -Filter "sqlite3.dll" |
    Select-Object -First 1

  if (-not $dllCandidate) {
    Hint "sqlite runtime skipped"
    return
  }

  Copy-Item -LiteralPath $dllCandidate.FullName -Destination $sqliteDll -Force

  if (Test-Path -LiteralPath $sqliteDll) {
    Ok "sqlite3.dll installed"
  }
}

function Add-To-UserPath([string]$pathToAdd) {
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")

  if (-not $userPath) {
    $userPath = ""
  }

  $segments = $userPath -split ";" |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne "" }

  $already = $false

  foreach ($segment in $segments) {
    if ([string]::Equals(
      $segment.TrimEnd("\"),
      $pathToAdd.TrimEnd("\"),
      [System.StringComparison]::OrdinalIgnoreCase
    )) {
      $already = $true
      break
    }
  }

  if (-not $already) {
    $newPath = ($segments + $pathToAdd) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    return $false
  }

  return $true
}

function Install-Cli([string]$archivePath, [string]$tmpDir) {
  $extractDir = Join-Path $tmpDir "cli"

  New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

  Step "Installing to $BinDir\$BinName"

  Expand-Archive -LiteralPath $archivePath -DestinationPath $extractDir -Force

  $exeCandidate = Get-ChildItem -LiteralPath $extractDir -Recurse -File -Filter $BinName |
    Select-Object -First 1

  if (-not $exeCandidate) {
    Die "CLI archive does not contain $BinName"
  }

  $exe = Join-Path $BinDir $BinName

  if (-not [string]::Equals(
    $exeCandidate.FullName,
    $exe,
    [System.StringComparison]::OrdinalIgnoreCase
  )) {
    Copy-Item -LiteralPath $exeCandidate.FullName -Destination $exe -Force
  }

  return $exe
}

$Arch = Detect-Architecture

$Tag = if ($Version -eq "latest") {
  Resolve-LatestTag $Repo
} else {
  $Version
}

$Asset = "vix-windows-$Arch.zip"
$BaseUrl = "https://github.com/$Repo/releases/download/$Tag"

$TmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("vix-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

try {
  Write-Host "  ▲  " -NoNewline
  Write-Host "Vix.cpp" -NoNewline -ForegroundColor Green
  Write-Host "  installer"
  Write-Host "  ------------------------------------"
  Write-Host "  version   $Tag"
  Write-Host "  platform  windows/$Arch"
  Write-Host ""

  $ArchivePath = Download-And-Verify-Asset $BaseUrl $Asset $TmpDir
  $Exe = Install-Cli $ArchivePath $TmpDir

  Install-SqliteDll $BinDir $TmpDir

  $PathAlreadyReady = Add-To-UserPath $BinDir

  try {
    & $Exe --version *> $null
    Ok "Done — vix $Tag installed"
  } catch {
    Die "installed, but 'vix --version' failed"
  }

  if ($PathAlreadyReady) {
    Hint "run: vix upgrade --check"
    Hint "sdk: vix upgrade --sdk list"
  } else {
    Hint "restart your terminal if 'vix' is not found"
    Hint "then run: vix upgrade --sdk list"
  }
}
finally {
  Remove-Item -LiteralPath $TmpDir -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
}
