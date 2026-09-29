# SDK Profiles

SDK profiles define the native Vix.cpp layer installed on your machine for a specific kind of project.

Starting with Vix.cpp v2.7.0, the installation flow is split into two parts. The `vix` CLI is installed first, then the SDK profile required by the project is installed with `vix upgrade --sdk`. This keeps the command-line tool small and avoids installing every native module and system dependency on every machine.

```bash id="u6qmq7"
vix upgrade --sdk web
```

A backend API does not need the same native libraries as a desktop shell. A database project does not need the same modules as a P2P node. SDK profiles make that separation clear while keeping the normal development workflow the same: create the project, install what it needs, then build or run with the Vix CLI.

## Install the CLI first

The CLI is the bootstrap.

Linux and macOS:

```bash id="vldakd"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="pb2gxu"
irm https://vixcpp.com/install.ps1 | iex
```

Check the CLI:

```bash id="rm6vvd"
vix --version
```

After the CLI is available, install the SDK profile that matches the kind of project you are building.

## List SDK profiles

Use `vix upgrade --sdk list` to see the profiles available in the current release.

```bash id="ks22vo"
vix upgrade --sdk list
```

Inspect a profile before installing it:

```bash id="ub57uz"
vix upgrade --sdk info web
```

The profile information shows the modules included in the profile, the system dependencies required by that profile, notes about its intended use, and the install command.

## Install a profile

Install the default SDK profile:

```bash id="zk2k2w"
vix upgrade --sdk
```

Install a named profile:

```bash id="kztg81"
vix upgrade --sdk web
```

Install a specific version:

```bash id="p5loyl"
vix upgrade --sdk web --version v2.7.0
```

Install more than one profile on the same machine:

```bash id="zqq5fh"
vix upgrade --sdk web data desktop
```

Comma-separated profiles are also accepted:

```bash id="zrcld9"
vix upgrade --sdk web,data,desktop
```

This is useful when one development machine is used for different kinds of Vix.cpp projects.

## Available profiles

| Profile   | Use it for                                                                                |
| --------- | ----------------------------------------------------------------------------------------- |
| `default` | Normal Vix.cpp projects and local development                                             |
| `web`     | HTTP apps, APIs, WebSocket, middleware, validation, crypto, WebRPC, and outgoing requests |
| `data`    | Database, ORM, key-value storage, and cache workflows                                     |
| `desktop` | Desktop apps using the Vix UI desktop shell                                               |
| `p2p`     | Peer-to-peer networking and local-first systems                                           |
| `game`    | Game-oriented and realtime rendering workflows                                            |
| `agent`   | Agent tooling and controlled automation workflows                                         |
| `all`     | The complete SDK profile for advanced development and release validation                  |

The `all` profile is a complete SDK profile. It is not required for most projects. Use it when a machine really needs the full platform in one SDK tree, or when you are validating Vix itself across several domains.

## What all profiles share

Every SDK profile includes the foundation needed for normal Vix.cpp development. That shared layer gives the CLI enough native support to build, run, inspect, and work with Vix projects without making every profile install the full platform.

```txt id="po9l0e"
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

The profiles then add modules for a specific workflow.

## Profile modules

The `default` profile keeps the installation focused on the common Vix development layer.

```txt id="nck2yw"
default
  common foundation
```

The `web` profile adds the modules used by backend, API, WebSocket, WebRPC, middleware, validation, crypto, and outgoing HTTP client work.

```txt id="n7b3ub"
web
  common foundation
  middleware
  websocket
  validation
  crypto
  webrpc
  requests
```

The `data` profile adds persistence-oriented modules.

```txt id="l0g6r3"
data
  common foundation
  db
  orm
  kv
  cache
```

The `desktop` profile adds the desktop shell layer around the Vix UI stack.

```txt id="v1a9d7"
desktop
  common foundation
  desktop shell
  ui webview support
