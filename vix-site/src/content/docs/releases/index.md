# Releases

Vix.cpp releases are published as versioned updates of the runtime, CLI, SDK, modules, build system, and developer tooling.

This section explains the current release, the available build artifacts, and where to find the full changelog.

## Latest release

The latest release is:

```txt
v2.5.3
```

Vix.cpp v2.5.3 focuses on a cleaner CLI experience, replayable executions, better diagnostics, improved build/test/check/dev output, and stronger SDK packaging.

It also introduces dedicated threadpool and kv modules.

## Highlights

Vix.cpp v2.5.3 includes several important improvements:

- `vix replay` for recording, inspecting, listing, cleaning, and replaying previous executions
- opt-in replay recording with `vix run --replay`
- opt-in OpenAPI/docs mode with `vix run --docs`
- ThreadSanitizer support for script runs with `--tsan`
- cleaner output for `vix build`, `vix check`, `vix tests`, and `vix dev`
- improved runtime diagnostics with better code frames and focused hints
- improved `vix dev` rebuild flow using real Ninja progress
- new internal build graph foundation for future incremental builds
- new threadpool module
- new kv module for durable local-first key-value storage

## Compatibility

Vix.cpp v2.5.3 has no breaking changes.

Existing projects that work with v2.5.2 should continue to work with v2.5.3.

## Release artifacts

Vix.cpp now separates release artifacts into two main families:

- CLI artifacts
- SDK artifacts

CLI artifacts contain only the `vix` executable.

SDK artifacts contain the CLI, headers, libraries, CMake package files, and exported targets needed to build Vix applications.

## Release workflows

Vix.cpp uses two release workflows:

```txt
.github/workflows/release.yml
.github/workflows/sdk-release.yml
```

`release.yml` publishes standalone CLI binaries.

`sdk-release.yml` publishes installable SDK archives.

See [Builds](./builds.md) for the full explanation.

## Recommended installation

For most users, install the SDK:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

SDK mode is the default.

It is the recommended mode for the documentation and the Vix Book because it supports:

```cpp
#include <vix.hpp>
```

CLI-only mode is only for users who need the `vix` binary without headers or libraries.

## Verify installation

After installing, check the CLI:

```bash
vix --version
```

Expected output shape:

```txt
Vix.cpp CLI
version : 2.5.3
author  : Gaspard Kirira
source  : https://github.com/vixcpp/vix
```

If you installed the SDK, verify the main header:

```bash
find ~/.local/include -name vix.hpp 2>/dev/null
```

Expected output:

```txt
~/.local/include/vix.hpp
```

## Pages

Use these pages to navigate release information:

| Page | Purpose |
|---|---|
| [Builds](./builds.md) | Explains CLI artifacts, SDK artifacts, release workflows, install modes, and common install issues |
| [Changelog](./changelog.md) | Contains the complete release history |

## Recommended upgrade

Upgrade to v2.5.3 if you use:

- `vix run`
- `vix build`
- `vix check`
- `vix tests`
- `vix dev`
- single-file scripts
- SDK installations
- local development workflows

This release improves daily development feedback while preserving compatibility.

## Summary

Vix.cpp v2.5.3 is a developer-experience release.

It makes the CLI cleaner, improves diagnostics, adds replay support, strengthens build foundations, improves SDK packaging, and keeps existing projects compatible.

