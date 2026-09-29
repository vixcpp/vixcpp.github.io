# Game SDK

The `game` SDK is the Vix.cpp profile for game-oriented and realtime rendering workflows.

Install it when a project needs the Vix game layer, SDL support, OpenGL support, or a native environment prepared for interactive applications. The profile includes the common Vix foundation, then adds the pieces needed for projects where the main loop, rendering, input, and runtime behavior are closer to a game or realtime app than a normal backend service.

```bash id="tk6v5y"
vix upgrade --sdk game
```

After the profile is installed, the workflow stays centered on the Vix CLI. You still use `vix build`, `vix run`, and `vix dev`. The SDK profile gives the machine the native game layer that those commands can use.

## Install the Game SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="mnq40x"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="rccg9z"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the game profile:

```bash id="rmu3m8"
vix upgrade --sdk game
```

Inspect the profile before installing it:

```bash id="uja30f"
vix upgrade --sdk info game
```

Use this command when you want to see the modules, notes, version information, and system dependencies for the current release.

## What the Game SDK includes

The game profile includes the common Vix foundation.

```txt id="gei5vg"
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

It then adds the game-oriented layer.

```txt id="h6rax5"
game
  game
  SDL support
  OpenGL support
```

The common foundation gives the project the normal Vix runtime and CLI workflow. The game profile adds the native support needed for realtime application work.

## When to use it

Use the Game SDK when the project is built around game or realtime behavior.

That includes game prototypes, interactive demos, rendering experiments, input-driven applications, realtime loops, or projects that need SDL and OpenGL support through the Vix environment.

```bash id="x5z6k9"
vix upgrade --sdk game
```

The default SDK is enough for normal Vix projects and simple local programs. The game profile is the right choice when the project starts using the game module or needs the native libraries behind a realtime runtime.

## Use it with a project

A normal game-oriented workflow looks like this:

```bash id="l8mpa3"
vix new game-demo
cd game-demo
vix install
vix dev
```

Build without running:

```bash id="n54r82"
vix build
```

Run manually:

```bash id="vxf45t"
vix run
```

Start the development loop:

```bash id="n0ifeh"
vix dev
```

The SDK profile stays behind the CLI workflow. You install the game profile once, then work with the project through Vix commands.

## Build a game project

Use `vix build` when you only want to compile the project.

```bash id="z38nsw"
vix build
```

Use verbose output when you need more detail from the build workflow.

```bash id="jqm8bs"
vix build -v
```

Use a release build when preparing an optimized binary.

```bash id="tcs1sv"
vix build --preset release
```

The build command detects the project, resolves the local Vix environment, and uses the installed SDK profile during the build.

## Run a game project

Use `vix run` when you want to build and start the application manually.

```bash id="qqd2iu"
vix run
```

Pass runtime arguments after `--run`.

```bash id="z74pjj"
vix run --run --fullscreen
```

For a small file or a quick check:

```bash id="o1r0ky"
vix run main.cpp
```

Single-file usage is useful for verifying that the CLI and SDK are installed correctly before moving into a full project.

## Game command workflow

Vix also exposes a `vix game` command family for game-oriented project workflows.

```bash id="xe65ds"
vix game export
```

Use this when a project needs the game export or packaging workflow provided by the CLI. The SDK gives the machine the native game layer, while the CLI command gives the project a consistent way to perform game-specific operations.

## Realtime projects

Game projects are different from normal command-line tools or backend services. They usually have a runtime loop, input handling, rendering work, assets, and platform dependencies. The Game SDK exists so that this native layer does not have to live inside the default installation for every Vix developer.

```txt id="m6cwsf"
game runtime
input and windowing support
rendering support
asset-oriented workflows
export workflow
```

The module-specific guide should be used for API-level examples. This page only explains which SDK profile provides the native environment for game-oriented work.

## Verify the installation

After installing the game profile, inspect it:

```bash id="dbhnv0"
vix upgrade --sdk info game
```

Check the environment:

```bash id="vzwk8r"
vix doctor
```

Print Vix paths and local state:

```bash id="k7d3uq"
vix info
```

Then run a small file to confirm that the CLI can find the installed SDK.

```bash id="z3w7du"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from the Vix Game SDK");
  return 0;
}
CPP