```

The `p2p` profile adds peer-to-peer and local-first networking modules.

```txt id="tjd9vs"
p2p
  common foundation
  p2p
  p2p_http
  crypto
  cache
```

The `game` profile adds game and realtime rendering support.

```txt id="om7zk3"
game
  common foundation
  game
  SDL support
  OpenGL support
```

The `agent` profile adds the agent-oriented layer.

```txt id="bay3em"
agent
  common foundation
  agent
  cache
```

The `all` profile combines the specialized modules into one complete SDK.

```txt id="hurk74"
all
  common foundation
  middleware
  websocket
  validation
  crypto
  webrpc
  requests
  db
  orm
  kv
  cache
  p2p
  p2p_http
  desktop shell
  ui webview support
  game
  SDL support
  OpenGL support
  agent
```

## Choosing a profile

Choose the smallest profile that matches the project.

For a normal Vix.cpp application, local experiment, or project that does not need a specialized module family, start with `default`.

```bash id="f23qqa"
vix upgrade --sdk default
```

For an API, backend service, WebSocket app, middleware workflow, WebRPC endpoint, or HTTP client work with `vix::requests`, use `web`.

```bash id="m9p4ee"
vix upgrade --sdk web
```

For database, ORM, key-value storage, or cache work, use `data`.

```bash id="cslfdv"
vix upgrade --sdk data
```

For desktop applications, use `desktop`.

```bash id="brvzcb"
vix upgrade --sdk desktop
```

For peer-to-peer nodes, discovery, replication, or local-first systems, use `p2p`.

```bash id="hyz77v"
vix upgrade --sdk p2p
```

For game-oriented or realtime rendering projects, use `game`.

```bash id="caogzy"
vix upgrade --sdk game
```

For agent tooling and controlled automation workflows, use `agent`.

```bash id="y3615r"
vix upgrade --sdk agent
```

Use `all` when you are validating the full platform, building across many domains, or maintaining Vix itself.

```bash id="p2gxla"
vix upgrade --sdk all
```

## How Vix uses the SDK

The SDK profile is not something you normally wire manually in project code. Once a profile is installed, Vix commands use the installed SDK when they build or run the project.

```bash id="q4r2aj"
vix build
```

```bash id="s1ozf4"
vix run
```

```bash id="ba9hzy"
vix dev
```

This is the main reason the SDK is managed by the CLI. A project should not force every developer to manually remember where the SDK is installed or how it should be connected. The CLI owns that environment and keeps the build workflow consistent.

For a single C++ file, the same idea applies.

```bash id="nm1kxs"
vix run main.cpp
```

For a project, enter the project directory and use the normal commands.

```bash id="qq0742"
vix build
vix run
vix dev
```

## Where SDK profiles are installed

SDK profiles are installed under the Vix home directory.

```txt id="q9w9ug"
~/.vix/sdk/<profile>/<version>/
```

Each profile can also have a `current` pointer.

```txt id="hrk7l7"
~/.vix/sdk/web/current
~/.vix/sdk/web/current.json
```

The `current` pointer lets Vix resolve the active SDK version for that profile without asking the user to pass a path every time.

## Verify an installed profile

After installing a profile, inspect it again:

```bash id="h9nd3f"
vix upgrade --sdk info web
```

Check the environment:

```bash id="q3nq2e"
vix doctor
```

Print Vix paths and environment information:

```bash id="zs5m5a"
vix info
```

You can also verify the SDK with a small file:

```bash id="bx2htv"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from Vix.cpp");
  return 0;
}
CPP

