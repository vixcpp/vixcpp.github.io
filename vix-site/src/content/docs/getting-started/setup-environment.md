# Set Up Your Environment

Vix.cpp keeps the C++ toolchain visible. The `vix` CLI gives the project a cleaner workflow, and SDK profiles provide the Vix development layer, but the code is still compiled by a real C++ compiler and built as a native executable or library.

Before writing your first Vix.cpp program, make sure your machine has the normal C++ development tools installed.

## What you need

A working Vix.cpp environment needs:

- a C++20 compiler
- CMake
- Ninja
- Git
- curl or another download tool
- the system libraries required by the SDK profile you use

The base CLI install gives you the `vix` command. SDK profiles are installed separately through `vix upgrade --sdk`.

Check your Vix installation:

```bash
vix --version
```

List available SDK profiles:

```bash
vix upgrade --sdk list
```

Inspect the profile you want to use:

```bash
vix upgrade --sdk info web
```

The `info` command is the best place to start because it shows the modules, system dependencies, and notes for that profile.

## Check your toolchain

Run:

```bash
c++ --version
cmake --version
ninja --version
git --version
```

If one of these commands is missing, install the missing tool before continuing.

Vix.cpp does not replace the compiler, CMake, or Ninja. It uses the native toolchain underneath and gives the project a more consistent workflow around it.

## Ubuntu or Debian

Install the common development tools:

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
  zip
```

For the common Vix SDK profiles, install the usual development libraries:

```bash
sudo apt install -y \
  nlohmann-json3-dev \
  libssl-dev \
  zlib1g-dev \
  libsqlite3-dev \
  libbrotli-dev \
  libspdlog-dev \
  libfmt-dev
```

For MySQL database workflows:

```bash
sudo apt install -y libmysqlcppconn-dev
```

For game-oriented workflows with SDL/OpenGL:

```bash
sudo apt install -y \
  libsdl2-dev \
  libsdl2-image-dev \
  libgl1-mesa-dev
```

Before installing a profile, inspect it:

```bash
vix upgrade --sdk info web
```

Then install the profile:

```bash
vix upgrade --sdk web
```

## Arch Linux

Install the base development tools:

```bash
sudo pacman -S --needed \
  base-devel \
  cmake \
  ninja \
  pkgconf \
  git \
  curl \
  tar \
  unzip \
  zip
```

Install common development libraries:

```bash
sudo pacman -S --needed \
  nlohmann-json \
  openssl \
  zlib \
  sqlite \
  brotli \
  spdlog \
  fmt
```

For MySQL database workflows, install the MySQL Connector/C++ package available for your system.

The base Vix CLI should not require MySQL to start. MySQL is only needed when your project uses MySQL-related database features.

Inspect the profile before installing it:

```bash
vix upgrade --sdk info web
```

Then install the profile:

```bash
vix upgrade --sdk web
```

## Fedora

Install the base development tools:

```bash
sudo dnf install -y \
  gcc \
  gcc-c++ \
  cmake \
  ninja-build \
  pkgconf-pkg-config \
  git \
  curl \
  tar \
  unzip \
  zip
```

Install common development libraries:

```bash
sudo dnf install -y \
  openssl-devel \
  zlib-devel \
  sqlite-devel \
  brotli-devel \
  spdlog-devel \
  fmt-devel \
  nlohmann-json-devel
