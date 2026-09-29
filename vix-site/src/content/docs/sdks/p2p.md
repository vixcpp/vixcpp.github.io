# P2P SDK

The `p2p` SDK is the Vix.cpp profile for peer-to-peer networking and local-first systems.

Install it when a project needs nodes, peer connections, discovery, sync behavior, or HTTP-based communication between peers. The profile includes the common Vix foundation, then adds the modules used to build networked systems where more than one process or machine participates directly in the application workflow.

```bash id="m4mqzu"
vix upgrade --sdk p2p
```

After the profile is installed, the workflow stays centered on the Vix CLI. You still build, run, test, and develop the project with normal Vix commands. The SDK profile gives the machine the native P2P layer that those commands can use.

## Install the P2P SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="o5it6e"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="v2e37f"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the P2P profile:

```bash id="zml4fq"
vix upgrade --sdk p2p
```

Inspect the profile before installing it:

```bash id="f3s9a8"
vix upgrade --sdk info p2p
```

Use this command when you want to see the modules, notes, version information, and system dependencies for the current release.

## What the P2P SDK includes

The P2P profile includes the common Vix foundation.

```txt id="q2g53y"
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

It then adds the P2P-oriented modules.

```txt id="nx8gy1"
p2p
  p2p
  p2p_http
  crypto
  net
  sync
  cache
```

This makes the profile suitable for peer nodes, local-first systems, discovery workflows, replication experiments, peer communication over HTTP, and projects that need cryptographic helpers near the networking layer.

## When to use it

Use the P2P SDK when the application is not only a classic client-server program.

A P2P project may need to run several nodes, connect them together, exchange messages, keep local state, or sync data between machines. In that kind of workflow, the project needs more than the base SDK. It needs the modules that understand peer communication, networking, sync, cache behavior, and secure exchange.

```bash id="zq0n5x"
vix upgrade --sdk p2p
```

The default SDK is enough for the base Vix workflow. The P2P SDK is the right profile when the project starts using `p2p`, `p2p_http`, `net`, `sync`, `crypto`, or cache behavior as part of a node-oriented system.

## Use it with a project

A normal P2P project workflow looks like this:

```bash id="fgi2hy"
vix new node
cd node
vix install
vix dev
```

Build without running:

```bash id="rmh68r"
vix build
```

Run manually:

```bash id="pvblca"
vix run
```

Start the development loop:

```bash id="a1lwwc"
vix dev
```

The SDK profile stays behind the CLI workflow. You install the P2P profile once, then work with the project through Vix commands.

## Build a P2P project

Use `vix build` when you only want to compile the project.

```bash id="q6y9ie"
vix build
```

Use verbose output when you need more detail from the build workflow.

```bash id="qelcue"
vix build -v
```

Use a release build when preparing an optimized node binary.

```bash id="o9ktmt"
vix build --preset release
```

The build command detects the project, resolves the local Vix environment, and uses the installed SDK profile during the build.

## Run a P2P project

Use `vix run` when you want to build and start the node manually.

```bash id="el2z0u"
vix run
```

Pass runtime arguments after `--run`.

```bash id="heyg6a"
vix run --run --id A --listen 9001
```

For a small file or a quick check:

```bash id="qbxe6g"
vix run main.cpp
```

Single-file usage is useful for verifying that the CLI and SDK are installed correctly before moving into a full project.

## Run P2P nodes from the CLI

Vix also exposes a `vix p2p` command for node-oriented workflows.

Start one node:

```bash id="tzssqo"
vix p2p --id A --listen 9001
```

Start a second node and connect it to the first one:

```bash id="r8glld"
vix p2p --id B --listen 9002 --connect 127.0.0.1:9001
```

This is useful for local experiments because it lets you test peer behavior without building a large application first. A real project can later move the same ideas into its own Vix app structure.

## P2P HTTP

The `p2p_http` module belongs to this profile because many peer systems still need an HTTP-compatible layer for local communication, debugging, control endpoints, bootstrap workflows, or simple peer-to-peer exchange.

```txt id="hcg71h"
p2p_http
```

Use the P2P SDK when this kind of HTTP-based peer communication is part of the project. Use the Web SDK when the project is mainly a backend API, WebSocket service, WebRPC endpoint, or outgoing HTTP client.

## Sync and cache

The P2P profile includes `sync` and `cache` because local-first systems usually need more than a socket connection. They need a way to compare state, refresh local data, and avoid treating every request as a fresh remote dependency.

```txt id="jsuxar"
sync
cache
```

This does not force every P2P project to use synchronization or caching. It means the profile contains the native modules that make those workflows available when the project needs them.

## Crypto and networking

The P2P profile includes `crypto` and `net` because peer systems often need secure identity, signed data, or safe exchange around network boundaries.

```txt id="o3a3x7"
crypto
net
```

The profile provides the native layer. The application still decides what trust model, peer identity, and verification rules it needs.

## Verify the installation

After installing the P2P profile, inspect it:

```bash id="c2fi4g"
vix upgrade --sdk info p2p
```

Check the environment:

```bash id="tb4u62"
vix doctor
```

Print Vix paths and local state:

```bash id="gsp6ny"
vix info
```

Then run a small file to confirm that the CLI can find the installed SDK.

```bash id="cfxzmu"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from the Vix P2P SDK");
  return 0;
}
CPP

