# Agent SDK

The `agent` SDK is the Vix.cpp profile for agent-oriented tooling and controlled automation workflows.

Install it when a project needs the Vix agent layer, local runtime state, cache-backed execution, or automation features that should stay inside a native Vix project instead of being treated as an external script. The profile includes the common Vix foundation, then adds the modules used to build agent workflows with a clear C++ runtime boundary.

```bash id="on5llf"
vix upgrade --sdk agent
```

After the profile is installed, the workflow stays centered on the Vix CLI. You still use `vix build`, `vix run`, and `vix dev`. The SDK profile gives the machine the native agent layer that those commands can use.

## Install the Agent SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="pp98ka"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="tidfms"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the agent profile:

```bash id="j1ugtd"
vix upgrade --sdk agent
```

Inspect the profile before installing it:

```bash id="gk5jm1"
vix upgrade --sdk info agent
```

Use this command when you want to see the modules, notes, version information, and system dependencies for the current release.

## What the Agent SDK includes

The agent profile includes the common Vix foundation.

```txt id="xokmgj"
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

It then adds the agent-oriented modules.

```txt id="k8od29"
agent
  agent
  cache
```

The common foundation gives the project the normal Vix runtime and CLI workflow. The agent profile adds the native layer needed for controlled automation and agent-oriented execution.

## When to use it

Use the Agent SDK when the project is built around agent workflows rather than only a normal command-line tool, backend service, or desktop app.

That includes projects that need local agent state, task execution, cache-backed context, controlled automation, or a native runtime boundary for work that should be inspected, repeated, and managed from inside a Vix project.

```bash id="bw5cyu"
vix upgrade --sdk agent
```

The default SDK is enough for normal Vix projects and simple local programs. The agent profile is the right choice when the project starts using the agent module or needs cache support as part of an agent workflow.

## Use it with a project

A normal agent-oriented workflow looks like this:

```bash id="ke4unf"
vix new agent-app
cd agent-app
vix install
vix dev
```

Build without running:

```bash id="goe4hm"
vix build
```

Run manually:

```bash id="bgowog"
vix run
```

Start the development loop:

```bash id="pn6437"
vix dev
```

The SDK profile stays behind the CLI workflow. You install the agent profile once, then work with the project through Vix commands.

## Build an agent project

Use `vix build` when you only want to compile the project.

```bash id="l9p6sh"
vix build
```

Use verbose output when you need more detail from the build workflow.

```bash id="ce4kio"
vix build -v
```

Use a release build when preparing an optimized binary.

```bash id="dvm54z"
vix build --preset release
```

The build command detects the project, resolves the local Vix environment, and uses the installed SDK profile during the build.

## Run an agent project

Use `vix run` when you want to build and start the program manually.

```bash id="czza3s"
vix run
```

Pass runtime arguments after `--run`.

```bash id="sja5nr"
vix run --run --task daily-check
```

For a small file or a quick check:

```bash id="cjg4yk"
vix run main.cpp
```

Single-file usage is useful for verifying that the CLI and SDK are installed correctly before moving into a full project.

## Agent workflows

Agent-oriented projects are usually about controlled execution. The project may need to prepare a task, run it, keep local state, cache intermediate data, and report what happened in a form that the application can inspect later.

The Agent SDK exists so this layer does not have to live in the default SDK for every Vix developer. It keeps the base installation lighter while still giving agent projects a native profile when they need it.

```txt id="cv0svo"
agent runtime
controlled automation
local execution state
cache-backed workflow data
project-owned task behavior
```

The module-specific guide should be used for API-level examples. This page only explains which SDK profile provides the native environment for agent-oriented work.

## Cache support

The agent profile includes `cache` because agent workflows often need local state that can be reused, refreshed, or cleared between runs.

```txt id="i56yaw"
cache
```

Cache support does not decide how the agent should behave. It gives the project a native building block for workflows where repeated execution should not recompute or refetch everything every time.

## Verify the installation

After installing the agent profile, inspect it:

```bash id="b0vmpm"
vix upgrade --sdk info agent
```

Check the environment:

```bash id="g9y4m2"
vix doctor
```

Print Vix paths and local state:

```bash id="y5knrf"
vix info
```

Then run a small file to confirm that the CLI can find the installed SDK.

```bash id="wa1b4n"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from the Vix Agent SDK");
  return 0;
}
CPP