vix run main.cpp
```

Expected output:

```txt id="blxp3x"
Hello from Vix.cpp
```

If this works, the CLI and the installed SDK profile are ready for normal Vix.cpp development.

## Build with the installed SDK

Use `vix build` when you only want to compile the project.

```bash id="wtdc3h"
vix build
```

Use `vix run` when you want to build and start the program.

```bash id="sqv0a1"
vix run
```

Use `vix dev` when you want a development loop.

```bash id="lh7yqf"
vix dev
```

These commands are the normal path. The SDK is part of the Vix environment, so the project workflow stays focused on Vix commands rather than manual native setup.

## Update a profile

Install or update the latest release of a profile:

```bash id="k3iwb5"
vix upgrade --sdk web
```

Preview without changing files:

```bash id="bs4ucl"
vix upgrade --sdk web --dry-run
```

Print machine-readable output:

```bash id="jjvrul"
vix upgrade --sdk web --json
```

Use a specific release tag:

```bash id="v5lr4f"
vix upgrade --sdk web --version v2.7.0
```

## Remove a profile

Use `vix uninstall` when a profile is no longer needed.

```bash id="l6hg6x"
vix uninstall --sdk web
```

Remove a specific version of a profile:

```bash id="m8zg2m"
vix uninstall --sdk web --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="k3ngng"
vix uninstall --sdk-list
```

Remove all SDK profiles:

```bash id="c6lo8b"
vix uninstall --sdk-all
```

Use `--dry-run` when you want to see the removal plan without deleting files.

```bash id="c9jpwk"
vix uninstall --sdk web --dry-run
```

## System dependencies

SDK profiles still depend on the native libraries required by the modules they include. The profile keeps Vix organized, but it does not replace operating-system packages.

The most reliable way to check profile-specific dependencies is:

```bash id="kao99e"
vix upgrade --sdk info desktop
```

The desktop profile may require WebView libraries on Linux. The game profile may require SDL2 and OpenGL libraries. The full profile may require the system dependencies used by several domains at once.

Install the system packages shown by the profile information before expecting the profile to build projects that use those native features.

## When to install another profile

Install another profile when the project starts using modules that are not part of the current SDK.

A project using `vix::requests`, WebSocket, middleware, validation, crypto, or WebRPC should use the `web` profile.

```bash id="ype1rx"
vix upgrade --sdk web
```

A project using database, ORM, KV, or cache modules should use the `data` profile.

```bash id="lv9v5p"
vix upgrade --sdk data
```

A project using desktop shell features should use the `desktop` profile.

```bash id="akdshp"
vix upgrade --sdk desktop
```

When in doubt, inspect the profile first.

```bash id="crwvdm"
vix upgrade --sdk info web
```

## Daily workflow

A normal workflow looks like this:

```bash id="multek"
vix new api
cd api
vix install
vix dev
```

Before committing:

```bash id="ntn36m"
vix fmt --check
vix check --tests
```

Before release:

```bash id="f2yfiy"
vix build --preset release
vix tests --preset release
```

The SDK profile is part of the local Vix environment. The project workflow remains centered on the CLI.

## Common mistakes

### Installing the CLI but not the SDK

The CLI gives you the command surface. The SDK profile gives your machine the native Vix layer used to build projects.

```bash id="ba5jtg"
vix upgrade --sdk web
```

Install the profile that matches the modules your project uses.

### Installing `all` by default

The `all` profile is useful, but it is not the best default for every developer machine.

```bash id="l3yzcc"
vix upgrade --sdk all
```

For a normal backend or API, use `web`.

```bash id="mpulwl"
vix upgrade --sdk web
```

For database work, use `data`.

```bash id="bq3n2b"
vix upgrade --sdk data
```

Smaller profiles make setup easier and avoid unnecessary system dependencies.

### Using a specialized module with the wrong profile

If a project uses `vix::requests`, install the `web` profile.

```bash id="ot1ivx"
vix upgrade --sdk web
```

If a project uses ORM or KV modules, install the `data` profile.

```bash id="x3n6hq"
vix upgrade --sdk data
```

If the build cannot find a module, first check whether the installed SDK profile actually includes that module.

```bash id="fdpdda"
vix upgrade --sdk info <profile>
```

## Next step

Start with the default SDK if you are setting up a normal Vix.cpp development environment.

[Open the default SDK guide](/sdks/default)
