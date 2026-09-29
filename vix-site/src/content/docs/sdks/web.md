# Web SDK

The `web` SDK is the Vix.cpp profile for backend, API, WebSocket, WebRPC, middleware, validation, crypto, and outgoing HTTP client work.

Install it when a project needs the web-facing parts of Vix rather than only the base development layer. The profile includes the common Vix foundation, then adds the modules used to receive, validate, secure, route, and send networked application traffic.

```bash id="lqlxu3"
vix upgrade --sdk web
```

After the profile is installed, the normal workflow stays the same. You still use `vix build`, `vix run`, and `vix dev`. The CLI resolves the installed SDK profile when it builds or runs the project.

## Install the Web SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="d7d8bz"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="s5wts9"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the web profile:

```bash id="rwlqne"
vix upgrade --sdk web
```

Inspect the profile before installing it:

```bash id="ber36p"
vix upgrade --sdk info web
```

Use this command when you want to see the modules, notes, version information, and system dependencies for the current release.

## What the Web SDK includes

The web profile includes the common Vix foundation.

```txt id="r8ko0q"
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

It then adds the web-oriented modules.

```txt id="n33xmm"
web
  middleware
  websocket
  validation
  crypto
  webrpc
  requests
```

This makes the profile suitable for backend applications that need HTTP-oriented structure, real-time communication, request validation, cryptographic helpers, WebRPC endpoints, and outgoing HTTP or HTTPS calls through `vix::requests`.

## When to use it

Use the Web SDK for projects that expose or call networked services.

That includes APIs, backend applications, WebSocket services, WebRPC services, middleware-based request handling, validation-heavy endpoints, signed or secure workflows, and applications that need to call external APIs from C++.

```bash id="ofbnlq"
vix upgrade --sdk web
```

A project that uses `vix::requests` should use this profile, because the requests module belongs to the web SDK.

```cpp id="ps63xf"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  auto response = vix::requests::get("https://example.com/");

  vix::print("status:", response.status_code());

  return 0;
}
```

Run it:

```bash id="blsjdf"
vix run main.cpp
```

## Use it with a project

A normal backend workflow looks like this:

```bash id="cfa7tx"
vix new api
cd api
vix install
vix dev
```

Build without running:

```bash id="qmx62g"
vix build
```

Run manually:

```bash id="q92cbs"
vix run
```

Start the development loop:

```bash id="zlzqge"
vix dev
```

The SDK profile stays behind the CLI workflow. You install the profile once, then work with the project through Vix commands.

## Build a web project

Use `vix build` when you only want to compile the project.

```bash id="f88lfg"
vix build
```

Use verbose output when you need more detail from the Vix build workflow.

```bash id="kw19ui"
vix build -v
```

Use a release build when preparing an optimized binary.

```bash id="bw8qtw"
vix build --preset release
```

The build command detects the project, resolves the local Vix environment, and uses the installed SDK profile during the build.

## Run a web project

Use `vix run` when you want to build and start the application manually.

```bash id="xb0222"
vix run
```

Pass runtime arguments after `--run`.

```bash id="vmvnw9"
vix run --run --port 8080
```

For a single file:

```bash id="hwn9lc"
vix run main.cpp
```

Use this for small examples, quick tests, and documentation snippets.

## Develop with reload behavior

Use `vix dev` for the normal development loop.

```bash id="qf4la0"
vix dev
```

This is the command to use when you are actively working on a backend application and want the project to build and run through the development workflow.

## Outgoing HTTP requests

The Web SDK includes `requests`, the outgoing HTTP client module.

Use it when your application needs to call another service: a public API, an internal endpoint, a webhook target, a registry server, or a local development service.

```cpp id="xmio7x"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.headers.set("Accept", "application/json");
    options.params.set("page", "1");

    auto response = vix::requests::get(
        "https://example.com/api/items",
        options);

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print("body:", response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

Run it:

```bash id="g4j8gi"
vix run main.cpp
```

Use `Session` when several calls should share headers, params, timeout settings, auth, or cookies.

```cpp id="rzh4sh"
vix::requests::Session session;

session.set_header("Accept", "application/json");

auto profile = session.get("https://example.com/api/profile");
```

## WebSocket and realtime work

The Web SDK includes the WebSocket module for realtime application workflows.

Use it when the backend needs long-lived connections, server-to-client updates, rooms, broadcasting, or message-oriented communication. WebSocket belongs in this profile because it is part of the network-facing application layer, not the base SDK.

```bash id="c3kzb8"
vix upgrade --sdk web
```

After installing the profile, build and run the project normally.

```bash id="nom9ee"
vix build
vix run
```

## Middleware and validation

The web profile includes middleware and validation modules because backend code often needs structure before the final handler runs.

Middleware is used to keep request behavior organized around a route or application pipeline. Validation is used to keep input checks close to the boundary where data enters the program. Together, they help a backend project avoid scattering repeated request checks across handlers.

```txt id="htq4wx"
middleware
validation
```

Use the module guides for detailed examples when the project starts using those APIs directly.

## Crypto and secure workflows

The web profile includes crypto because many web-facing workflows need hashing, signing, tokens, secrets, or verification logic near the request boundary.

```txt id="ov3uje"
crypto
```

The profile does not make every backend secure by default. It gives the project access to the native module needed to implement secure workflows in the application code.

## WebRPC

The Web SDK includes WebRPC for structured RPC-style communication over the web layer.

```txt id="x13yt3"
webrpc
```

Use it when a project needs a more explicit service-call model instead of only raw routes or ad hoc HTTP handlers. The module belongs in the web profile because it is part of how networked application boundaries are exposed and called.

## Verify the installation

After installing the web profile, inspect it:

```bash id="j439v1"
vix upgrade --sdk info web
```

Check the environment:

```bash id="q97z47"
vix doctor
```

Print Vix paths and local state:

```bash id="z5j4ds"
vix info
```

Then run a small file that uses a web-profile module.

```bash id="c0p5fh"
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

If this compiles and runs, the CLI can find the installed web SDK profile.

## Update the Web SDK

Install or update the latest web profile:

```bash id="wj8j9x"
vix upgrade --sdk web
```

Preview the update without changing files:

```bash id="t44ba6"
vix upgrade --sdk web --dry-run
```

Install a specific version:

```bash id="ayt6oj"
vix upgrade --sdk web --version v2.7.0
```

Use JSON output for scripts:

```bash id="sn8r88"
vix upgrade --sdk web --json
```

## Remove the Web SDK

Remove the web profile when it is no longer needed:

```bash id="k8lo2f"
vix uninstall --sdk web
```

Preview the removal first:

```bash id="fi7bja"
vix uninstall --sdk web --dry-run
```

Remove a specific version:

```bash id="wp1rgz"
vix uninstall --sdk web --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="y3j5b7"
vix uninstall --sdk-list
```

## System dependencies

The web profile may require native libraries used by its modules, especially for crypto and HTTPS-related workflows.

Check the current release information before installing or debugging the profile.

```bash id="efs43l"
vix upgrade --sdk info web
```

Install the system packages shown by that command for your operating system. The SDK profile gives Vix the native module layer, but the operating system still needs the libraries those modules depend on.

## When the Web SDK is not enough

The web profile is focused on web-facing application work. If the project moves into a different domain, install the matching profile beside it.

For database, ORM, key-value, or cache work:

```bash id="rdyxwm"
vix upgrade --sdk data
```

For P2P nodes, local-first sync, or peer networking:

```bash id="l8xp93"
vix upgrade --sdk p2p
```

For desktop applications:

```bash id="l6g57p"
vix upgrade --sdk desktop
```

For game-oriented workflows:

```bash id="enkvh1"
vix upgrade --sdk game
```

For agent tooling:

```bash id="midp6o"
vix upgrade --sdk agent
```

A machine can have multiple SDK profiles installed. Use the smallest set that matches the projects you are actively building.

## Common mistakes

### Using the default SDK for web modules

The default profile is the base development layer. It does not include the web module family.

If the project uses `vix::requests`, WebSocket, middleware, validation, crypto, or WebRPC, install the web profile.

```bash id="wlbfas"
vix upgrade --sdk web
```

### Installing the full SDK for one backend project

The full SDK works, but it is usually more than a normal backend project needs.

```bash id="m5bkap"
vix upgrade --sdk all
```

For backend and API work, use the web profile.

```bash id="c1ijvy"
vix upgrade --sdk web
```

This keeps setup smaller and avoids unrelated dependencies.

### Forgetting that SDK profiles are local machine state

A project can declare and use web modules, but the machine still needs the matching SDK profile installed.

```bash id="y2m3jg"
vix upgrade --sdk info web
vix upgrade --sdk web
```

When a build cannot find a web module, check the installed profile first.

### Passing runtime arguments to `vix build`

`vix build` compiles only. It does not start the app.

```bash id="as9j9a"
vix build
```

Use `vix run` when you want to run the program.

```bash id="wfum5p"
vix run --run --port 8080
```

## Daily workflow

A typical web project workflow looks like this:

```bash id="wm9isp"
vix new api
cd api
vix install
vix dev
```

Before committing:

```bash id="bgfbue"
vix fmt --check
vix check --tests
```

Before release:

```bash id="bhdvsq"
vix build --preset release
vix tests --preset release
```

The web SDK stays behind the CLI workflow. Once installed, the profile gives Vix the native modules needed for backend and network-facing projects.

## Next step

Continue with the Data SDK when the project needs database, ORM, key-value, or cache modules.

[Open the Data SDK guide](/sdks/data)
