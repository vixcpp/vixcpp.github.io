# Desktop SDK

The `desktop` SDK is the Vix.cpp profile for desktop application workflows.

Install it when a project needs the Vix desktop shell and UI WebView support. The profile includes the common Vix foundation, then adds the native layer needed to package web-based UI work into a desktop application environment.

```bash id="mw5p2e"
vix upgrade --sdk desktop
```

After the profile is installed, the workflow stays centered on the CLI. You still build, run, and develop the project with `vix build`, `vix run`, and `vix dev`. The SDK profile gives the machine the native desktop layer that those commands can use.

## Install the Desktop SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="klt5oo"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="cj3omy"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the desktop profile:

```bash id="zbs092"
vix upgrade --sdk desktop
```

Inspect the profile before installing it:

```bash id="pkdd23"
vix upgrade --sdk info desktop
```

Use this command when you want to see the modules, notes, version information, and system dependencies for the current release.

## What the Desktop SDK includes

The desktop profile includes the common Vix foundation.

```txt id="g69sqd"
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

It then adds the desktop-oriented layer.

```txt id="vjyphm"
desktop
  desktop shell
  ui webview support
```

The common `ui` foundation is available in every SDK profile. The desktop profile adds the native shell and WebView support needed when the UI is meant to live as a desktop application instead of only being served as part of a web or backend workflow.

## When to use it

Use the Desktop SDK when the project is a desktop application or when a Vix UI project needs a native desktop host.

```bash id="rm7xuq"
vix upgrade --sdk desktop
```

This profile is not required for a normal backend API, a database service, a P2P node, or a simple command-line experiment. It is for projects that need the desktop runtime layer and the system libraries behind that layer.

## Use it with a project

A normal desktop project workflow looks like this:

```bash id="h5ez3k"
vix new app
cd app
vix install
vix dev
```

Build without running:

```bash id="bwwbb2"
vix build
```

Run manually:

```bash id="k9ez01"
vix run
```

Start the development loop:

```bash id="e0xsjm"
vix dev
```

The SDK profile stays behind the CLI workflow. You install the desktop profile once, then use the normal Vix commands from inside the project.

## Build a desktop project

Use `vix build` when you only want to compile the project.

```bash id="eiarxl"
vix build
```

Use verbose output when you need more detail from the Vix build workflow.

```bash id="tsrrey"
vix build -v
```

Use a release build when preparing an optimized desktop binary.

```bash id="wedh2v"
vix build --preset release
```

The build command detects the project, resolves the local Vix environment, and uses the installed SDK profile during the build.

## Run a desktop project

Use `vix run` when you want to build and start the application manually.

```bash id="qjf08k"
vix run
```

Pass runtime arguments after `--run`.

```bash id="gj89w4"
vix run --run --debug-window
```

For a small file or a quick check:

```bash id="anub9j"
vix run main.cpp
```

Single-file usage is useful for verifying that the CLI and SDK are installed correctly before moving into a full project.

## Develop with the desktop profile

Use `vix dev` for the normal development loop.

```bash id="g2u6sw"
vix dev
```

This is the command to use while actively working on the app. The project stays inside the Vix workflow, and the installed desktop SDK provides the native layer needed by the project.

## Verify the installation

After installing the desktop profile, inspect it:

```bash id="nrl6q7"
vix upgrade --sdk info desktop
```

Check the environment:

```bash id="rn5ycg"
vix doctor
```

Print Vix paths and local state:

```bash id="akb0vm"
vix info
```

Then run a small file to confirm that the CLI can find the installed SDK.

```bash id="pgd2w6"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from the Vix Desktop SDK");
  return 0;
}
CPP

