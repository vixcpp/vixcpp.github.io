# Vix.cpp installer for Windows PowerShell
# Usage:
#   irm https://vixcpp.com/install.ps1 | iex
#
# Optional:
#   $env:VIX_VERSION="v2.5.5"
#   $env:VIX_REPO="vixcpp/vix"
#   $env:VIX_INSTALL_KIND="sdk"   # sdk or cli
#   $env:VIX_INSTALL_PREFIX="$env:LOCALAPPDATA\Vix"
#   $env:VIX_INSTALL_DIR="$env:LOCALAPPDATA\Vix\bin"

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Info($msg) {
  Write-Host "› vix: $msg"
}

function Ok($msg) {
  Write-Host "✔ vix: $msg" -ForegroundColor Green
}

function Warn($msg) {
  Write-Host "! vix: $msg" -ForegroundColor Yellow
}

function Die($msg) {
  throw "✖ vix: $msg"
}

function Show-Help {
  Write-Host @"
Vix.cpp installer

Usage:
  install.ps1              Install Vix SDK
  install.ps1 --cli-only   Install CLI only
  install.ps1 --sdk        Install SDK

Environment:
  VIX_VERSION              Release version. Example: v2.5.5. Default: latest
  VIX_REPO                 GitHub repo. Default: vixcpp/vix
  VIX_INSTALL_KIND         sdk or cli. Default: sdk
  VIX_INSTALL_PREFIX       SDK install prefix. Default: %LOCALAPPDATA%\Vix
  VIX_INSTALL_DIR          CLI bin dir. Default: %LOCALAPPDATA%\Vix\bin
"@
}

foreach ($arg in $args) {
  switch ($arg) {
    "--cli-only" {
      $env:VIX_INSTALL_KIND = "cli"
    }
    "--sdk" {
      $env:VIX_INSTALL_KIND = "sdk"
    }
    "--help" {
      Show-Help
      exit 0
    }
    "-h" {
      Show-Help
      exit 0
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

$InstallKind = if ($env:VIX_INSTALL_KIND) {
  $env:VIX_INSTALL_KIND
} else {
  "sdk"
}

$PrefixDir = if ($env:VIX_INSTALL_PREFIX) {
  $env:VIX_INSTALL_PREFIX
} else {
  Join-Path $env:LOCALAPPDATA "Vix"
}

$BinDir = if ($env:VIX_INSTALL_DIR) {
  $env:VIX_INSTALL_DIR
} else {
  Join-Path $PrefixDir "bin"
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

function Download-And-Verify-Asset([string]$baseUrl, [string]$asset, [string]$tmpDir) {
  $archivePath = Join-Path $tmpDir $asset
  $shaPath = Join-Path $tmpDir ($asset + ".sha256")

  Info "downloading $asset"

  Invoke-WebRequest -Uri "$baseUrl/$asset" -OutFile $archivePath
  Invoke-WebRequest -Uri "$baseUrl/$asset.sha256" -OutFile $shaPath

  Verify-Checksum $archivePath $shaPath

  return $archivePath
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

  Expand-Archive -LiteralPath $archivePath -DestinationPath $extractDir -Force

  $exeCandidate = Get-ChildItem -LiteralPath $extractDir -Recurse -File -Filter $BinName |
    Select-Object -First 1

  if (-not $exeCandidate) {
    Die "archive does not contain $BinName"
  }

  $exe = Join-Path $BinDir $BinName

  Copy-Item -LiteralPath $exeCandidate.FullName -Destination $exe -Force

  return $exe
}

function Install-Sdk([string]$archivePath, [string]$tmpDir) {
  $extractDir = Join-Path $tmpDir "sdk"

  New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
  New-Item -ItemType Directory -Force -Path $PrefixDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

  Expand-Archive -LiteralPath $archivePath -DestinationPath $extractDir -Force

  Get-ChildItem -Path $extractDir -Force | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $PrefixDir -Recurse -Force
  }

  $exeCandidate = Get-ChildItem -Path $PrefixDir -Recurse -File -Filter $BinName |
    Where-Object { $_.FullName -match '[\\/](bin)[\\/].*vix\.exe$' } |
    Select-Object -First 1

  if (-not $exeCandidate) {
    $exeCandidate = Get-ChildItem -Path $PrefixDir -Recurse -File -Filter $BinName |
      Select-Object -First 1
  }

  if (-not $exeCandidate) {
    Die "SDK archive does not contain $BinName"
  }

  $exe = Join-Path $BinDir $BinName

  Copy-Item -LiteralPath $exeCandidate.FullName -Destination $exe -Force

  return $exe
}

$Arch = Detect-Architecture
$Tag = if ($Version -eq "latest") {
  Resolve-LatestTag $Repo
} else {
  $Version
}

switch ($InstallKind.ToLowerInvariant()) {
  "sdk" {
    $Asset = "vix-sdk-windows-$Arch.zip"
  }
  "cli" {
    $Asset = "vix-windows-$Arch.zip"
  }
  default {
    Die "unsupported VIX_INSTALL_KIND: $InstallKind"
  }
}

$BaseUrl = "https://github.com/$Repo/releases/download/$Tag"

$TmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("vix-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

try {
  Write-Host ""
  Write-Host "Vix.cpp" -ForegroundColor Green
  Info "installing $Tag ($InstallKind, windows-$Arch)"

  $ArchivePath = Download-And-Verify-Asset $BaseUrl $Asset $TmpDir

  if ($InstallKind.ToLowerInvariant() -eq "cli") {
    $Exe = Install-Cli $ArchivePath $TmpDir
  } else {
    $Exe = Install-Sdk $ArchivePath $TmpDir
  }

  $PathAlreadyReady = Add-To-UserPath $BinDir

  try {
    & $Exe --version *> $null
    Ok "installed $Tag"
  } catch {
    Warn "installed, but 'vix --version' failed"
  }

  if ($PathAlreadyReady) {
    Ok "ready"
  } else {
    Warn "installed, restart your terminal if 'vix' is not found"
  }
}
finally {
  Remove-Item -LiteralPath $TmpDir -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
}
