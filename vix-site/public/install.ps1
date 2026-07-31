# Vix.cpp installer for Windows PowerShell
# Usage:
#   irm https://vixcpp.com/install.ps1 | iex
#
# Optional:
#   $env:VIX_VERSION="v2.7.8"
#   $env:VIX_REPO="vixcpp/vix"
#   $env:VIX_STABLE_URL="https://vixcpp.com/releases/stable.txt"
#   $env:VIX_FALLBACK_VERSION="v2.7.8"
#   $env:VIX_INSTALL_DIR="$env:LOCALAPPDATA\Vix\bin"
#   $env:VIX_INSTALL_SHARE_DIR="$env:LOCALAPPDATA\Vix\share"

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Ensure GitHub and vixcpp.com work on Windows PowerShell 5.1.
try {
  [Net.ServicePointManager]::SecurityProtocol =
    [Net.ServicePointManager]::SecurityProtocol -bor
    [Net.SecurityProtocolType]::Tls12
} catch {
  # PowerShell editions using HttpClient do not require this setting.
}

$MinisignPubkey = "RWSIfpPSznK9A1gWUc8Eg2iXXQwU5d9BYuQNKGOcoujAF2stPu5rKFjQ"
$RequestHeaders = @{ "User-Agent" = "vix-installer" }

function Step([string]$Message) {
  Write-Host "  →  $Message"
}

function Ok([string]$Message) {
  Write-Host "  ✓  $Message" -ForegroundColor Green
}

function Warn([string]$Message) {
  Write-Host "  !  $Message" -ForegroundColor Yellow
}

function Hint([string]$Message) {
  Write-Host "  ·  $Message" -ForegroundColor DarkGray
}

function Die([string]$Message) {
  Write-Host "  ✗  $Message" -ForegroundColor Red
  exit 1
}

