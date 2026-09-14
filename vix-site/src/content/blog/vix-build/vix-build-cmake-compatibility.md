---
title: vix build CMake Compatibility Path
description: Why vix build keeps CMake as the compatibility path, how Vix uses CMake without exposing all of its complexity, and where vix.app fits into that model.
date: 2026-05-17
---

# vix build CMake Compatibility Path

`vix build` does not try to remove CMake.

CMake remains the compatibility path for C++ projects.

That is intentional.

C++ projects are not uniform. Some are small applications. Some are libraries. Some are monorepos. Some use generated sources, custom commands, package exports, install rules, CTest, toolchains, and platform-specific build logic.

A build tool for C++ cannot ignore that reality.

So Vix takes a layered approach:

```txt
CMakeLists.txt -> compatibility path
vix.app        -> simple path
future native  -> fast path for projects Vix understands directly
```

The compatibility path keeps existing projects working.

The simple path makes new projects easier to start.

The future native path gives Vix room to become faster for `vix.app` projects.

## Why CMake remains important

CMake is widely used because it solves hard C++ build problems.

It can describe:

```txt
multiple targets
target dependencies
generated source files
custom commands
install rules
CTest
FetchContent
toolchains
package discovery
platform-specific branches
compiler-specific options
package exports
```

This is not small functionality.

A serious C++ tool cannot simply say:

```txt
do not use CMake anymore
```

That would break too many real projects.

Instead, Vix keeps CMake as the advanced compatibility layer.

## What Vix adds above CMake

If Vix still uses CMake, then what does Vix add?

Vix adds a better application workflow around CMake.

It can provide:

```txt
simpler commands
embedded presets
cleaner output
better diagnostics
compiler launcher integration
fast linker integration
project resolution
generated CMake from vix.app
build graph imports
object cache
artifact cache
script mode
run mode
```

The goal is not to pretend CMake does not exist.

The goal is to make the common workflow smoother.

Instead of making every user remember the full CMake command sequence, Vix gives them:

```bash
vix build
```

and:

```bash
vix run
```

## The compatibility path

For a normal CMake project:

```txt
myapp/
  CMakeLists.txt
  src/
    main.cpp
```

the build flow is:

```txt
resolve project
create build plan
configure CMake
build with CMake/Ninja
```

Conceptually:

```bash
cmake -S myapp -B myapp/build-ninja -G Ninja
cmake --build myapp/build-ninja --target myapp
```

Vix wraps this with better defaults, logging, target selection, and diagnostics.

## CMakeLists.txt has priority

Vix resolves projects in this order:

```txt
1. CMakeLists.txt
2. vix.app
```

This means that if a project contains:

```txt
CMakeLists.txt
vix.app
```

Vix uses:

```txt
CMakeLists.txt
```

The reason is simple:

```txt
CMakeLists.txt means full build control.
vix.app means simple project description.
```

If the full-control file exists, Vix should respect it.

## Why this is safe

This rule makes `vix.app` non-destructive.

Adding `vix.app` support does not break existing CMake projects.

A large project with advanced CMake logic can keep using its current build system.

A small project without CMake can use `vix.app`.

That gives Vix a smooth adoption path.

```txt
existing projects keep working
new simple projects become easier
advanced projects still have full control
```

## Embedded presets

Vix can provide built-in presets for common workflows.

Examples:

```txt
dev
dev-ninja
release
```

A typical mapping is:

```txt
dev:
  generator: Ninja
  build type: Debug
  build dir: build-dev

dev-ninja:
  generator: Ninja
  build type: Debug
  build dir: build-ninja

release:
  generator: Ninja
  build type: Release
  build dir: build-release
```

This means users do not have to start every project by deciding the same build directory and generator rules.

They can run:

```bash
vix build
```

or:

```bash
vix build --preset release
```

## Configure step

The configure step is where CMake creates the build system files.

Vix runs something conceptually equivalent to:

```bash
cmake -S <cmakeSourceDir> -B <buildDir> -G Ninja
```

For a normal CMake project:

```bash
cmake -S . -B build-ninja -G Ninja
```

For a `vix.app` project, Vix first generates CMake internally, then configures from that generated directory:

```bash
cmake -S .vix/generated/app -B build-ninja -G Ninja
```

The same compatibility path is used after generation.

## Build step

After configure, Vix builds the selected target:

```bash
cmake --build <buildDir> --target <target>
```

If the user passes an explicit target:

```bash
vix build --build-target server
```

Vix builds:

```txt
server
```

If no target is provided, Vix uses the default target name from the build plan.

For CMake projects, that can be the project directory name.

For `vix.app`, it should be the manifest `name`.

## Why CMake source directory matters

For CMake projects:

```txt
userProjectDir = cmakeSourceDir
```

For `vix.app` projects:

```txt
userProjectDir = project root
cmakeSourceDir = .vix/generated/app
```

That means Vix must pass the correct path to CMake configure.

Configure uses:

```txt
cmakeSourceDir
```

But user-facing operations use:

```txt
userProjectDir
```

This is one of the most important changes introduced by `vix.app`.

## CMake variables

Vix can pass variables to CMake configure.

Example:

```bash
vix build -- -DCMAKE_PREFIX_PATH=/path/to/prefix
```

Everything after `--` is forwarded to CMake configure.

This is useful for:

```txt
custom package locations
toolchain options
feature flags
dependency prefixes
compiler options
```

Vix does not need to invent a separate mechanism for every advanced CMake variable.

It can preserve the CMake escape hatch.

## Toolchains

CMake is still the right place for many toolchain details.

A toolchain may define:

```txt
target system
compiler
sysroot
architecture
find root path
cross-compilation behavior
```

Vix can generate or pass toolchain files, but CMake remains the compatibility layer that understands how to apply them.

This is one reason CMake should not be removed from `vix build`.

## Package discovery

CMake already has a package discovery model:

```cmake
find_package(...)
```

`vix.app` maps to this through:

```ini
packages = [
  fmt:REQUIRED,
]
```

which generates the equivalent of:

```cmake
find_package(fmt REQUIRED)
```

For full CMake projects, users can write the package logic themselves.

For `vix.app`, Vix generates the common case.

## Linking

CMake targets are explicit.

A package name is not always the same as the target name.

Examples:

```txt
fmt      -> fmt::fmt
Threads  -> Threads::Threads
Boost    -> Boost::system, Boost::filesystem
OpenSSL  -> OpenSSL::SSL, OpenSSL::Crypto
```

So `vix.app` keeps package discovery and linking separate:

```ini
packages = [
  fmt:REQUIRED,
]

links = [
  fmt::fmt,
]
```

Generated CMake then emits both:

```cmake
find_package(fmt REQUIRED)
```

and:

```cmake
target_link_libraries(myapp PRIVATE
  fmt::fmt
)
```

For advanced projects, users can write the exact CMake logic themselves.

## Compiler launcher

Vix can integrate compiler launchers such as:

```txt
ccache
sccache
```

These improve repeated builds by caching compiler outputs.

CMake supports launcher variables such as:

```txt
CMAKE_CXX_COMPILER_LAUNCHER
```

Vix can resolve and pass these values as part of the configure step.

This is a good example of Vix improving workflow while still using CMake underneath.

## Fast linker

Vix can also prefer faster linkers such as:

```txt
mold
lld
```

C++ linking can become expensive.

A faster linker can reduce incremental build time, especially when only a few object files changed.

Vix can detect and pass linker-related configuration while keeping the build compatible with CMake.

## Ninja as the default generator

Ninja is a good default build backend because it is fast and focused.

Vix can use CMake to generate Ninja files:

```bash
cmake -S . -B build-ninja -G Ninja
```

Then CMake build mode can invoke the generated build system:

