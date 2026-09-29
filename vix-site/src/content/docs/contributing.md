---
title: Contribution
description: Contribute to Vix.cpp.
---

# Contribution

Vix.cpp is an open source C++ runtime, CLI, SDK, and modular systems toolkit.
The project is built around a simple idea: make modern C++ development faster, clearer, and more reliable without hiding how the system works.
Contributions are welcome when they strengthen that direction.

## Contribution model

Vix.cpp values contributions that are focused, reproducible, and aligned with the project architecture.
Good contributions usually improve one of these areas:

```txt
runtime correctness
CLI developer experience
SDK stability
module architecture
cross-platform support
error diagnostics
documentation
tests
release reliability
```

A contribution should have a clear purpose and a measurable effect.

## Use the Vix CLI

The Vix CLI is the primary development interface for contributors.

Install it first.

Shell, Linux and macOS:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

PowerShell, Windows:

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

Verify the installation:

```bash
vix --version
vix info
```

Use the CLI to validate your work:

```bash
vix build
vix tests
vix check
```

For specific workflows:

```bash
vix run main.cpp
vix dev
vix tests -v
vix tests --raw
vix doctor
```

## Repository setup

Clone the repository with submodules:

```bash
git clone --recursive https://github.com/vixcpp/vix.git
cd vix
```

If the repository was cloned without submodules:

```bash
git submodule update --init --recursive
```

## What to contribute

Useful contributions include:

```txt
bug fixes
new tests
module improvements
CLI improvements
documentation improvements
release workflow improvements
SDK packaging fixes
cross-platform fixes
```

Large architectural changes should start as a proposal before becoming a pull request.

## Project standards

Vix.cpp favors:

```txt
explicit behavior
clean public APIs
stable module boundaries
deterministic runtime behavior
clear diagnostics
safe aggregate headers
reproducible builds
cross-platform correctness
```

Avoid changes that make the system more magical, harder to inspect, or harder to debug.

## Public API expectations

Public APIs must stay stable, minimal, and intentional.
Public headers should be safe to include and should not unexpectedly pull heavy optional internals.
General entry points should remain lightweight:

```cpp
#include <vix.hpp>
#include <vix/all.hpp>
```

Specialized features should remain explicit through specialized headers.

## Modules

Vix.cpp is organized into modules. Some modules are managed as submodules.
When working inside a module, commit the module change first, then update the root repository pointer.
A root repository commit should never pretend to contain submodule changes that were not committed inside the submodule itself.

## Documentation

Documentation should be practical and direct.

Good documentation explains:

```txt
what the feature does
when to use it
which command to run
what result to expect
which related page to read next
```

Avoid vague text. Prefer clear language and real workflows.

## Pull requests

Pull requests should be focused and reviewable.
Before opening a pull request, make sure the change is tested with the Vix CLI:

```bash
vix build
vix tests
vix check
```

For pull request rules, review:

```txt
/pull-request
```

## Security

Do not open public issues for security vulnerabilities.
Security reports should follow the security policy:

```txt
/security
```

## Code of conduct

All contributors are expected to follow the project code of conduct:

```txt
/code-of-conduct
```

## License

By contributing to Vix.cpp, you agree that your contribution will be released under the project license.