function Show-Help {
  Write-Host @"
Vix.cpp installer

Usage:
  install.ps1

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
      unavailable, invalid, or incomplete.

      Default:
        v2.7.8

  VIX_REPO
      GitHub repository containing release assets.

      Default:
        vixcpp/vix

  VIX_INSTALL_DIR
      CLI installation directory.

      Default:
        %LOCALAPPDATA%\Vix\bin

  VIX_INSTALL_SHARE_DIR
      Runtime assets installation directory.

      Default:
        %LOCALAPPDATA%\Vix\share

After installation:
  vix upgrade
  vix upgrade --check
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
      # Kept for backward compatibility.
    }

    "--cli" {
      # Kept for backward compatibility.
    }

    "--sdk" {
      Die "SDK installation moved to: vix upgrade --sdk"
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

$StableUrl = if ($env:VIX_STABLE_URL) {
  $env:VIX_STABLE_URL
} else {
  "https://vixcpp.com/releases/stable.txt"
}

$FallbackVersion = if ($env:VIX_FALLBACK_VERSION) {
  $env:VIX_FALLBACK_VERSION
} else {
  "v2.7.8"
}

$BinDir = if ($env:VIX_INSTALL_DIR) {
  $env:VIX_INSTALL_DIR
} else {
  Join-Path $env:LOCALAPPDATA "Vix\bin"
}

$ShareDir = if ($env:VIX_INSTALL_SHARE_DIR) {
  $env:VIX_INSTALL_SHARE_DIR
} else {
  $installRoot = Split-Path -Parent $BinDir
  Join-Path $installRoot "share"
}

$BinName = "vix.exe"

function Test-ReleaseTag([string]$Tag) {
  if ([string]::IsNullOrWhiteSpace($Tag)) {
    return $false
  }

  return $Tag -match '^v[0-9]+\.[0-9]+\.[0-9]+$'
}

function Get-NativeArchitectureName {
  if ($env:PROCESSOR_ARCHITEW6432) {
    return $env:PROCESSOR_ARCHITEW6432
  }

  return $env:PROCESSOR_ARCHITECTURE
}

function Detect-Architecture {
  $archRaw = Get-NativeArchitectureName

  switch -Regex ($archRaw) {
    "^AMD64$" {
      return "x86_64"
    }

    "^ARM64$" {
      return "aarch64"
    }

    default {
      Die "unsupported architecture: $archRaw"
    }
  }
}

function Resolve-StableTag {
  try {
    $response = Invoke-WebRequest `
      -Uri $StableUrl `
      -Headers $RequestHeaders `
      -UseBasicParsing

    $lines = ([string]$response.Content) -split '\r?\n'

    $tag = $lines |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ -ne "" } |
      Select-Object -First 1

    if (-not (Test-ReleaseTag $tag)) {
      return $null
    }

    return $tag
  } catch {
    return $null
  }
}

function Test-UrlExists([string]$Url) {
  try {
    Invoke-WebRequest `
      -Uri $Url `
      -Method Head `
      -MaximumRedirection 10 `
      -Headers $RequestHeaders `
      -UseBasicParsing |
      Out-Null

    return $true
  } catch {
    return $false
  }
}

function Test-ReleaseInstallable(
  [string]$Tag,
  [string]$Repository,
  [string]$AssetName
) {
  if (-not (Test-ReleaseTag $Tag)) {
    return $false
  }

  $baseUrl = "https://github.com/$Repository/releases/download/$Tag"

  if (-not (Test-UrlExists "$baseUrl/$AssetName")) {
    return $false
  }

  if (-not (Test-UrlExists "$baseUrl/$AssetName.sha256")) {
    return $false
  }

  return $true
}

function Resolve-Version(
  [string]$RequestedVersion,
  [string]$Repository,
  [string]$AssetName
) {
  if ($RequestedVersion -ne "latest") {
    if (-not (Test-ReleaseTag $RequestedVersion)) {
      Die "invalid release version: $RequestedVersion"
    }

    if (-not (Test-ReleaseInstallable $RequestedVersion $Repository $AssetName)) {
      Die "release $RequestedVersion is incomplete for windows/$Arch"
    }

    return $RequestedVersion
  }

  $stable = Resolve-StableTag

  if ($stable) {
    if (Test-ReleaseInstallable $stable $Repository $AssetName) {
      return $stable
    }

    Warn "validated stable release $stable is incomplete for windows/$Arch"
  } else {
    Warn "could not resolve the validated stable release"
  }

  if (
    (Test-ReleaseTag $FallbackVersion) -and
    ($FallbackVersion -ne $stable) -and
    (Test-ReleaseInstallable $FallbackVersion $Repository $AssetName)
  ) {
    Step "Falling back to stable release $FallbackVersion"
    return $FallbackVersion
  }

  Die "no installable Vix release found for windows/$Arch"
}

function Verify-Checksum([string]$ArchivePath, [string]$ShaPath) {
  $first = (Get-Content -LiteralPath $ShaPath -TotalCount 1).Trim()

  if (-not $first) {
    Die "invalid sha256 file"
  }

  $expected = $null

  if ($first -match "^([0-9a-fA-F]{64})(?:\s+.*)?$") {
    $expected = $Matches[1]
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
}

function Verify-Signature([string]$ArchivePath, [string]$SigPath) {
  $minisign = Get-Command minisign -ErrorAction SilentlyContinue

  if (-not $minisign) {
    Hint "minisign is not installed; signature verification skipped"
    return
  }

  & $minisign.Path `
    -Vm $ArchivePath `
    -x $SigPath `
    -P $MinisignPubkey `
    *> $null

  if ($LASTEXITCODE -ne 0) {
    Die "signature verification failed"
  }

  Ok "minisign verified"
}

function Download-And-Verify-Asset(
  [string]$BaseUrl,
  [string]$AssetName,
  [string]$TmpDir
) {
  $archivePath = Join-Path $TmpDir $AssetName
  $shaPath = Join-Path $TmpDir ($AssetName + ".sha256")
  $sigPath = Join-Path $TmpDir ($AssetName + ".minisig")

  $assetUrl = "$BaseUrl/$AssetName"
  $shaUrl = "$BaseUrl/$AssetName.sha256"
  $sigUrl = "$BaseUrl/$AssetName.minisig"

  Step "Downloading $AssetName"

  try {
    Invoke-WebRequest `
      -Uri $assetUrl `
      -OutFile $archivePath `
      -Headers $RequestHeaders `
      -UseBasicParsing |
      Out-Null
  } catch {
    Die "release asset not found: $AssetName"
  }

  try {
    Invoke-WebRequest `
      -Uri $shaUrl `
      -OutFile $shaPath `
      -Headers $RequestHeaders `
      -UseBasicParsing |
      Out-Null
  } catch {
    Die "checksum file not found: $AssetName.sha256"
  }

  Verify-Checksum $archivePath $shaPath
  Ok "sha256 verified"

  $signatureDownloaded = $false

  try {
    Invoke-WebRequest `
      -Uri $sigUrl `
      -OutFile $sigPath `
      -Headers $RequestHeaders `
      -UseBasicParsing |
      Out-Null

    $signatureDownloaded = $true
  } catch {
    $signatureDownloaded = $false
  }

  if ($signatureDownloaded) {
    Verify-Signature $archivePath $sigPath
  }

  return $archivePath
}

function Install-SqliteDll([string]$InstallBin, [string]$TmpDir) {
  $sqliteDll = Join-Path $InstallBin "sqlite3.dll"

  if (Test-Path -LiteralPath $sqliteDll -PathType Leaf) {
    return
  }

  $archRaw = Get-NativeArchitectureName

  switch -Regex ($archRaw) {
    "^AMD64$" {
      $sqliteAsset = "sqlite-dll-win-x64-3530200.zip"
    }

    "^ARM64$" {
      $sqliteAsset = "sqlite-dll-win-arm64-3530200.zip"
    }

    "^x86$" {
      $sqliteAsset = "sqlite-dll-win-x86-3530200.zip"
    }

    default {
      Hint "sqlite runtime skipped: unsupported architecture $archRaw"
      return
    }
  }

  $sqliteUrl = "https://www.sqlite.org/2026/$sqliteAsset"
  $sqliteDir = Join-Path $TmpDir "sqlite"
  $sqliteZip = Join-Path $sqliteDir $sqliteAsset

  New-Item -ItemType Directory -Force -Path $sqliteDir | Out-Null
  New-Item -ItemType Directory -Force -Path $InstallBin | Out-Null

  Step "Installing SQLite runtime"

  try {
    Invoke-WebRequest `
      -Uri $sqliteUrl `
      -OutFile $sqliteZip `
      -Headers $RequestHeaders `
      -UseBasicParsing |
      Out-Null
  } catch {
    Hint "sqlite runtime skipped"
    return
  }

  try {
    Expand-Archive `
      -LiteralPath $sqliteZip `
      -DestinationPath $sqliteDir `
      -Force
  } catch {
    Hint "sqlite runtime skipped"
    return
  }

  $dllCandidate = Get-ChildItem `
    -LiteralPath $sqliteDir `
    -Recurse `
    -File `
    -Filter "sqlite3.dll" |
    Select-Object -First 1

  if (-not $dllCandidate) {
    Hint "sqlite runtime skipped"
    return
  }

  Copy-Item `
    -LiteralPath $dllCandidate.FullName `
    -Destination $sqliteDll `
    -Force

  if (Test-Path -LiteralPath $sqliteDll -PathType Leaf) {
    Ok "sqlite3.dll installed"
  }
}

function Add-To-UserPath([string]$PathToAdd) {
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")

  if (-not $userPath) {
    $userPath = ""
  }

  $segments = @(
    $userPath -split ";" |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne "" }
  )

  foreach ($segment in $segments) {
    if ([string]::Equals(
      $segment.TrimEnd("\"),
      $PathToAdd.TrimEnd("\"),
      [System.StringComparison]::OrdinalIgnoreCase
    )) {
      return $true
    }
  }

  $newPath = (@($segments) + $PathToAdd) -join ";"
  [Environment]::SetEnvironmentVariable("Path", $newPath, "User")

  return $false
}

function Install-Cli(
  [string]$ArchivePath,
  [string]$TmpDir
) {
  $extractDir = Join-Path $TmpDir "cli"

  New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
  New-Item -ItemType Directory -Force -Path $ShareDir | Out-Null

  Step "Extracting $Asset"

  try {
    Expand-Archive `
      -LiteralPath $ArchivePath `
      -DestinationPath $extractDir `
      -Force
  } catch {
    Die "failed to extract $Asset"
  }

  $exeCandidate = Get-ChildItem `
    -LiteralPath $extractDir `
    -Recurse `
    -File `
    -Filter $BinName |
    Select-Object -First 1

  if (-not $exeCandidate) {
    Die "CLI archive does not contain $BinName"
  }

  $noteSource = Join-Path $extractDir "share\vix\note"
  $noteDestination = Join-Path $ShareDir "vix\note"
  $noteParent = Split-Path -Parent $noteDestination

  $noteIndex = Join-Path $noteSource "index.html"
  $noteCss = Join-Path $noteSource "assets\note.css"
  $noteJs = Join-Path $noteSource "assets\note.js"

  if (-not (Test-Path -LiteralPath $noteIndex -PathType Leaf)) {
    Die "CLI archive does not contain Vix Note index.html"
  }

  if (-not (Test-Path -LiteralPath $noteCss -PathType Leaf)) {
    Die "CLI archive does not contain Vix Note note.css"
  }

  if (-not (Test-Path -LiteralPath $noteJs -PathType Leaf)) {
    Die "CLI archive does not contain Vix Note note.js"
  }

  $exe = Join-Path $BinDir $BinName

  Step "Installing to $exe"

  Copy-Item `
    -LiteralPath $exeCandidate.FullName `
    -Destination $exe `
    -Force

  Step "Installing Vix Note assets to $noteDestination"

  New-Item `
    -ItemType Directory `
    -Force `
    -Path $noteParent |
    Out-Null

  if (Test-Path -LiteralPath $noteDestination) {
    Remove-Item `
      -LiteralPath $noteDestination `
      -Recurse `
      -Force
  }

  Copy-Item `
    -LiteralPath $noteSource `
    -Destination $noteDestination `
    -Recurse `
    -Force

  $installedIndex = Join-Path $noteDestination "index.html"
  $installedCss = Join-Path $noteDestination "assets\note.css"
  $installedJs = Join-Path $noteDestination "assets\note.js"

  if (-not (Test-Path -LiteralPath $installedIndex -PathType Leaf)) {
    Die "failed to install Vix Note index.html"
  }

  if (-not (Test-Path -LiteralPath $installedCss -PathType Leaf)) {
    Die "failed to install Vix Note note.css"
  }

  if (-not (Test-Path -LiteralPath $installedJs -PathType Leaf)) {
    Die "failed to install Vix Note note.js"
  }

  Ok "Vix Note assets installed"

  return $exe
}

$Arch = Detect-Architecture
$Asset = "vix-windows-$Arch.zip"

$TmpDir = Join-Path `
  ([System.IO.Path]::GetTempPath()) `
  ("vix-" + [System.Guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

try {
  Write-Host "  ▲  " -NoNewline
  Write-Host "Vix.cpp" -NoNewline -ForegroundColor Green
  Write-Host "  installer"
  Write-Host "  ------------------------------------"

  $Tag = Resolve-Version $Version $Repo $Asset
  $BaseUrl = "https://github.com/$Repo/releases/download/$Tag"

  Write-Host "  version   $Tag"
  Write-Host "  platform  windows/$Arch"
  Write-Host ""

  $ArchivePath = Download-And-Verify-Asset $BaseUrl $Asset $TmpDir
  $Exe = Install-Cli $ArchivePath $TmpDir

  Install-SqliteDll $BinDir $TmpDir

  $PathAlreadyReady = Add-To-UserPath $BinDir

  try {
    & $Exe --version *> $null

    if ($LASTEXITCODE -ne 0) {
      throw "vix --version returned exit code $LASTEXITCODE"
    }

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
  Remove-Item `
    -LiteralPath $TmpDir `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue |
    Out-Null
}