vix run main.cpp
```

Expected output:

```txt id="t5jahv"
Hello from the Vix P2P SDK
```

You can also run a local node check:

```bash id="kxmqfc"
vix p2p --id A --listen 9001
```

If the file compiles and the node command starts, the CLI and the installed P2P profile are ready for local development.

## System dependencies

P2P workflows may depend on native networking, crypto, and platform libraries used by the modules in this profile.

Check the current release information before installing or debugging the profile.

```bash id="f4iqhd"
vix upgrade --sdk info p2p
```

Install the system packages shown by that command for your operating system. The SDK profile gives Vix the native P2P module layer, but the operating system still needs the libraries those modules depend on.

## Update the P2P SDK

Install or update the latest P2P profile:

```bash id="fpgz4f"
vix upgrade --sdk p2p
```

Preview the update without changing files:

```bash id="xwgap4"
vix upgrade --sdk p2p --dry-run
```

Install a specific version:

```bash id="wcmu7v"
vix upgrade --sdk p2p --version v2.7.0
```

Use JSON output for scripts:

```bash id="o72nuf"
vix upgrade --sdk p2p --json
```

## Remove the P2P SDK

Remove the P2P profile when it is no longer needed:

```bash id="l0xsk8"
vix uninstall --sdk p2p
```

Preview the removal first:

```bash id="lhd9mx"
vix uninstall --sdk p2p --dry-run
```

Remove a specific version:

```bash id="lp44ty"
vix uninstall --sdk p2p --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="ar6doc"
vix uninstall --sdk-list
```

Removing the SDK profile removes the local Vix P2P SDK files. It does not remove operating-system packages installed through your system package manager.

## When the P2P SDK is not enough

The P2P profile is focused on peer networking, sync, local-first behavior, crypto, networking, and cache support. If the project also uses another specialized module family, install the matching profile beside it.

For backend, WebSocket, WebRPC, middleware, validation, crypto, or outgoing HTTP requests:

```bash id="fh7r0l"
vix upgrade --sdk web
```

For database, ORM, key-value, or cache work:

```bash id="jlgvvc"
vix upgrade --sdk data
```

For desktop applications:

```bash id="clv9ng"
vix upgrade --sdk desktop
```

For game-oriented workflows:

```bash id="ci8k2b"
vix upgrade --sdk game
```

For agent tooling:

```bash id="a8w6fo"
vix upgrade --sdk agent
```

A machine can have multiple SDK profiles installed. Use the smallest set that matches the projects you are actively building.

## Common mistakes

### Using the default SDK for P2P modules

The default profile includes the base Vix development layer, but it does not provide the P2P module family.

If the project uses `p2p`, `p2p_http`, `net`, `sync`, or P2P cache workflows, install the P2P profile.

```bash id="p15dj6"
vix upgrade --sdk p2p
```

### Treating P2P as a normal web backend profile

The Web SDK is for backend APIs, WebSocket, middleware, WebRPC, validation, crypto, and outgoing HTTP requests. The P2P SDK is for node-to-node workflows, local-first systems, peer communication, and sync.

Use the P2P profile when peers are part of the application model.

```bash id="tqpi8q"
vix upgrade --sdk p2p
```

Use the Web profile when the project is mainly a server-facing web application.

```bash id="j0523f"
vix upgrade --sdk web
```

### Installing the full SDK for one P2P project

The full SDK works, but it is usually more than a P2P project needs.

```bash id="m6r8c4"
vix upgrade --sdk all
```

For peer-to-peer and local-first work, use the P2P profile.

```bash id="pzd22s"
vix upgrade --sdk p2p
```

This keeps the local setup focused and avoids pulling unrelated module families into the development environment.

### Forgetting that local nodes need different ports

When testing several nodes on one machine, each node needs its own listen port.

```bash id="dmhxa3"
vix p2p --id A --listen 9001
vix p2p --id B --listen 9002 --connect 127.0.0.1:9001
```

Reusing the same port for two local nodes will fail because the port is already in use.

### Passing runtime arguments to `vix build`

`vix build` compiles only. It does not start the node.

```bash id="r13kfk"
vix build
```

Use `vix run` when you want to run the program.

```bash id="qk60zr"
vix run --run --id A --listen 9001
```

## Daily workflow

A typical P2P project workflow looks like this:

```bash id="ee0727"
vix new node
cd node
vix install
vix dev
```

For local node experiments:

```bash id="i3rcbv"
vix p2p --id A --listen 9001
vix p2p --id B --listen 9002 --connect 127.0.0.1:9001
```

Before committing:

```bash id="clz7ld"
vix fmt --check
vix check --tests
```

Before release:

```bash id="k7fk85"
vix build --preset release
vix tests --preset release
```

The P2P SDK stays behind the CLI workflow. Once installed, the profile gives Vix the native modules needed for peer-to-peer and local-first projects.

## Next step

Continue with the Game SDK when the project needs game-oriented or realtime rendering workflows.

[Open the Game SDK guide](/sdks/game)