vix run main.cpp
```

Expected output:

```txt id="tif169"
Hello from the Vix Agent SDK
```

If this compiles and runs, the CLI and SDK profile are ready. For a real agent project, also make sure the system dependencies shown by `vix upgrade --sdk info agent` are installed.

## System dependencies

Agent workflows may depend on native libraries used by the modules in this profile.

Check the current release information before installing or debugging the profile.

```bash id="qr8e4h"
vix upgrade --sdk info agent
```

Install the system packages shown by that command for your operating system. The SDK profile gives Vix the native agent module layer, but the operating system still needs the libraries those modules depend on.

## Update the Agent SDK

Install or update the latest agent profile:

```bash id="xr171t"
vix upgrade --sdk agent
```

Preview the update without changing files:

```bash id="vyzz73"
vix upgrade --sdk agent --dry-run
```

Install a specific version:

```bash id="oy4a6t"
vix upgrade --sdk agent --version v2.7.0
```

Use JSON output for scripts:

```bash id="lctqvk"
vix upgrade --sdk agent --json
```

## Remove the Agent SDK

Remove the agent profile when it is no longer needed:

```bash id="cs4nfe"
vix uninstall --sdk agent
```

Preview the removal first:

```bash id="npldl3"
vix uninstall --sdk agent --dry-run
```

Remove a specific version:

```bash id="g7on73"
vix uninstall --sdk agent --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="dpe7ek"
vix uninstall --sdk-list
```

Removing the SDK profile removes the local Vix agent SDK files. It does not remove operating-system packages installed through your system package manager.

## When the Agent SDK is not enough

The agent profile is focused on agent-oriented tooling, controlled automation, and cache-backed workflow state. If the project also uses another specialized module family, install the matching profile beside it.

For backend, WebSocket, WebRPC, middleware, validation, crypto, or outgoing HTTP requests:

```bash id="cnqpw8"
vix upgrade --sdk web
```

For database, ORM, key-value, or cache work:

```bash id="wpe3sx"
vix upgrade --sdk data
```

For desktop applications:

```bash id="gpv1qv"
vix upgrade --sdk desktop
```

For P2P nodes, local-first sync, or peer networking:

```bash id="v0wvuk"
vix upgrade --sdk p2p
```

For game-oriented workflows:

```bash id="zwb7ee"
vix upgrade --sdk game
```

A machine can have multiple SDK profiles installed. Use the smallest set that matches the projects you are actively building.

## Common mistakes

### Using the default SDK for agent modules

The default profile includes the base Vix development layer, but it does not provide the agent profile.

If the project uses agent-oriented modules, install the agent SDK.

```bash id="veq9p1"
vix upgrade --sdk agent
```

### Installing the full SDK for one agent project

The full SDK works, but it is usually more than an agent project needs.

```bash id="hx1qqz"
vix upgrade --sdk all
```

For agent tooling and controlled automation workflows, use the agent profile.

```bash id="e7jlq3"
vix upgrade --sdk agent
```

This keeps the local setup focused and avoids pulling unrelated module families into the development environment.

### Treating agent workflows as loose scripts

A Vix agent project should still live inside the Vix build and run workflow.

```bash id="bis6tw"
vix build
vix run
vix dev
```

The point of the profile is not to move work outside the project. It is to give the project a native layer for controlled execution.

### Forgetting that cache state is local project behavior

Cache support can make repeated work faster or easier to inspect, but cached data should not be treated as the source of truth unless the project explicitly designs it that way.

When debugging agent behavior, clear or reset project cache state according to the module workflow before assuming the runtime logic is wrong.

### Passing runtime arguments to `vix build`

`vix build` compiles only. It does not start the program.

```bash id="kr5ef0"
vix build
```

Use `vix run` when you want to run the program.

```bash id="g7knqa"
vix run --run --task daily-check
```

## Daily workflow

A typical agent project workflow looks like this:

```bash id="hwshov"
vix new agent-app
cd agent-app
vix install
vix dev
```

Build and run manually:

```bash id="h1qg32"
vix build
vix run
```

Before committing:

```bash id="hhqzpa"
vix fmt --check
vix check --tests
```

Before release:

```bash id="y1uxjq"
vix build --preset release
vix tests --preset release
```

The Agent SDK stays behind the CLI workflow. Once installed, the profile gives Vix the native layer needed for agent-oriented and controlled automation projects.

## Next step

Continue with the Full SDK when the machine needs the complete Vix.cpp platform in one SDK profile.

[Open the Full SDK guide](/sdks/all)
