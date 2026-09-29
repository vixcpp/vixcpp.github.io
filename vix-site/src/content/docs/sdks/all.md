# Full SDK

The `all` SDK is the complete Vix.cpp SDK profile.

Install it when a machine needs the full native Vix platform in one SDK tree: web modules, data modules, desktop support, P2P modules, game support, agent tooling, and the common Vix foundation. It is useful for maintainers, release validation, integration testing, advanced development, or machines that regularly work across several Vix project domains.

```bash id="pnx2w4"
vix upgrade --sdk all
```

For most projects, a smaller profile is the better choice. The full SDK is available when the machine really needs everything, not because every project should start there.

## Install the Full SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="u6suwz"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="ry3gr2"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the full profile:

```bash id="d0e2p0"
vix upgrade --sdk all
```

Inspect the profile before installing it:

```bash id="zoonx9"
vix upgrade --sdk info all
```

Use this command when you want to see the modules, notes, version information, and system dependencies for the current release.

## What the Full SDK includes

The full profile includes the common Vix foundation.

```txt id="d5h08t"
common foundation
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

It then includes the specialized module families from the other SDK profiles.

```txt id="lvp3po"
web
  middleware
  websocket
  validation
  crypto
  webrpc
  requests

data
  db
  orm
  kv
  cache

desktop
  desktop shell
  ui webview support

p2p
  p2p
  p2p_http
  net
  sync

game
  game
  SDL support
  OpenGL support

agent
  agent
```

The full profile is one complete SDK profile. It is not a command that installs `default`, `web`, `data`, `desktop`, `p2p`, `game`, and `agent` one by one. Vix installs the `all` SDK as its own profile and the CLI uses it through the normal Vix workflow.

## When to use it

Use the Full SDK when the same machine needs to build across several Vix domains.

That includes maintaining Vix itself, validating SDK releases, testing examples across modules, building projects that combine many module families, or preparing a development machine where switching between web, data, desktop, P2P, game, and agent projects is normal.

```bash id="qacvgp"
vix upgrade --sdk all
```

For a single backend project, install `web`. For a database project, install `data`. For a desktop project, install `desktop`. The full SDK is for the cases where that separation is no longer enough for the machine you are setting up.

## Use it with a project

After the full profile is installed, the project workflow does not change.

```bash id="cyxj6o"
vix new app
cd app
vix install
vix dev
```

Build without running:

```bash id="afm4vp"
vix build
```

Run manually:

```bash id="rmp4np"
vix run
```

Start the development loop:

```bash id="vpf8z4"
vix dev
```

The SDK profile stays behind the CLI workflow. The project does not need to manually wire SDK paths. Vix resolves the installed SDK profile when it builds, runs, or enters development mode.

## Build with the full profile

Use `vix build` when you only want to compile the project.

```bash id="x4iv60"
vix build
```

Use verbose output when you need more detail from the build workflow.

```bash id="r1udku"
vix build -v
```

Use a release build when preparing an optimized binary.

```bash id="p5shgs"
vix build --preset release
```

If the project uses database-specific features, pass the matching build option.

```bash id="l6m3wn"
vix build --with-sqlite
vix build --with-mysql
```

The full SDK makes the modules available locally. The project still decides which modules and options it actually uses.

## Run a small check

Create a small file:

```bash id="d4a1st"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from the full Vix SDK");
  return 0;
}
CPP
```

Run it:

```bash id="oprdm6"
vix run main.cpp
```

Expected output:

```txt id="k428jc"
Hello from the full Vix SDK
```

You can also verify a module from a specialized family, such as `vix::requests` from the web modules.

```bash id="v6pvha"
cat > main.cpp <<'CPP'
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  auto response = vix::requests::get("https://example.com/");

  vix::print("status:", response.status_code());
  return 0;
}
CPP