vix run main.cpp
```

Expected output:

```txt id="c5l117"
Hello from the Vix Game SDK
```

If this compiles and runs, the CLI and SDK profile are ready. For a real game project, also make sure the system dependencies shown by `vix upgrade --sdk info game` are installed.

## System dependencies

Game workflows usually depend on operating-system libraries. Depending on the platform and release, this can include SDL2, OpenGL, graphics headers, and related development packages.

Check the current release information before installing or debugging the profile.

```bash id="t4zyft"
vix upgrade --sdk info game
```

The SDK profile gives Vix the native game layer, but the operating system still needs the libraries that the game runtime and rendering support depend on.

## Update the Game SDK

Install or update the latest game profile:

```bash id="ujn4hj"
vix upgrade --sdk game
```

Preview the update without changing files:

```bash id="i1dxme"
vix upgrade --sdk game --dry-run
```

Install a specific version:

```bash id="bl8l6c"
vix upgrade --sdk game --version v2.7.0
```

Use JSON output for scripts:

```bash id="yvl7su"
vix upgrade --sdk game --json
```

## Remove the Game SDK

Remove the game profile when it is no longer needed:

```bash id="wbdrp0"
vix uninstall --sdk game
```

Preview the removal first:

```bash id="cdyrjr"
vix uninstall --sdk game --dry-run
```

Remove a specific version:

```bash id="gm42iy"
vix uninstall --sdk game --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="x3g2jd"
vix uninstall --sdk-list
```

Removing the SDK profile removes the local Vix game SDK files. It does not remove operating-system packages installed through your system package manager.

## When the Game SDK is not enough

The game profile is focused on game-oriented and realtime rendering workflows. If the project also uses another specialized module family, install the matching profile beside it.

For backend, WebSocket, WebRPC, middleware, validation, crypto, or outgoing HTTP requests:

```bash id="scjz1v"
vix upgrade --sdk web
```

For database, ORM, key-value, or cache work:

```bash id="tt5xbc"
vix upgrade --sdk data
```

For desktop applications:

```bash id="i36snc"
vix upgrade --sdk desktop
```

For P2P nodes, local-first sync, or peer networking:

```bash id="jhm14p"
vix upgrade --sdk p2p
```

For agent tooling:

```bash id="dzy57e"
vix upgrade --sdk agent
```

A machine can have multiple SDK profiles installed. Use the smallest set that matches the projects you are actively building.

## Common mistakes

### Using the default SDK for game modules

The default profile includes the base Vix development layer, but it does not provide the game profile.

If the project uses the game runtime or depends on SDL and OpenGL support through Vix, install the game profile.

```bash id="ncnwcy"
vix upgrade --sdk game
```

### Installing the full SDK for one game project

The full SDK works, but it is usually more than a game project needs.

```bash id="wuxxe7"
vix upgrade --sdk all
```

For game-oriented and realtime rendering work, use the game profile.

```bash id="m5ulwk"
vix upgrade --sdk game
```

This keeps the local setup focused and avoids pulling unrelated module families into the development environment.

### Forgetting graphics and windowing dependencies

The game SDK gives Vix the game profile, but the operating system still needs the native libraries required by the game layer.

Check the profile information first:

```bash id="q86262"
vix upgrade --sdk info game
```

Install the system packages shown there before debugging the project as if the C++ code were the problem.

### Passing runtime arguments to `vix build`

`vix build` compiles only. It does not start the app.

```bash id="nwbgz9"
vix build
```

Use `vix run` when you want to run the program.

```bash id="z3zu9q"
vix run --run --fullscreen
```

### Treating the game profile as a desktop profile

The game profile is for game-oriented and realtime rendering workflows. The desktop profile is for the Vix desktop shell and UI WebView support.

Use the game profile for realtime rendering projects.

```bash id="shyoh6"
vix upgrade --sdk game
```

Use the desktop profile for desktop shell projects.

```bash id="fn3q6s"
vix upgrade --sdk desktop
```

## Daily workflow

A typical game project workflow looks like this:

```bash id="onf2eg"
vix new game-demo
cd game-demo
vix install
vix dev
```

Build and run manually:

```bash id="mcqmgx"
vix build
vix run
```

Export when the project is ready for the game export workflow:

```bash id="i3wosg"
vix game export
```

Before committing:

```bash id="b6qa8i"
vix fmt --check
vix check --tests
```

Before release:

```bash id="rqx9y2"
vix build --preset release
vix tests --preset release
```

The Game SDK stays behind the CLI workflow. Once installed, the profile gives Vix the native layer needed for game-oriented projects.

## Next step

Continue with the Agent SDK when the project needs local-first agent tooling or controlled automation workflows.

[Open the Agent SDK guide](/sdks/agent)
