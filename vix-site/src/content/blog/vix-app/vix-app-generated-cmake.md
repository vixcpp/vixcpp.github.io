---
title: vix.app Generated CMake
description: How vix.app is translated into an internal CMake project, why generated CMake exists, and how Vix keeps the user-facing manifest simple.
date: 2026-05-17
---

# vix.app Generated CMake

`vix.app` is the user-facing project description.

CMake is the compatibility layer underneath.

The current implementation works like this:

```txt
vix.app
  -> parse manifest
  -> validate manifest
  -> generate .vix/generated/app/CMakeLists.txt
  -> configure with CMake
  -> build with CMake/Ninja
```

The generated CMake file is not meant to be edited by the user.

It is an implementation detail that lets Vix support a simpler project format without breaking compatibility with the C++ ecosystem.

## Why generate CMake?

The main reason is compatibility.

CMake already understands:

```txt
compilers
generators
toolchains
targets
linking
find_package(...)
platform differences
Ninja integration
build directories
```

Instead of replacing all of that immediately, Vix can start with a smaller layer:

```txt
vix.app -> generated CMake
```

This gives the user a simple manifest while still using the existing build infrastructure underneath.

## The user-facing file

The user writes:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

This file is small.

It only describes the target.

It does not need to contain:

```txt
cmake_minimum_required(...)
project(...)
add_executable(...)
target_compile_features(...)
target_include_directories(...)
```

Vix generates those details internally.

## The generated file location

For `vix.app` projects, Vix writes the generated CMake file under:

```txt
.vix/generated/app/CMakeLists.txt
```

Example project:

```txt
hello/
  vix.app
  src/
    main.cpp
```

After running:

```bash
vix build
```

Vix may create:

```txt
hello/
  .vix/
    generated/
      app/
        CMakeLists.txt
```

This generated file is part of Vix’s internal build metadata.

## Do not edit generated CMake

Do not edit:

```txt
.vix/generated/app/CMakeLists.txt
```

Edit:

```txt
vix.app
```

The generated file can be replaced whenever Vix regenerates the project.

If you need to change the target, sources, include directories, links, packages, or resources, change the manifest.

## A minimal example

Input `vix.app`:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

The generated CMake is conceptually similar to:

```cmake
cmake_minimum_required(VERSION 3.24)

project(hello LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(hello
  /absolute/path/to/project/src/main.cpp
)
```

The exact generated output may evolve, but the idea is stable:

```txt
manifest fields become target-level CMake instructions
```

## Mapping vix.app to CMake

The generator translates manifest fields into CMake concepts.

| vix.app field | Generated CMake concept |
| --- | --- |
| `name` | target name and project name |
| `type = executable` | `add_executable(...)` |
| `type = static` | `add_library(... STATIC ...)` |
| `type = shared` | `add_library(... SHARED ...)` |
| `standard` | `CMAKE_CXX_STANDARD` |
| `sources` | target source list |
| `include_dirs` | `target_include_directories(...)` |
| `defines` | `target_compile_definitions(...)` |
| `compile_options` | `target_compile_options(...)` |
| `link_options` | `target_link_options(...)` |
| `compile_features` | `target_compile_features(...)` |
| `packages` | `find_package(...)` |
| `links` | `target_link_libraries(...)` |
| `resources` | post-build copy commands |
| `output_dir` | target output directory properties |

## Target generation

The `type` field decides what target command is generated.

For an executable:

```ini
name = hello
type = executable
```

Vix generates the equivalent of:

```cmake
add_executable(hello
  ...
)
```

For a static library:

```ini
name = mathlib
type = static
```

Vix generates the equivalent of:

```cmake
add_library(mathlib STATIC
  ...
)
```

For a shared library:

```ini
name = plugin
type = shared
```

Vix generates the equivalent of:

```cmake
add_library(plugin SHARED
  ...
)
```

This keeps the manifest small while still producing a normal CMake target internally.

## Source paths

In `vix.app`, source paths are written relative to the project directory.

Example:

```ini
sources = [
  src/main.cpp,
  src/app.cpp,
]
```

The generator resolves these paths relative to the directory containing `vix.app`.

Internally, it can emit normalized paths in the generated CMake file.

This avoids ambiguity when CMake is configured from:

```txt
.vix/generated/app/
```

rather than from the user project root.

## Why paths need care

The generated CMake project lives in:

```txt
.vix/generated/app/
```

But the user’s source files live in the real project directory:

```txt
src/
include/
assets/
```

