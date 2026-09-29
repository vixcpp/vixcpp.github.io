# Installation

This page shows how to install Vix.cpp and verify that it works on your machine.

Starting with **Vix.cpp v2.7.0**, the installation flow is split into two steps:

1. install the `vix` CLI;
2. install the SDK profile required by the kind of application you are building.

This keeps the first installation small and avoids forcing optional runtime dependencies on every user.

## Install the CLI

Linux and macOS:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

After installation, restart your terminal if `vix` is not immediately available.

Then verify the CLI:

```bash
vix --version
```

You can also check whether a newer CLI release is available:

```bash
vix upgrade --check
```

## Install a SDK profile

The CLI is the bootstrap. SDK profiles provide the native development layer used by Vix.cpp projects.

List available SDK profiles:

```bash
vix upgrade --sdk list
```

Inspect a profile before installing it:

```bash
vix upgrade --sdk info web
```

Install a profile:

```bash
vix upgrade --sdk web
```

The profile information shows:

- the modules included in the profile;
- the system dependencies required by the profile;
- notes about what the profile is intended for;
- the exact install command.

## Common SDK profiles

| Profile                    | Use it for                                                                       |
| -------------------------- | -------------------------------------------------------------------------------- |
| [`default`](/sdks/default) | Normal Vix.cpp projects and local development                                    |
| [`web`](/sdks/web)         | HTTP apps, APIs, WebSocket, middleware, validation, crypto, WebRPC, and requests |
| [`data`](/sdks/data)       | Database, ORM, key-value storage, key-value workflows, and cache modules         |
| [`desktop`](/sdks/desktop) | Desktop apps using the Vix UI desktop shell                                      |
| [`p2p`](/sdks/p2p)         | Peer-to-peer networking and local-first systems                                  |
| [`game`](/sdks/game)       | Game-oriented and realtime application workflows                                 |
| [`agent`](/sdks/agent)     | Local agent tooling and controlled automation workflows                          |
| [`all`](/sdks/all)         | Full SDK profile for advanced development and release validation                 |

The `all` profile is a complete SDK profile. It is not required for most projects.

To understand what each SDK profile contains before installing it, read the [SDK profiles overview](/sdks/).

For a normal web backend or API, use:

```bash
vix upgrade --sdk web
```

For database or ORM workflows, use:

```bash
vix upgrade --sdk data
```

For desktop UI apps, use:

```bash
vix upgrade --sdk desktop
```

## Install more than one SDK profile

You can install multiple profiles in one command:

```bash
vix upgrade --sdk web data desktop
```

Comma-separated profiles are also accepted:

```bash
vix upgrade --sdk web,data,desktop
```

This is useful when one machine is used for different kinds of Vix projects.

## Install a specific version

Install a specific CLI release:

```bash
vix upgrade v2.8.4
```

Or:

```bash
vix upgrade --version v2.8.4
```

Install a specific SDK profile version:

```bash
vix upgrade --sdk web --version v2.8.4
```

Install multiple profiles for a specific version:

```bash
vix upgrade --sdk web data --version v2.8.4
```

## Verify the CLI

Check that the `vix` command is available:

```bash
vix --version
```

If your terminal says:

```txt
vix: command not found
```

your shell cannot find the Vix binary.

On Linux and macOS, the default install location is usually:

```txt
$HOME/.local/bin/vix
```

Add `~/.local/bin` to your `PATH`.

Bash:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Zsh:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Then check again:

```bash
vix --version
```

## Verify a SDK profile

After installing a SDK profile, check the SDK state with:

```bash
vix upgrade --sdk list
```

Inspect the installed profile:

```bash
vix upgrade --sdk info web
```

You can also inspect your environment:

```bash
vix doctor
```

And print Vix paths and environment information:

```bash
vix info
```

## Verify with a simple C++ file

Create a temporary folder:

```bash
mkdir -p ~/tmp/vix-install-test
cd ~/tmp/vix-install-test
```

Create `main.cpp`:

```bash
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from Vix.cpp");
  return 0;
}
CPP
```

Run it:

```bash
vix run main.cpp
```

Expected output:

```txt
Hello from Vix.cpp
```

If this works, your CLI and SDK profile are ready for normal Vix.cpp development.

## Verify with a Vix project

Create a new project:

```bash
vix new api
cd api
```

Build it:

```bash
vix build
```

Run it:

```bash
vix run
```

For development mode:

```bash
vix dev
```

If the application starts, your installation is working.