vix run main.cpp
```

If this compiles and runs, the CLI can find the installed full SDK and use modules from the web family.

## Release and validation workflow

The full SDK is useful when validating the platform because it lets one machine build and test across module families.

```bash id="j6jkqb"
vix fmt --check
vix check --tests
vix build --preset release
vix tests --preset release
```

This is one of the strongest reasons to use `all`: it keeps release validation from depending on a partial SDK profile.

## System dependencies

The full SDK may require the system dependencies used by several profiles at once.

That can include libraries for HTTPS and crypto workflows, database backends, WebView support, SDL, OpenGL, networking, and other native features depending on the release and platform.

Check the current profile information before installing or debugging the full SDK.

```bash id="tlyxg4"
vix upgrade --sdk info all
```

Install the operating-system packages shown by that command. The SDK gives Vix the native module layer, but the operating system still needs the libraries those modules depend on.

## Update the Full SDK

Install or update the latest full profile:

```bash id="pl2qy2"
vix upgrade --sdk all
```

Preview the update without changing files:

```bash id="n7g4at"
vix upgrade --sdk all --dry-run
```

Install a specific version:

```bash id="kp3p4b"
vix upgrade --sdk all --version v2.7.0
```

Use JSON output for scripts:

```bash id="eq3qdb"
vix upgrade --sdk all --json
```

## Remove the Full SDK

Remove the full profile when it is no longer needed:

```bash id="s26k1j"
vix uninstall --sdk all
```

Preview the removal first:

```bash id="ybt2tk"
vix uninstall --sdk all --dry-run
```

Remove a specific version:

```bash id="iqm8n8"
vix uninstall --sdk all --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="en5n7o"
vix uninstall --sdk-list
```

Removing the full SDK removes the local Vix `all` profile files. It does not remove operating-system packages installed through your system package manager.

## When not to use it

Do not install the full SDK only because it feels safer.

A smaller profile is often the better development environment because it makes the project’s native needs clear. A backend project should normally use `web`. A persistence-focused project should use `data`. A desktop project should use `desktop`. A game project should use `game`.

```bash id="yvn0fi"
vix upgrade --sdk web
vix upgrade --sdk data
vix upgrade --sdk desktop
vix upgrade --sdk game
```

Use `all` when the machine needs the complete platform, not when the project only needs one module family.

## Common mistakes

### Installing `all` for every new project

This works, but it hides which modules the project actually depends on.

```bash id="o00adw"
vix upgrade --sdk all
```

Prefer the smallest profile that matches the project.

```bash id="un3sf3"
vix upgrade --sdk web
```

This keeps setup lighter and makes dependency problems easier to understand.

### Forgetting system dependencies

The full SDK has the widest module coverage, so it can also have the widest native dependency surface.

Check the profile information first.

```bash id="wvuozc"
vix upgrade --sdk info all
```

Install the required system packages before debugging the project as if the SDK itself were missing.

### Assuming the full SDK changes the CLI workflow

The workflow stays the same.

```bash id="y8ookm"
vix build
vix run
vix dev
```

The full profile changes what native modules are available to the local Vix environment. It does not replace the normal commands.

### Using all modules without project discipline

The full SDK makes many modules available, but a project should still use only what it needs. A clear project structure is more important than having every module installed locally.

Use the profile to support development. Do not let it turn into a reason to mix unrelated domains in one project without a clear architecture.

## Daily workflow

A typical full-SDK development machine may use several project types.

```bash id="ldq4jf"
vix upgrade --sdk all
```

For each project:

```bash id="sfjbnk"
cd project
vix install
vix dev
```

Before committing:

```bash id="hzr8f4"
vix fmt --check
vix check --tests
```

Before release:

```bash id="jxae6l"
vix build --preset release
vix tests --preset release
```

The Full SDK stays behind the CLI workflow. Once installed, it gives Vix access to the complete native SDK profile while the project remains driven by normal Vix commands.

## Next step

Return to the SDK overview when you need to compare profiles or decide which SDK should be installed for a project.

[Back to SDK profiles](/sdks/)
