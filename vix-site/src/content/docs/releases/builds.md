# Builds

Vix.cpp releases are published through two separate release workflows.

There are two kinds of artifacts:

- CLI artifacts
- SDK artifacts

This separation exists because the `vix` command-line tool and the full C++ SDK do not have the same purpose.

## Release workflows

Vix.cpp currently uses two release workflows:

```txt
.github/workflows/release.yml
.github/workflows/sdk-release.yml
```

## `release.yml`

`release.yml` builds and publishes the standalone `vix` CLI binary.

It is triggered when a version tag is pushed:

```txt
v*
```

It can also be triggered manually through GitHub Actions with an optional tag input.

This workflow is responsible for CLI-only release assets.

## CLI artifacts

CLI artifacts contain only the `vix` executable.

They are useful when you only need the command-line tool and do not need to compile C++ applications against the installed Vix headers and libraries.

Typical CLI assets are:

```txt
vix-linux-x86_64.tar.gz
vix-linux-aarch64.tar.gz
vix-macos-x86_64.tar.gz
vix-macos-aarch64.tar.gz
vix-windows-x86_64.tar.gz
```

The exact asset list depends on the release.

## CLI build matrix

The CLI release workflow targets:

| Platform | Architecture |
|---|---|
| Linux | x86_64 |
| Linux | aarch64 |
| macOS | x86_64 |
| macOS | aarch64 |
| Windows | x86_64 |

Use CLI artifacts when you want:

- `vix --version`
- `vix new`
- `vix run`
- `vix build`
- `vix check`
- `vix tests`
- `vix dev`
- `vix replay`
- registry and package commands

CLI-only mode is not enough if your project needs:

```cpp
#include <vix.hpp>
```

For that, install the SDK.

## `sdk-release.yml`

`sdk-release.yml` builds and publishes installable SDK archives.

It is also triggered when a version tag is pushed:

```txt
v*
```

It can also be triggered manually with an optional tag input.

This workflow is responsible for SDK release assets.

## SDK artifacts

SDK artifacts contain a complete install prefix.

They are intended for developers who want to compile Vix applications locally.

A typical SDK contains:

```txt
bin/
include/
lib/
share/
```

The SDK includes:

- the `vix` CLI
- public headers
- compiled libraries
- CMake package files
- exported CMake targets
- module headers and libraries depending on the selected variant

## Current SDK variants

The SDK release workflow currently publishes three Linux x86_64 SDK variants.

| Variant | Asset | Purpose |
|---|---|---|
| Core SDK | `vix-sdk-linux-x86_64.tar.gz` | Minimal SDK for core Vix applications |
| DB SDK | `vix-sdk-db-linux-x86_64.tar.gz` | SDK with database support |
| Full SDK | `vix-sdk-full-linux-x86_64.tar.gz` | Full SDK with the broadest module coverage |

## Core SDK

The Core SDK is the smallest SDK variant.

It is intended for applications that need the basic Vix runtime without database, ORM, or WebSocket support.

The Core SDK disables heavier modules such as:

- DB
- ORM
- WebSocket
- MySQL
- SQLite
- HTTP compression

Use this when you want a smaller local SDK and do not need advanced modules.

## DB SDK

The DB SDK enables database support.

It is intended for projects that need database features such as SQLite or MySQL support.

Use this when your application depends on Vix database APIs.

## Full SDK

The Full SDK is the recommended SDK for most developers.

It enables the broadest set of Vix modules, including:

- core
- CLI
- DB
- ORM
- WebSocket
- middleware
- P2P
- P2P HTTP
- cache
- async
- validation
- crypto
- WebRPC
- time
- tests module
- template
- process

For documentation examples and book chapters, use the Full SDK.

## Recommended install mode

For most users, the recommended install mode is SDK mode.

SDK mode is the default install mode:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

This installs the SDK and links the `vix` binary into your local bin directory.

## CLI-only install mode

CLI-only mode installs only the `vix` binary.

```bash
VIX_INSTALL_KIND=cli curl -fsSL https://vixcpp.com/install.sh | bash
```

Use CLI-only mode only when you do not need to compile Vix applications locally.

CLI-only mode is not recommended for the book because it cannot provide the installed headers and libraries required by:

```cpp
#include <vix.hpp>
```

## Windows install

On Windows, use PowerShell:

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

Windows currently uses the CLI release artifact flow.

SDK availability depends on the assets published for the release.

## Verify the CLI

After installation, verify the CLI:

```bash
vix --version
```

Expected output shape:

```txt
Vix.cpp CLI
version : 2.5.3
author  : Gaspard Kirira
source  : https://github.com/vixcpp/vix
```

## Verify the SDK

If you installed the SDK, verify that the main header exists:

```bash
find ~/.local/include -name vix.hpp 2>/dev/null
```

Expected output:

```txt
~/.local/include/vix.hpp
```

If nothing appears, you probably installed CLI-only mode or the SDK installation did not complete correctly.

Reinstall in SDK mode:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

## Verify CMake package discovery

The SDK should also provide a CMake package.