## Verify with a CMake project

Vix.cpp can also work with normal CMake projects.

Create a temporary CMake project:

```bash
mkdir -p ~/tmp/vix-cmake-test
cd ~/tmp/vix-cmake-test
```

Create `CMakeLists.txt`:

```bash
cat > CMakeLists.txt <<'CMAKE'
cmake_minimum_required(VERSION 3.20)
project(vix_cmake_test LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Vix CONFIG REQUIRED)

add_executable(app main.cpp)
target_link_libraries(app PRIVATE vix::vix)
CMAKE
```

Create `main.cpp`:

```bash
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from Vix CMake");
  return 0;
}
CPP
```

Configure and build:

```bash
cmake -S . -B build -DCMAKE_PREFIX_PATH="$HOME/.local"
cmake --build build
./build/app
```

Expected output:

```txt
Hello from Vix CMake
```

## Updating Vix

Update the CLI:

```bash
vix upgrade
```

Check before upgrading:

```bash
vix upgrade --check
```

Preview without changing files:

```bash
vix upgrade --dry-run
```

Update or install a SDK profile:

```bash
vix upgrade --sdk web
```

Update or install a specific SDK profile version:

```bash
vix upgrade --sdk web --version v2.8.4
```

## CLI upgrade vs SDK upgrade

| Command                          | Updates                              | Use when                                       |
| -------------------------------- | ------------------------------------ | ---------------------------------------------- |
| `vix upgrade`                    | The `vix` CLI                        | You want the latest command-line tool          |
| `vix upgrade --sdk web`          | The `web` SDK profile                | You build web services, APIs, or realtime apps |
| `vix upgrade --sdk data`         | The `data` SDK profile               | You use database, ORM, KV, or cache modules    |
| `vix upgrade --sdk desktop`      | The `desktop` SDK profile            | You use the Vix desktop shell                  |
| `vix upgrade --sdk all`          | The full SDK profile                 | You need the full platform on one machine      |
| `vix upgrade --sdk info profile` | Nothing; it only prints profile info | You want to inspect before installing          |

## Install build prerequisites

Vix.cpp still uses the native C++ toolchain underneath.

You need a compiler, CMake, Ninja, and the system libraries required by the SDK profile you install.

The recommended way to check profile-specific dependencies is:

```bash
vix upgrade --sdk info web
```

### Ubuntu or Debian

Recommended base setup:

```bash
sudo apt update
sudo apt install -y \
  build-essential \
  cmake \
  ninja-build \
  pkg-config \
  ca-certificates \
  git \
  curl \
  tar \
  unzip \
  zip \
  nlohmann-json3-dev \
  libssl-dev \
  zlib1g-dev \
  libsqlite3-dev \
  libbrotli-dev \
  libspdlog-dev \
  libfmt-dev
```

For MySQL database support:

```bash
sudo apt install -y libmysqlcppconn-dev
```

For desktop shell support on Linux, inspect the desktop profile first:

```bash
vix upgrade --sdk info desktop
```

Then install the system dependencies shown by that command.

For game-oriented workflows with SDL/OpenGL:

```bash
sudo apt install -y \
  libsdl2-dev \
  libsdl2-image-dev \
  libgl1-mesa-dev
```

### Arch Linux

Install the base toolchain:

```bash
sudo pacman -S --needed \
  base-devel \
  cmake \
  ninja \
  pkgconf \
  git \
  curl \
  unzip \
  zip \
  tar \
  openssl \
  sqlite \
  zlib \
  brotli \
  fmt \
  spdlog \
  nlohmann-json
```

For MySQL database support, install the MySQL Connector/C++ package available for your system.

The base Vix CLI should not require MySQL to start. MySQL is only needed when using MySQL-related database workflows.

### macOS

With Homebrew:

```bash
brew install cmake ninja pkg-config openssl@3 spdlog fmt nlohmann-json brotli sqlite
```

For game-oriented workflows:

```bash
brew install sdl2 sdl2_image
```

### Windows

Install one C++ toolchain:

- Visual Studio Build Tools with MSVC;
- Visual Studio with the Desktop development with C++ workload;
- clang-cl.

Install CMake and Ninja.

For extra dependencies, use `vcpkg` or the dependency manager recommended by your environment.

## Desktop SDK

Install the desktop SDK before using desktop shell commands:

```bash
vix upgrade --sdk desktop
```

Then run a Vix UI app in a desktop shell:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

On Linux, desktop shell support needs WebView system libraries. Check the required packages with:

```bash
vix upgrade --sdk info desktop
```

## Data SDK

Install the data SDK when your project needs database, ORM, key-value, or cache modules:

```bash
vix upgrade --sdk data
```

This profile is useful for persistence-oriented applications.

For SQLite workflows, install the SQLite development package for your system.

For MySQL workflows, install the MySQL Connector/C++ development package for your system.

## Web SDK

Install the web SDK when your project needs web application modules beyond the default setup:

```bash
vix upgrade --sdk web
```

Use it for:

- APIs;
- HTTP services;
- realtime applications;
- WebSocket;
- middleware;
- validation;
- crypto;
- WebRPC;
- requests.

## Useful commands after installation

Check the installed version:

```bash
vix --version
```

Inspect your environment:

```bash
vix doctor
```

Show Vix paths and environment information:

```bash
vix info
```

List SDK profiles:

```bash
vix upgrade --sdk list
```

Inspect a SDK profile:

```bash
vix upgrade --sdk info web
```

Install a SDK profile:

```bash
vix upgrade --sdk web
```

Update the CLI:

```bash
vix upgrade
```

Run a single C++ file:

```bash
vix run main.cpp
```

Create a new project:

```bash
vix new app
cd app
vix dev
```

## Common installation problems

### `vix: command not found`

Your shell cannot find the Vix binary.

Fix for Bash:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Fix for Zsh:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Then run:

```bash
vix --version
```

### `#include <vix.hpp>` not found

The SDK profile needed by your project is not installed, or your project cannot find the SDK path.

Install the profile required by the project:

```bash
vix upgrade --sdk web
```

Then try again:

```bash
vix run main.cpp
```

For CMake projects, pass the SDK prefix manually if needed:

```bash
cmake -S . -B build -DCMAKE_PREFIX_PATH="$HOME/.local"
cmake --build build
```

### `find_package(Vix CONFIG REQUIRED)` fails

Install the SDK profile required by the project:

```bash
vix upgrade --sdk web
```

If CMake still cannot find Vix, pass the prefix:

```bash
cmake -S . -B build -DCMAKE_PREFIX_PATH="$HOME/.local"
```

Then build:

```bash
cmake --build build
```

### `vix: error while loading shared libraries: libmysqlcppconn.so.7`

This was a known packaging issue in older releases where the base CLI could require the MySQL Connector/C++ runtime at startup.

In Vix.cpp v2.7.0 and later, the base CLI should not require MySQL just to start. MySQL-related dependencies belong to database/MySQL workflows and SDK profiles.

Upgrade Vix:

```bash
vix upgrade
```

Then check:

```bash
vix --version
```

If you are still on an older release and cannot upgrade immediately, install the MySQL Connector/C++ runtime package for your system as a temporary workaround.

### CMake or Ninja is missing

Check:

```bash
cmake --version
ninja --version
```

On Ubuntu or Debian:

```bash
sudo apt install -y cmake ninja-build
```

On macOS:

```bash
brew install cmake ninja
```

### The project builds but cannot find system libraries

Install the system packages required by the SDK profile you are using.

Start by inspecting the profile:

```bash
vix upgrade --sdk info web
```

Then install the listed dependencies for your operating system.

### The game module cannot find SDL2 or OpenGL

Install the game dependencies.

Ubuntu or Debian:

```bash
sudo apt install -y \
  libsdl2-dev \
  libsdl2-image-dev \
  libgl1-mesa-dev
```

macOS:

```bash
brew install sdl2 sdl2_image
```

Then rebuild:

```bash
vix build
```

## Clean reinstall

If your system has an older or incomplete installation, reinstall the CLI and the SDK profile.

Linux and macOS:

```bash
rm -f "$HOME/.local/bin/vix"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Then reinstall the SDK profile you need:

```bash
vix upgrade --sdk web
```

For a different profile:

```bash
vix upgrade --sdk data
```

or:

```bash
vix upgrade --sdk desktop
```

## What you should remember

Install the CLI first:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

Check the CLI:

```bash
vix --version
```

List SDK profiles:

```bash
vix upgrade --sdk list
```

Inspect a profile:

```bash
vix upgrade --sdk info web
```

Install the profile you need:

```bash
vix upgrade --sdk web
```

Use `all` only when the machine really needs the full SDK:

```bash
vix upgrade --sdk all
```

## Next step

Now set up your development environment.

Next: [Set Up Your Environment](/getting-started/setup-environment)