```

Then inspect and install the SDK profile you need:

```bash
vix upgrade --sdk info web
vix upgrade --sdk web
```

## macOS

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

With Homebrew, install the common tools:

```bash
brew install cmake ninja pkg-config git curl
```

Install common development libraries:

```bash
brew install openssl@3 sqlite brotli spdlog fmt nlohmann-json
```

For game-oriented workflows:

```bash
brew install sdl2 sdl2_image
```

Then inspect and install the SDK profile you need:

```bash
vix upgrade --sdk info web
vix upgrade --sdk web
```

## Windows

On Windows, install one C++ toolchain:

- Visual Studio with the **Desktop development with C++** workload
- Visual Studio Build Tools with MSVC
- clang-cl with a compatible Windows build environment

Also install:

- CMake
- Ninja
- Git
- PowerShell

For additional native dependencies, use the package manager that fits your environment, such as `vcpkg`.

Install Vix.cpp from PowerShell:

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

Then restart your terminal and check:

```powershell
vix --version
```

Inspect and install a SDK profile:

```powershell
vix upgrade --sdk list
vix upgrade --sdk info web
vix upgrade --sdk web
```

## Install the SDK profile you need

Vix.cpp v2.7.0 uses SDK profiles so your machine does not need to install every optional development layer by default.

For web applications, APIs, middleware, WebSocket, validation, crypto, WebRPC, and requests:

```bash
vix upgrade --sdk web
```

For database, ORM, key-value storage, and cache workflows:

```bash
vix upgrade --sdk data
```

For desktop shell workflows:

```bash
vix upgrade --sdk desktop
```

For peer-to-peer and local-first systems:

```bash
vix upgrade --sdk p2p
```

For game-oriented workflows:

```bash
vix upgrade --sdk game
```

For local agent tooling:

```bash
vix upgrade --sdk agent
```

For full development and release validation machines:

```bash
vix upgrade --sdk all
```

Use `all` only when the machine really needs the full SDK surface.

## Inspect before installing

Before installing a SDK profile, inspect it:

```bash
vix upgrade --sdk info web
```

The output shows:

- the profile name
- the platform
- the modules included in the profile
- the system dependencies needed by the profile
- notes about the intended use
- the install command

This avoids guessing system packages manually.

## Verify the environment

Check the Vix CLI:

```bash
vix --version
```

Check your toolchain:

```bash
c++ --version
cmake --version
ninja --version
```

Check Vix environment information:

```bash
vix info
```

Run the Vix doctor command:

```bash
vix doctor
```

For production-oriented checks, use the production doctor command when your project reaches that stage:

```bash
vix doctor production
```

## Verify with a small C++ file

Create a temporary folder:

```bash
mkdir -p ~/tmp/vix-env-test
cd ~/tmp/vix-env-test
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

If this works, the CLI, SDK profile, compiler, and build workflow are ready for a basic Vix.cpp program.

## Verify with a project

Create a project:

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

Start development mode:

```bash
vix dev
```

This confirms that your environment can create, build, run, and restart a Vix.cpp project through the normal workflow.

## Common environment problems

### `vix: command not found`

Your shell cannot find the Vix binary.

On Linux and macOS, add `~/.local/bin` to your `PATH`.

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

### `cmake: command not found`

Install CMake.

Ubuntu or Debian:

```bash
sudo apt install -y cmake
```

Arch Linux:

```bash
sudo pacman -S --needed cmake
```

macOS:

```bash
brew install cmake
```

### `ninja: command not found`

Install Ninja.

Ubuntu or Debian:

```bash
sudo apt install -y ninja-build
```

Arch Linux:

```bash
sudo pacman -S --needed ninja
```

macOS:

```bash
brew install ninja
```

### `#include <vix.hpp>` not found

The SDK profile needed by your project is not installed, or your project cannot find the SDK path.

Install the profile you need:

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

Install the SDK profile required by your project:

```bash
vix upgrade --sdk web
```

Then configure with the local prefix:

```bash
cmake -S . -B build -DCMAKE_PREFIX_PATH="$HOME/.local"
```

Build again:

```bash
cmake --build build
```

### Missing OpenSSL, SQLite, Brotli, fmt, or spdlog

Install the system libraries required by the SDK profile.

Start by inspecting the profile:

```bash
vix upgrade --sdk info web
```

Then install the listed packages for your operating system.

### MySQL runtime error on older Vix releases

Older Vix.cpp releases could fail at startup on systems without the MySQL Connector/C++ runtime installed.

Upgrade the CLI:

```bash
vix upgrade
```

Then check:

```bash
vix --version
```

In Vix.cpp v2.7.0 and later, the base CLI should not require MySQL to start. MySQL dependencies belong to database/MySQL workflows and the SDK/profile layer.

## Recommended local setup

For most developers starting with Vix.cpp on Linux, this is enough:

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

Then:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
vix upgrade --sdk info web
vix upgrade --sdk web
vix --version
vix doctor
```

## What you should remember

Vix.cpp uses the native C++ toolchain underneath.

The CLI gives you the command workflow.

SDK profiles give your project the native development layer it needs.

Use this sequence when setting up a new machine:

```bash
vix --version
c++ --version
cmake --version
ninja --version
vix upgrade --sdk list
vix upgrade --sdk info web
vix upgrade --sdk web
vix doctor
```

## Next step

Now run your first C++ file with Vix.cpp.

Next: [Run Your First C++ File](/getting-started/run-your-first-file)