vix run main.cpp
```

Expected output:

```txt id="sf3n9k"
Hello from the Vix Desktop SDK
```

If this compiles and runs, the CLI and SDK profile are ready. For a real desktop app, also make sure the desktop system dependencies shown by `vix upgrade --sdk info desktop` are installed.

## System dependencies

Desktop workflows usually depend on operating-system libraries. On Linux, this can include WebView, GTK, WebKit, and related development packages depending on the platform and release. Other platforms may require their own native desktop dependencies.

Check the current release information before installing or debugging the profile.

```bash id="slm5jf"
vix upgrade --sdk info desktop
```

The SDK profile gives Vix the native desktop layer, but the operating system still needs the libraries that the desktop shell and WebView support depend on.

## Update the Desktop SDK

Install or update the latest desktop profile:

```bash id="uid8ki"
vix upgrade --sdk desktop
```

Preview the update without changing files:

```bash id="wn5m1w"
vix upgrade --sdk desktop --dry-run
```

Install a specific version:

```bash id="x3skqk"
vix upgrade --sdk desktop --version v2.7.0
```

Use JSON output for scripts:

```bash id="h1mjo8"
vix upgrade --sdk desktop --json
```

## Remove the Desktop SDK

Remove the desktop profile when it is no longer needed:

```bash id="h9h7r2"
vix uninstall --sdk desktop
```

Preview the removal first:

```bash id="rwot9z"
vix uninstall --sdk desktop --dry-run
```

Remove a specific version:

```bash id="r9gtc0"
vix uninstall --sdk desktop --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="dxj8oq"
vix uninstall --sdk-list
```

Removing the SDK profile removes the local Vix desktop SDK files. It does not remove operating-system packages that were installed through your system package manager.

## When the Desktop SDK is not enough

The desktop profile is focused on native desktop hosting and UI WebView support. If the project also uses another specialized module family, install the matching profile beside it.

For backend, WebSocket, WebRPC, middleware, validation, crypto, or outgoing HTTP requests:

```bash id="zcw29u"
vix upgrade --sdk web
```

For database, ORM, key-value, or cache work:

```bash id="icqd99"
vix upgrade --sdk data
```

For P2P nodes, local-first sync, or peer networking:

```bash id="t7e9zs"
vix upgrade --sdk p2p
```

For game-oriented workflows:

```bash id="kkkx58"
vix upgrade --sdk game
```

For agent tooling:

```bash id="v8o7cw"
vix upgrade --sdk agent
```

A machine can have multiple SDK profiles installed. Use the smallest set that matches the projects you are actively building.

## Common mistakes

### Using the default SDK for a desktop shell project

The default profile includes the base Vix development layer and UI foundation, but it does not provide the full desktop shell profile.

For desktop application work, install the desktop profile.

```bash id="typvyr"
vix upgrade --sdk desktop
```

### Installing the full SDK for one desktop app

The full SDK works, but it is usually more than a desktop project needs.

```bash id="gqdl8x"
vix upgrade --sdk all
```

For desktop shell and WebView support, use the desktop profile.

```bash id="d2uzbq"
vix upgrade --sdk desktop
```

This keeps the local setup focused and avoids pulling unrelated module families into the development environment.

### Forgetting system WebView dependencies

The desktop SDK gives Vix the desktop profile, but the operating system still needs the native libraries required by the desktop layer.

Check the profile information first:

```bash id="h5whwf"
vix upgrade --sdk info desktop
```

Install the system packages shown there before debugging the project as if the C++ code were the problem.

### Passing runtime arguments to `vix build`

`vix build` compiles only. It does not start the app.

```bash id="lemkhg"
vix build
```

Use `vix run` when you want to run the program.

```bash id="p2kdt8"
vix run --run --debug-window
```

### Treating the desktop profile as a web backend profile

The desktop profile is for the native desktop host. If the same project also needs backend modules, WebSocket, WebRPC, validation, crypto, or outgoing HTTP requests, install the web profile too.

```bash id="u9cjzq"
vix upgrade --sdk web
```

## Daily workflow

A typical desktop project workflow looks like this:

```bash id="upqmqc"
vix new app
cd app
vix install
vix dev
```

Before committing:

```bash id="ertj24"
vix fmt --check
vix check --tests
```

Before release:

```bash id="xadbyq"
vix build --preset release
vix tests --preset release
```

The desktop SDK stays behind the CLI workflow. Once installed, the profile gives Vix the native desktop layer needed for desktop application projects.

## Next step

Continue with the P2P SDK when the project needs peer-to-peer networking, local-first sync, or node-oriented workflows.

[Open the P2P SDK guide](/sdks/p2p)