Create a small consumer project:

```cmake
cmake_minimum_required(VERSION 3.20)

project(vix_sdk_check LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Vix CONFIG REQUIRED)

add_executable(app main.cpp)

target_link_libraries(app PRIVATE vix::vix)
```

Then use:

```cpp
#include <vix.hpp>

#include <iostream>

int main()
{
  std::cout << "Vix SDK works\n";
  return 0;
}
```

Build it:

```bash
cmake -S . -B build -DCMAKE_PREFIX_PATH="$HOME/.local"
cmake --build build -j
./build/app
```

Expected output:

```txt
Vix SDK works
```

## Why SDK validation matters

The SDK release workflow validates the archive in two ways:

1. It checks that the packaged `vix` binary exists and runs.
2. It builds a real consumer CMake project using:

```cmake
find_package(Vix CONFIG REQUIRED)
target_link_libraries(app PRIVATE vix::vix)
```

This is important because previous issues were often not caused by the `vix` binary itself, but by the installed SDK layout, exported CMake targets, missing headers, or dependency resolution.

## Common issue: `#include <vix.hpp>` not found

If you see:

```txt
error: header file not found

#include <vix.hpp>
         ^
hint: check the include path and ensure the header exists
```

First check whether the SDK header is installed:

```bash
find ~/.local/include -name vix.hpp 2>/dev/null
```

If it is missing, reinstall the SDK:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

Do not use CLI-only mode for projects that include Vix headers.

## Common issue: `vix run` still uses an old SDK

If you recently reinstalled Vix and `vix run` still fails with old CMake or dependency errors, clear the old script cache.

Older versions of Vix could reuse stale script build directories after an SDK reinstall.

Try:

```bash
rm -rf .vix-scripts
rm -rf .vix/runs
rm -rf ~/.vix/cache/scripts
```

Then run again:

```bash
vix run main.cpp
```

Recent versions improved script cache handling, but clearing stale caches can still help when debugging older installations.

## Common issue: OpenSSL on macOS

On macOS, Homebrew installs OpenSSL as a keg-only package.

If CMake cannot find OpenSSL, install it:

```bash
brew install openssl@3
```

Then configure with:

```bash
cmake -S . -B build \
  -DCMAKE_PREFIX_PATH="$(brew --prefix)" \
  -DOPENSSL_ROOT_DIR="$(brew --prefix openssl@3)"
```

The release workflow already passes Homebrew OpenSSL hints during macOS builds.

This matters because an SDK built with OpenSSL support can expose OpenSSL through exported CMake targets.

## Common issue: MySQL dependency not needed

If you do not need MySQL support while building from source, disable it:

```bash
cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DVIX_DB_USE_MYSQL=OFF \
  -DVIX_CORE_WITH_MYSQL=OFF
```

This avoids requiring MySQL C++ connector support for projects that do not use MySQL.

## Build prerequisites

## Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y \
  build-essential cmake ninja-build pkg-config \
  libssl-dev libsqlite3-dev zlib1g-dev libbrotli-dev \
  nlohmann-json3-dev libspdlog-dev libfmt-dev
```

For DB SDK or MySQL-enabled builds:

```bash
sudo apt install -y libmysqlcppconn-dev
```

## macOS

```bash
brew install cmake ninja pkg-config openssl@3 spdlog fmt nlohmann-json brotli
```

## Windows

Use Visual Studio Build Tools with MSVC or clang-cl.

For external dependencies, use vcpkg.

## Build from source

Clone the repository with submodules:

```bash
git clone --recursive https://github.com/vixcpp/vix.git
cd vix
```

Configure:

```bash
cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DVIX_ENABLE_INSTALL=ON
```

Build:

```bash
cmake --build build -j
```

Install:

```bash
cmake --install build --prefix "$HOME/.local"
```

Verify:

```bash
vix --version
find ~/.local/include -name vix.hpp 2>/dev/null
```

## Build from source without MySQL

If you do not need MySQL:

```bash
cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DVIX_ENABLE_INSTALL=ON \
  -DVIX_DB_USE_MYSQL=OFF \
  -DVIX_CORE_WITH_MYSQL=OFF
```

## Build from source without HTTP compression

If you want to avoid zlib and brotli requirements:

```bash
cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DVIX_ENABLE_INSTALL=ON \
  -DVIX_ENABLE_HTTP_COMPRESSION=OFF
```

## Upgrade

Upgrade the CLI:

```bash
vix upgrade
```

Check the environment:

```bash
vix doctor
```

Inspect paths and caches:

```bash
vix info
```

## Which artifact should I use?

For most users:

```txt
Use SDK mode.
```

Install with:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

Use CLI-only mode only if you only need the `vix` binary.

## Summary

| Need | Use |
|---|---|
| Run `vix` commands only | CLI artifact |
| Build apps with `#include <vix.hpp>` | SDK artifact |
| Follow the Vix Book | Full SDK |
| Use database APIs | DB SDK or Full SDK |
| Use most Vix modules | Full SDK |

For the full release history, see the [Changelog](./changelog.md).