That means the generator must be careful.

It cannot assume that relative paths inside the generated CMake file are relative to the original project root.

It must resolve user paths safely.

This is one reason generated CMake is handled by Vix instead of asking the user to edit it.

## Include directories

Input:

```ini
include_dirs = [
  include,
  third_party/asio/include,
]
```

Generated CMake is conceptually similar to:

```cmake
target_include_directories(myapp PRIVATE
  /absolute/path/to/project/include
  /absolute/path/to/project/third_party/asio/include
)
```

The manifest stays relative and readable.

The generated layer can use resolved paths.

## Compile definitions

Input:

```ini
defines = [
  MYAPP_VERSION="1.2.3",
  MYAPP_ENABLE_LOGGING=1,
]
```

Generated CMake is conceptually similar to:

```cmake
target_compile_definitions(myapp PRIVATE
  MYAPP_VERSION="1.2.3"
  MYAPP_ENABLE_LOGGING=1
)
```

Definitions remain target-local.

They are not global compiler flags.

## Compile options

Input:

```ini
compile_options = [
  -Wall,
  -Wextra,
  -Wpedantic,
]
```

Generated CMake:

```cmake
target_compile_options(myapp PRIVATE
  -Wall
  -Wextra
  -Wpedantic
)
```

These options are emitted as raw CMake list items, not quoted strings, because compiler flags and CMake targets often need to remain raw.

## Link options

Input:

```ini
link_options = [
  "-Wl,--as-needed",
]
```

Generated CMake:

```cmake
target_link_options(myapp PRIVATE
  -Wl,--as-needed
)
```

Values containing commas should be quoted in `vix.app` so the manifest parser does not split them incorrectly.

## Compile features

Input:

```ini
compile_features = [
  cxx_std_23,
]
```

Generated CMake:

```cmake
target_compile_features(myapp PRIVATE
  cxx_std_23
)
```

Most projects can use:

```ini
standard = c++23
```

But `compile_features` is available when explicit CMake features are needed.

## Packages

Input:

```ini
packages = [
  Threads:REQUIRED,
  fmt:REQUIRED,
  "Boost:COMPONENTS=system,filesystem:REQUIRED",
]
```

Generated CMake is conceptually similar to:

```cmake
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)
find_package(fmt REQUIRED)
find_package(Boost REQUIRED COMPONENTS system filesystem)
```

The package field only emits `find_package(...)`.

It does not link imported targets automatically.

## Links

Input:

```ini
links = [
  Threads::Threads,
  fmt::fmt,
  Boost::system,
  Boost::filesystem,
]
```

Generated CMake:

```cmake
target_link_libraries(myapp PRIVATE
  Threads::Threads
  fmt::fmt
  Boost::system
  Boost::filesystem
)
```

This separation is deliberate.

`packages` discovers packages.

`links` links targets or libraries.

The generator does not guess which imported targets a package should link.

## Why links are raw

CMake imported targets such as:

```txt
Threads::Threads
fmt::fmt
Boost::system
```

should be emitted as CMake target names.

They should not be treated like ordinary quoted strings.

This is why the generator needs separate handling for:

```txt
quoted path-like values
raw CMake target-like values
```

For target links, compile features, compile options, and link options, raw output is usually the correct behavior.

## Output directories

Input:

```ini
output_dir = bin
```

Generated CMake is conceptually similar to:

```cmake
set_target_properties(myapp PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
  LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
  ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)
```

A relative `output_dir` is resolved under the build directory.

So with:

```txt
build-ninja/
```

the output becomes:

```txt
build-ninja/bin/
```

## Resources

Input:

```ini
resources = [
  assets,
  "data/config.json=config/config.json",
]
```

The generator emits post-build copy commands.

Conceptually:

```cmake
add_custom_command(TARGET myapp POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_directory
          /path/to/project/assets
          $<TARGET_FILE_DIR:myapp>/assets
)
```

And for a renamed file:

```cmake
add_custom_command(TARGET myapp POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy
          /path/to/project/data/config.json
          $<TARGET_FILE_DIR:myapp>/config/config.json
)
```

The exact generated command may differ, but the behavior is:

```txt
resources are copied next to the built target after build
```

## Why generated CMake is readable

The generated CMake should be readable.

Even though users should not edit it, readability matters for debugging.

A readable generated file helps engineers understand:

```txt
what Vix parsed
what Vix generated
what CMake is configuring
why a package is found or not found
why a target links or does not link
where resources are copied
```

