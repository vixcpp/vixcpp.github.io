---
title: vix.app Registry Dependencies
description: How vix.app declares Vix Registry dependencies, how vix install generates CMake integration, and how Vix keeps dependency wiring out of user projects.
date: 2026-05-25
---

# vix.app Registry Dependencies

`vix.app` can now declare dependencies from the Vix Registry directly in the application manifest.

The application stays simple.
The dependency system stays explicit.
The generated build keeps the native C++ integration underneath.

## The problem

A C++ application often needs small external libraries.
Without a higher-level manifest, the user usually has to manage several things manually:

```text
where the dependency is installed
which include directory it exposes
which CMake target it exports
which transitive dependencies it needs
how the package is linked to the app target
```

That is too much wiring for simple application projects.
For `vix.app`, the user should describe the application.
They should not have to maintain generated CMake glue by hand.

## The new field

Registry dependencies are declared with `deps`.

Example:

```text
name = api
type = executable
standard = c++20

sources = [
  src/main.cpp,
]

deps = [
  gk/email,
]
```

This means:

```text
the application depends on the Vix Registry package gk/email
```

The user still installs dependencies with:

```bash
vix install
```

Then builds normally:

```bash
vix build
```

## Field separation

`vix.app` now has several dependency-related fields, but they do not mean the same thing.

```text
modules   internal application modules created with vix modules
deps      external packages from the Vix Registry
packages  system or CMake packages resolved with find_package(...)
links     raw CMake targets or libraries linked manually
```

This separation matters.
A module is application code.
A registry dependency is external package code.
A package is a CMake discovery rule.
A link is a target-level link instruction.
Keeping these concepts separate makes the manifest predictable.

## Example with modules and deps

A backend app can use both internal modules and registry dependencies:

```text
name = api
type = executable
standard = c++20
output_dir = bin

sources = [
  src/main.cpp,
  src/api/app/AppBootstrap.cpp,
]

include_dirs = [
  include,
  src,
]

modules = [
  User,
]

deps = [
  gk/email,
]
```

Here:

```text
User      is an internal application module
gk/email  is an external registry dependency
```

The generated CMake handles both, but the manifest keeps them visually separate.

## The build flow

The dependency flow is:

```text
vix.app
  -> deps = [...]
  -> vix.json / vix.lock
  -> vix install
  -> .vix/deps/
  -> .vix/vix_deps.cmake
  -> .vix/generated/app/CMakeLists.txt
  -> CMake/Ninja build
```

`vix.app` declares the dependency.
`vix install` installs the resolved packages.
The generated `vix_deps.cmake` exposes CMake targets.
The generated application CMake includes that file and links the declared dependencies.

## Why vix install still matters

`vix.app` is declarative.

It does not fetch packages by itself.
Dependency installation remains explicit:

```bash
vix install
```

This keeps the build reproducible.
It also keeps dependency installation separate from normal compilation.
A missing dependency integration file gives a direct error:

```text
vix.app dependencies are declared, but .vix/vix_deps.cmake was not found.
Run: vix install
```

That is better than letting CMake fail later with a confusing missing include or missing target.

## Generated CMake integration

When `deps` is not empty, the generated application CMake includes:

```cmake
include("/absolute/path/to/project/.vix/vix_deps.cmake")
```

The path is absolute on purpose.
The generated CMake project lives under:

```text
.vix/generated/app/
```

The dependency integration file lives under:

```text
.vix/vix_deps.cmake
```

A relative include such as:

```cmake
include(.vix/vix_deps.cmake)
```

would be wrong because it would be resolved relative to the generated CMake directory, not the user project root.
So Vix emits an absolute path.

## Target convention

A registry dependency uses this canonical target convention:

```text
namespace/name -> namespace::name
```

Example:

```text
gk/email -> gk::email
```

So this manifest:

```text
deps = [
  gk/email,
]
```

is linked conceptually as:

```cmake
target_link_libraries(api PRIVATE gk::email)
```

The user does not need to write that manually in a `vix.app` project.

## Header-only packages

Some registry packages are header-only.
For those packages, Vix should not require a full CMake project.
It can create an interface target:

```cmake
add_library(gk::email INTERFACE)
target_include_directories(gk::email INTERFACE
  /path/to/.vix/deps/gk.email/include
)
```

