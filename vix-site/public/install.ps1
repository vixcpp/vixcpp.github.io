# Vix.cpp installer (Windows PowerShell)
# Usage:
#   irm https://vixcpp.com/install.ps1 | iex
#
# Optional:
#   $env:VIX_VERSION="v2.1.10"
#   $env:VIX_REPO="vixcpp/vix"
#   $env:VIX_INSTALL_KIND="sdk"   # sdk or cli
#   $env:VIX_INSTALL_PREFIX="$env:LOCALAPPDATA\Vix"
#   $env:VIX_INSTALL_DIR="$env:LOCALAPPDATA\Vix\bin"   # for cli installs or PATH link

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Title($msg) {
  Write-Host ""
  Write-Host $msg -ForegroundColor Cyan
}

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Blue
}

function Info($msg) {
  Write-Host "› vix install: $msg" -ForegroundColor Cyan
}

function Ok($msg) {
  Write-Host "✔ vix install: $msg" -ForegroundColor Green
}

function Warn($msg) {
  Write-Host "! vix install: $msg" -ForegroundColor Yellow
}

function Die($msg) {
  throw "✖ vix install: $msg"
}

Write-Title "Vix.cpp installer"
Write-Host "Native runtime and SDK installer" -ForegroundColor DarkGray

$Repo        = if ($env:VIX_REPO)         { $env:VIX_REPO }         else { "vixcpp/vix" }
$Version     = if ($env:VIX_VERSION)      { $env:VIX_VERSION }      else { "latest" }
$InstallKind = if ($env:VIX_INSTALL_KIND) { $env:VIX_INSTALL_KIND } else { "sdk" }

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
    Die "could not resolve latest tag (GitHub API). Set VIX_VERSION=vX.Y.Z"
  }
}

Write-Step "Detecting platform"

$archRaw = $env:PROCESSOR_ARCHITECTURE
$Arch = switch -Regex ($archRaw) {
  "AMD64" { "x86_64"; break }
  "^ARM"  { "aarch64"; break }
  default { Die "unsupported arch: $archRaw" }
}

$Tag = if ($Version -eq "latest") { Resolve-LatestTag $Repo } else { $Version }

$Asset = switch ($InstallKind.ToLowerInvariant()) {
  "sdk" { "vix-sdk-windows-$Arch.zip"; break }
  "cli" { "vix-windows-$Arch.zip"; break }
  default { Die "unsupported VIX_INSTALL_KIND: $InstallKind (expected sdk or cli)" }
}

$BaseUrl = "https://github.com/$Repo/releases/download/$Tag"
$UrlBin  = "$BaseUrl/$Asset"
$UrlSha  = "$UrlBin.sha256"

Ok "repo=$Repo version=$Tag arch=$Arch kind=$InstallKind"
Info "prefix=$PrefixDir"
Info "bin_dir=$BinDir"

$TmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("vix-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

try {
  $ArchivePath = Join-Path $TmpDir $Asset
  $ShaPath     = Join-Path $TmpDir ($Asset + ".sha256")
  $ExtractDir  = Join-Path $TmpDir "extract"

  Write-Step "Downloading archive"
  Info "asset: $Asset"
  Info "url: $UrlBin"
  Invoke-WebRequest -Uri $UrlBin -OutFile $ArchivePath
  Ok "archive downloaded"

  Write-Step "Verifying checksum"
  try {
    Invoke-WebRequest -Uri $UrlSha -OutFile $ShaPath

    $first = (Get-Content -LiteralPath $ShaPath -TotalCount 1).Trim()
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

    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $ArchivePath).Hash
    if ($expected.ToLowerInvariant() -ne $actual.ToLowerInvariant()) {
      Die "sha256 mismatch"
    }

    Ok "sha256 ok"
  } catch {
    Warn "sha256 file not found or verification skipped"
  }

  Write-Step "Extracting archive"
  New-Item -ItemType Directory -Force -Path $ExtractDir | Out-Null
  Expand-Archive -LiteralPath $ArchivePath -DestinationPath $ExtractDir -Force
  Ok "archive extracted"

  Write-Step "Installing"

  if ($InstallKind.ToLowerInvariant() -eq "cli") {
    $ExeCandidate = Get-ChildItem -LiteralPath $ExtractDir -Recurse -File -Filter $BinName | Select-Object -First 1
    if (-not $ExeCandidate) {
      Die "archive does not contain $BinName"
    }

    New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
    $Exe = Join-Path $BinDir $BinName

    Copy-Item -LiteralPath $ExeCandidate.FullName -Destination $Exe -Force
    Ok "CLI installed to $Exe"
  }
  else {
    New-Item -ItemType Directory -Force -Path $PrefixDir | Out-Null
    New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

    Get-ChildItem -Path $ExtractDir -Force | ForEach-Object {
      Copy-Item -Path $_.FullName -Destination $PrefixDir -Recurse -Force
    }

    $ExeCandidate = Get-ChildItem -Path $PrefixDir -Recurse -File -Filter $BinName |
      Where-Object { $_.FullName -match '[\\/](bin)[\\/].*vix\.exe$' } |
      Select-Object -First 1

    if (-not $ExeCandidate) {
      $ExeCandidate = Get-ChildItem -Path $PrefixDir -Recurse -File -Filter $BinName | Select-Object -First 1
    }

    if (-not $ExeCandidate) {
      Die "SDK archive does not contain $BinName"
    }

    $Exe = Join-Path $BinDir $BinName

    if ([string]::Equals($ExeCandidate.FullName, $Exe, [System.StringComparison]::OrdinalIgnoreCase)) {
      Info "CLI already installed at $Exe"
    } else {
      Copy-Item -LiteralPath $ExeCandidate.FullName -Destination $Exe -Force
      Info "CLI available at $Exe"
    }

    Ok "SDK installed to $PrefixDir"
  }

  Write-Step "Updating PATH"

  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $userPath) {
    $userPath = ""
  }

  $segments = $userPath -split ";" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
  $already = $false

  foreach ($s in $segments) {
    if ([string]::Equals($s.TrimEnd("\"), $BinDir.TrimEnd("\"), [System.StringComparison]::OrdinalIgnoreCase)) {
      $already = $true
      break
    }
  }

  if (-not $already) {
    $newPath = ($segments + $BinDir) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Ok "added to PATH"
    Warn "restart your terminal to use 'vix'"
  } else {
    Ok "PATH already contains bin_dir"
  }

  Write-Step "Validating installation"
  try {
    $ver = & $Exe --version 2>$null
    if ($ver) {
      Ok "installed: $ver"
    } else {
      Warn "installed, but 'vix --version' returned no output"
    }
  } catch {
    Warn "installed, but running 'vix --version' failed"
  }

  Write-Host ""
  Write-Host "Done." -ForegroundColor Green
  Write-Host ("Location: " + $Exe)
  Write-Host ("Version:  " + $Tag)
  Write-Host ("Kind:     " + $InstallKind)
}
finally {
  Remove-Item -LiteralPath $TmpDir -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
}
