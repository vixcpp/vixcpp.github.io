# Install

This page covers:

- Installing Vix
- Platform prerequisites
- Verifying your installation
- Fixing common issues

## Install Vix

### Linux / macOS

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

⚠️ The default installer installs the full SDK (CLI + headers + libraries).
This is required if you want to use `#include <vix.hpp>`.

## Verify installation

Check that the CLI is available:

```bash
vix --version
```

Check that headers are installed:

```bash
find ~/.local/include -name vix.hpp 2>/dev/null
```

Expected output:

```bash
~/.local/include/vix.hpp
```

## PATH check

If `vix` is not found:

```bash
echo $PATH
which vix
```

Make sure this path exists:

```bash
~/.local/bin
```

If not, add it:

### bash

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### zsh

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Build prerequisites

Vix projects are modern C++ projects. You need:

- C++20 compiler
- CMake 3.20+
- Ninja (recommended)

### Ubuntu example

```bash
sudo apt update
sudo apt install -y \
  build-essential cmake ninja-build pkg-config \
  libssl-dev libsqlite3-dev zlib1g-dev libbrotli-dev \
  nlohmann-json3-dev libspdlog-dev libfmt-dev
```

### macOS (Homebrew)

```bash
brew install cmake ninja pkg-config openssl@3 spdlog fmt nlohmann-json brotli
```

### Windows

Use:

- Visual Studio Build Tools (MSVC)
- or
- clang-cl

Use `vcpkg` if your project requires additional dependencies.

## Common issues

### `#include <vix.hpp>` not found

Example:

```cpp
#include <vix.hpp>
           ^ not found
```

Cause:

- Vix headers are not installed

Fix:

Reinstall using the official installer (SDK mode)

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

### `vix: command not found`

- Restart your terminal
- Ensure `~/.local/bin` is in `PATH`

Run:

```bash
which vix
```

### Download failures

If installation fails:

- Check your internet connection
- Verify DNS resolution
- Ensure GitHub releases are accessible

## Build from source

If you prefer building manually:

```bash
git clone --recursive https://github.com/vixcpp/vix.git
cd vix

cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DVIX_ENABLE_INSTALL=ON

cmake --build build -j
cmake --install build
```

## Next steps

- Docs: https://vixcpp.com/docs/quick-start
- Examples: https://vixcpp.com/docs/examples