The exact generated target may use an internal safe name and expose the public alias:

```text
gk::email
```

The important point is that the application can link the dependency by its canonical registry target.

## Packages with CMakeLists.txt

Some packages include their own `CMakeLists.txt`.
When the package is not header-only, Vix can load it with `add_subdirectory(...)`.
But header-only packages are handled differently.
Even if a header-only package contains a `CMakeLists.txt`, Vix can safely expose it as an interface dependency.
This avoids entering package CMake code that may be written for standalone builds.

## Transitive dependencies

A registry package may depend on other registry packages.

Example:

```text
gk/email
  -> gk/jwt
  -> gaspardkirira/hmac
```

The lock file contains the full resolved dependency graph.
`vix install` installs all resolved dependencies and generates CMake integration for each one.
That means the final project can have:

```text
gk::email
gk::jwt
gaspardkirira::hmac
```

available from `.vix/vix_deps.cmake`.
The app manifest only needs to declare what the app uses directly:

```text
deps = [
  gk/email,
]
```

The transitive packages are still installed and made available by the lock.

## Why target fallback matters

A dependency can be installed correctly but still fail to link if no expected CMake target exists.

For example:

```text
dependency: gk/email
expected target: gk::email
```

Vix solves this by ensuring a stable target exists for header-only packages.
That makes this work:

```text
deps = [
  gk/email,
]
```

without asking the user to know the internal build details of `gk/email`.

## Better errors

The generated CMake emits a stable Vix error marker when a declared dependency is not linkable.
Instead of a generic CMake error like:

```text
CMake configure failed
```

Vix can show:

```text
error: vix.app dependency is not linkable
dependency: gk/email
target: gk::email
```

This is important.
The user should know that the dependency is installed, but the expected build target is missing.
That is a Vix dependency integration problem, not a random CMake failure.

## vix install output for vix.app projects

For a classic CMake project, `vix install` can tell the user to add:

```cmake
include(.vix/vix_deps.cmake)
target_link_libraries(app PRIVATE ...)
```

But for a `vix.app` project, that message is wrong.

The user should not edit `CMakeLists.txt`.

For `vix.app`, the correct next step is:

```bash
vix build
```

So the developer flow becomes:

```bash
vix add @gk/email
vix install
vix build
```

No manual CMake wiring is needed.

## Example flow

A project starts with:

```text
name = api
type = executable
standard = c++20

sources = [
  src/main.cpp,
]

deps = [
  gk/email,
]
```

The user runs:

```bash
vix install
```

Vix installs the dependencies:

```text
gk/email
gk/jwt
gaspardkirira/hmac
```

Then:

```bash
vix build
```

The app builds through the generated CMake project.
The application manifest stays the source of truth.

## Why this belongs in vix.app

The goal of `vix.app` is not to hide C++.
The goal is to remove repetitive project wiring.
Dependency declarations are application-level information.
They belong in the application manifest.
The user should be able to read one file and understand:

- what this app builds
- which sources it uses
- which internal modules it has
- which registry packages it depends on
- which system packages it needs
- which raw targets it links

That is the value of `vix.app`.

## What stays explicit

`vix.app` does not remove explicitness.

It still keeps these concepts separate:

- `deps` for Vix Registry packages
- `packages` for CMake `find_package(...)`
- `links` for manual CMake targets
- `modules` for internal application modules

This avoids hidden magic.

If a dependency is from the Vix Registry, use `deps`.
If it is a system dependency, use `packages`.
If a target must be linked manually, use `links`.
If it is application code, use `modules`.

## Current design boundary

The current registry dependency integration still uses CMake underneath.

The flow is:

```text
registry deps -> .vix/vix_deps.cmake -> generated CMake -> CMake/Ninja
```

This is still a compatibility layer.
Later, Vix can use the same structured manifest and lockfile to build directly from a native build graph.
The important part is that the manifest is now structured enough to support both paths.

## Conclusion

`vix.app` can now describe registry dependencies directly.

The developer writes:

```text
deps = [
  gk/email,
]
```

Vix installs the dependency graph.
Vix generates the CMake integration.
Vix links the declared dependency into the app target.
The user does not edit generated CMake.
This keeps the application manifest simple while still producing a normal native C++ build.