Generated code is still engineering output.

It should not be treated as a black box.

## Debugging generated CMake

If a `vix.app` build fails, inspect:

```txt
.vix/generated/app/CMakeLists.txt
```

Then run:

```bash
vix build -v
```

or:

```bash
vix build --cmake-verbose
```

You can also pass extra CMake arguments after `--`:

```bash
vix build -- -DCMAKE_PREFIX_PATH=/path/to/prefix
```

This is useful for packages installed in custom locations.

## Error boundary

The best errors should happen before CMake runs.

For example, Vix should catch:

```txt
missing name
missing sources
invalid target type
invalid standard
malformed array
unknown field
source file not found
invalid package syntax
```

These errors belong at the manifest layer.

CMake should not be the first tool to discover that `src/main.cpp` does not exist.

## CMake errors still happen

Some errors can only happen at configure or build time.

Examples:

```txt
package not found
imported target not found
compiler flag not supported
linker flag not supported
symbol not found
duplicate main()
undefined reference
```

These are normal build errors.

Vix can improve diagnostics, but they still originate from the compiler, linker, or CMake.

## Example: package found but not linked

Input:

```ini
packages = [
  fmt:REQUIRED,
]
```

Generated CMake finds `fmt`, but no link is emitted.

The build may fail if the source uses `fmt`.

Correct manifest:

```ini
packages = [
  fmt:REQUIRED,
]

links = [
  fmt::fmt,
]
```

This produces both:

```cmake
find_package(fmt REQUIRED)
```

and:

```cmake
target_link_libraries(myapp PRIVATE
  fmt::fmt
)
```

## Example: wrong source path

Input:

```ini
sources = [
  main.cpp,
]
```

But the real file is:

```txt
src/main.cpp
```

Vix should fail during manifest validation:

```txt
vix.app source file not found: main.cpp
```

The fix is:

```ini
sources = [
  src/main.cpp,
]
```

This is better than generating invalid CMake and waiting for CMake to fail later.

## Why not expose generated CMake as the API

One possible design would be:

```txt
vix app init
generate CMakeLists.txt
user edits generated CMake
```

But that would turn the generated file into the source of truth.

That is not the goal.

The source of truth should remain:

```txt
vix.app
```

The generated CMake is disposable.

That allows Vix to improve the generator without forcing users to maintain generated build files.

## Generated CMake and future native builds

The generated CMake layer is the current compatibility path.

It does not have to be the final build path.

Because `vix.app` is structured, Vix can later build directly from it:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

In that future model, generated CMake may still exist as:

```txt
debug output
fallback path
compatibility mode
export format
```

But the hot path for simple projects could become native.

## Why this matters

Arbitrary CMake is hard to optimize because CMake is a full language.

Vix has to ask CMake what the build graph is.

But `vix.app` is declarative and narrow.

Vix can understand it directly.

That means Vix can eventually answer questions like:

```txt
Which source files belong to this target?
Which include directories affect compilation?
Which definitions changed?
Which object files can be reused?
Does this target need to link again?
Which resources need copying?
```

This is the foundation for a faster build path.

## Generated CMake as a bridge

The current design is a bridge.

It gives users a small manifest today.

It keeps CMake compatibility today.

It prepares Vix for native build execution later.

That is why generated CMake exists.

It is not the final vision.

It is the safe compatibility layer.

## Common debugging checklist

When debugging a generated CMake project:

```txt
1. Check vix.app first.
2. Check .vix/generated/app/CMakeLists.txt.
3. Check that sources were resolved correctly.
4. Check include directories.
5. Check packages.
6. Check links.
7. Check output_dir.
8. Check resource copy commands.
9. Run vix build -v.
10. Use --cmake-verbose if configure output is needed.
```

## What should not be generated

The generator should not try to invent complex logic.

It should not guess:

```txt
which imported targets to link
which optional packages to use
how to fetch dependencies
how to generate sources
how to install packages
how to run CTest
```

Those belong in explicit user configuration or full CMake.

The generator should be powerful, but not magical.

## Conclusion

Generated CMake is the bridge between `vix.app` and the existing C++ build ecosystem.

The user writes a small manifest.

Vix validates it.

Vix generates a normal CMake project internally.

CMake and Ninja build it.

The generated file remains internal and disposable.

This gives Vix a practical path:

```txt
simple manifest today
CMake compatibility today
native BuildGraph tomorrow
```

That is the engineering role of generated CMake in `vix.app`.