```bash
cmake --build build-ninja
```

This keeps the command portable while still getting Ninja performance.

## Why not call Ninja directly all the time?

Vix can inspect Ninja files, and in the future it can use deeper graph execution.

But calling CMake build mode has advantages:

```txt
portable command interface
works across generators
respects CMake state
handles target names
works with CMake-generated projects
```

So the compatibility path uses:

```bash
cmake --build
```

while Vix can still inspect the generated files for caching and diagnostics.

## Build logs

CMake and compiler output can be noisy.

Vix can capture logs while presenting a cleaner UI.

Useful logs include:

```txt
configure log
build log
raw compiler output
diagnostic extraction
```

This lets Vix show a clean error while keeping enough detail for debugging.

## Diagnostics

One of Vix’s responsibilities is to make C++ build failures easier to read.

CMake compatibility does not mean raw CMake output must be the only user experience.

Vix can parse and format errors from:

```txt
CMake configure
compiler output
linker output
runtime crashes
known tool failures
```

The compatibility path can still have a better interface.

## CMake configure failures

Configure failures usually come from:

```txt
bad CMakeLists.txt
package not found
invalid CMake variable
bad toolchain
invalid generated CMake
```

For `vix.app`, configure failures may point to:

```txt
.vix/generated/app/CMakeLists.txt
```

But the real cause may be a manifest field.

A good diagnostic should help the user connect the generated CMake error back to the manifest.

## Compiler failures

Compiler failures usually come from source code:

```txt
syntax error
missing header
template error
type error
unknown symbol
```

Vix can preserve the raw compiler log while also presenting a cleaner diagnostic.

This is independent of whether the project came from CMake or `vix.app`.

## Link failures

Link failures are common in C++.

Examples:

```txt
undefined reference
duplicate symbol
missing library
imported target not found
duplicate main
```

For `vix.app`, a common mistake is:

```ini
packages = [
  fmt:REQUIRED,
]
```

without:

```ini
links = [
  fmt::fmt,
]
```

The compatibility path exposes the CMake error, but Vix documentation and diagnostics can explain the higher-level cause.

## CMake cache

CMake writes configuration state in the build directory.

This includes:

```txt
CMakeCache.txt
CMakeFiles/
generated Ninja files
compile_commands.json
```

Vix can use the presence of this state to decide whether configure is needed.

But it also needs its own signature to know when configuration inputs changed.

## Configure signature

A configure signature should represent the inputs that affect configuration.

Examples:

```txt
preset
CMake variables
toolchain file
compiler launcher
fast linker
target triple
project fingerprint
generated CMake content
```

If the signature changes, Vix should reconfigure.

If it does not, Vix can skip configure.

This avoids unnecessary CMake work.

## Project fingerprint

A project fingerprint captures build-relevant project inputs.

For normal CMake projects, it may include:

```txt
CMakeLists.txt
CMakePresets.json
cmake/
```

For `vix.app`, it may include:

```txt
vix.app
generated CMakeLists.txt
```

The exact fingerprint strategy can evolve, but the goal stays the same:

```txt
reconfigure only when configuration inputs changed
```

## Build graph import

Even when CMake remains the compatibility layer, Vix can still learn from the generated build files.

After configure, Vix can inspect:

```txt
compile_commands.json
build.ninja
dependency files
```

This lets Vix understand compile tasks, link tasks, and dependencies.

That knowledge is useful for:

```txt
incremental builds
object cache
artifact cache
target-aware execution
diagnostics
future native scheduling
```

## compile_commands.json

`compile_commands.json` provides exact compiler commands.

This matters because cache keys should not guess.

A correct object cache needs to know:

```txt
compiler
source file
working directory
arguments
defines
include paths
output object
```

CMake already knows this after configuration.

Vix can import it.

## build.ninja

`build.ninja` describes the generated build graph.

Vix can parse it to identify edges such as:

```txt
Compile
Archive
Link
Copy
Install
Utility
```

This lets Vix understand what Ninja is going to do.

Even if CMake/Ninja execute the build, Vix can use this graph for analysis and caching.

## Dependency files

Compiler dependency files show which headers affect each object file.

Example:

```txt
main.o: src/main.cpp include/app.hpp include/config.hpp
```

This is required for correct incremental behavior.

If a header changes, dependent object files must be rebuilt.

CMake/Ninja can produce these files, and Vix can import them.

## Why compatibility path is not the final path

The CMake compatibility path is stable and practical.

But it is not always the fastest possible path for simple projects.

It still has overhead:

```txt
CMake configure
CMake generate
Ninja file generation
build file parsing
external build system coordination
```

For arbitrary CMake projects, that is necessary.

For `vix.app`, Vix eventually knows enough to avoid some of it.

## vix.app as the future fast path

Because `vix.app` is structured, Vix can later build directly from it.

Future path:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

This is different from the CMake compatibility path.

Vix does not need to interpret arbitrary CMake.

It only needs to understand the manifest it owns.

## Why this split is realistic

Trying to replace CMake for every project is not realistic.

But optimizing the projects described by `vix.app` is realistic.

So the architecture becomes:

```txt
CMakeLists.txt -> compatibility and full control
vix.app        -> simple and eventually native fast path
```

This gives Vix a strong technical boundary.

## What CMake compatibility should preserve

The compatibility path should preserve:

```txt
existing CMake projects
manual CMakeLists.txt behavior
CMake presets when available
CMake package discovery
toolchain workflows
custom targets
advanced build logic
```

Vix should not break these.

It should improve the workflow around them.

## What Vix can still improve

Even on the CMake path, Vix can improve:

```txt
startup command simplicity
default presets
diagnostics
logs
compiler launcher setup
fast linker setup
cache integration
build graph analysis
target-aware behavior
run integration
```

So CMake compatibility does not mean Vix is only a thin wrapper.

It can still add significant value.

## Common compatibility scenarios

### Existing CMake app

```txt
app/
  CMakeLists.txt
  src/
    main.cpp
```

Command:

```bash
vix build
```

Vix uses the existing CMake project.

### vix.app simple app

```txt
app/
  vix.app
  src/
    main.cpp
```

Command:

```bash
vix build
```

Vix generates CMake internally, then builds it.

### Advanced project

```txt
engine/
  CMakeLists.txt
  cmake/
  src/
  tests/
  tools/
```

Command:

```bash
vix build
```

Vix keeps the CMake path.

## CMake fallback for vix.app

If `vix.app` is not enough, the user can add a `CMakeLists.txt`.

Once it exists, Vix uses it.

This gives a smooth migration path:

```txt
start with vix.app
move to CMakeLists.txt when needed
```

No special migration command is required.

## Generated CMake is disposable

For `vix.app`, generated CMake is internal.

It lives under:

```txt
.vix/generated/app/CMakeLists.txt
```

It should not be edited manually.

The source of truth is:

```txt
vix.app
```

If the project needs manual CMake edits, it should become a real `CMakeLists.txt` project.

## Engineering principle

The engineering principle is:

```txt
Do not fight CMake where CMake is strongest.
Avoid CMake where Vix has enough structured information.
```

CMake is strong for complex build logic.

`vix.app` is strong for simple target descriptions.

Vix sits above both.

## Conclusion

`vix build` keeps CMake as the compatibility path because C++ projects need it.

This makes Vix safe for existing projects and practical for advanced builds.

At the same time, `vix.app` gives Vix a simpler structured input for common projects.

The current model is:

```txt
CMakeLists.txt -> CMake compatibility path
vix.app        -> generated CMake compatibility path
```

The future model can add:

```txt
vix.app -> native BuildGraph fast path
```

That is the balance:

```txt
compatibility today
simplicity today
native speed later
```
