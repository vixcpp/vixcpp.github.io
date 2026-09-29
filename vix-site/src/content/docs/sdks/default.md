# Default SDK

The `default` SDK is the standard Vix.cpp profile for normal development.

It provides the common Vix foundation used by ordinary projects, local experiments, single-file programs, and the first steps of a new Vix installation. It is the profile to install when you want a clean Vix.cpp environment without bringing in a specialized module family such as web, data, P2P, game, desktop, or agent tooling.

```bash id="a2j9nq"
vix upgrade --sdk default
```

You can also install the default profile by omitting the profile name:

```bash id="nzq3rw"
vix upgrade --sdk
```

The default SDK is intentionally small compared to the full SDK. It gives the CLI enough native support to build and run normal Vix projects, while keeping optional runtime dependencies out of the base installation.

## Install the default SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="l9bv6p"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="m7u4d4"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the default SDK:

```bash id="lf1sn6"
vix upgrade --sdk default
```

Check the profile information before installing when you want to see the exact modules and notes for the current release.

```bash id="j5v2zu"
vix upgrade --sdk info default
```

## What the default SDK includes

The default profile contains the common Vix foundation.

```txt id="rnvzux"
default
  cli
  core
  json
  error
  path
  fs
  io
  env
  os
  utils
  log
  async
  time
  process
  threadpool
  template
  ui
  note
```

This is the layer used by the normal Vix command workflow. It gives you the core runtime, base utilities, filesystem and path support, environment helpers, logging, async primitives, process support, templates, UI foundations, and Note.

The default profile is not meant to be the full platform. It is the base SDK that keeps the first development environment focused.

## Verify the installation

After installing the default SDK, check the CLI:

```bash id="xjyiul"
vix --version
```

Inspect the installed SDK state:

```bash id="p4sxq0"
vix upgrade --sdk list
vix upgrade --sdk info default
```

Check the local environment:

```bash id="h070yk"
vix doctor
```

Print Vix paths and local state:

```bash id="ds002f"
vix info
```

## Run a simple file

Create a small file:

```bash id="xa547o"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from the default Vix SDK");
  return 0;
}
CPP
```

Run it:

```bash id="r3a8th"
vix run main.cpp
```

Expected output:

```txt id="r8tba5"
Hello from the default Vix SDK
```

This is the simplest verification path. If this works, the CLI can find the installed SDK and compile a normal Vix file.

## Build without running

Use `vix build` when you only want to compile.

```bash id="byd7t6"
vix build main.cpp
```

For a project, enter the project directory and build normally.

```bash id="rm5j6x"
vix build
```

The CLI resolves the local Vix environment and uses the installed SDK profile during the build. You do not need to manually wire SDK paths in ordinary Vix workflows.

## Use it with a project

Create a project:

```bash id="alweb7"
vix new app
cd app
```

Install project dependencies:

```bash id="ahkxir"
vix install
```

Start development:

```bash id="khtqbe"
vix dev
```

Or build and run manually:

```bash id="kn1gcd"
vix build
vix run
```

The default SDK is a good fit for this first project workflow. When the project later starts using a specialized module family, install the profile that matches that work.

## When to use the default SDK

Use the default SDK for a normal Vix.cpp setup, small experiments, simple local applications, and learning the CLI workflow.

It is also the right starting point when you do not yet know which specialized profile the project will need. You can install another profile later without removing the default one.

```bash id="zgw5oh"
vix upgrade --sdk web
vix upgrade --sdk data
```

Multiple SDK profiles can exist on the same machine.

## When to choose another SDK

Move to the `web` profile when the project uses backend or network-facing modules such as middleware, WebSocket, validation, crypto, WebRPC, or `vix::requests`.

```bash id="n8ue99"
vix upgrade --sdk web
```

Move to the `data` profile when the project uses database, ORM, key-value, or cache modules.

```bash id="e5gnpy"
vix upgrade --sdk data
```

Use `desktop`, `p2p`, `game`, or `agent` when the project belongs to those workflows.

```bash id="qpsh4h"
vix upgrade --sdk desktop
vix upgrade --sdk p2p
vix upgrade --sdk game
vix upgrade --sdk agent
```

Use `all` when the machine needs the complete platform in one SDK tree.

```bash id="hl0g7d"
vix upgrade --sdk all
```

The default profile is the base. Specialized profiles exist so the base installation does not carry every optional module and every optional system dependency.

## Update the default SDK

Install or update the latest default SDK:

```bash id="ntfj8t"
vix upgrade --sdk default
```

Preview the update without changing files:

```bash id="efqjpt"
vix upgrade --sdk default --dry-run
```

Install a specific version:

```bash id="l9mihf"
vix upgrade --sdk default --version v2.7.0
```

Use JSON output when the command is called from a script:

```bash id="em1fea"
vix upgrade --sdk default --json
```

## Remove the default SDK

Remove the default profile when it is no longer needed:

```bash id="j45mkp"
vix uninstall --sdk default
```

Preview the removal first:

```bash id="dr9fs5"
vix uninstall --sdk default --dry-run
```

Remove a specific version:

```bash id="csm91k"
vix uninstall --sdk default --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="elr74m"
vix uninstall --sdk-list
```

## System dependencies

The default SDK still uses the native C++ toolchain underneath. You need a working compiler, CMake, Ninja, and the base system tools required by your platform.

The best way to check what the current release expects is:

```bash id="n0bl1v"
vix upgrade --sdk info default
```

Install the dependencies shown by that command for your operating system. The default profile avoids specialized dependencies such as database connectors, WebView libraries, SDL, OpenGL, and P2P-specific libraries unless another profile is installed.

## Common mistakes

### Installing only the CLI

The CLI gives you the command surface, but the SDK profile gives the machine the native Vix layer used by build and run commands.

```bash id="kizk0v"
vix upgrade --sdk default
```

Run this after installing the CLI on a fresh machine.

### Starting with the full SDK when it is not needed

The full SDK is useful for advanced development and release validation, but it is not the normal starting point.

```bash id="jxu3tk"
vix upgrade --sdk all
```

For a clean first setup, use the default SDK.

```bash id="j223xk"
vix upgrade --sdk default
```

Install a specialized profile later when the project needs it.

### Using a specialized module with the default SDK

The default SDK does not include every module family. If a project uses `vix::requests`, WebSocket, middleware, validation, crypto, or WebRPC, install the web profile.

```bash id="f2fek5"
vix upgrade --sdk web
```

If a project uses database, ORM, KV, or cache modules, install the data profile.

```bash id="fwz8i9"
vix upgrade --sdk data
```

When unsure, inspect the profile before installing it.

```bash id="o9lvd4"
vix upgrade --sdk info web
```

## Daily workflow

A simple default-SDK workflow looks like this:

```bash id="h0i5or"
vix new app
cd app
vix install
vix dev
```

Before committing:

```bash id="y7du3a"
vix fmt --check
vix check --tests
```

For a release build:

```bash id="z1764l"
vix build --preset release
```

The SDK stays behind the CLI workflow. You install it once, then use normal Vix commands.

## Next step

Continue with the Web SDK when the project needs backend, WebSocket, WebRPC, middleware, validation, crypto, or outgoing HTTP requests.

[Open the Web SDK guide](/sdks/web)
