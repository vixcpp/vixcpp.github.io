# Why vix.app Exists

`vix.app` exists because starting a C++ project should not require writing a build system first.

C++ gives you control, performance, and long-term stability. But the first step is often too heavy:

```txt
create a folder
write CMakeLists.txt
choose a generator
configure the build
understand targets
understand include paths
understand link libraries
then finally write code
```

For experienced C++ engineers, this is normal.

For application developers, it is friction.

`vix.app` is Vix.cpp’s answer to that friction.

It is a small project manifest that lets a developer describe a C++ target directly.

```txt
this is the target name
this is the target type
these are the source files
these are the include directories
these are the packages
these are the libraries
build it
run it
```

## The problem

C++ does not have a single default application workflow.

In many ecosystems, a new project starts with one command and one simple config file.

In C++, even a small application often begins with build-system decisions.

A minimal CMake project is already a small build-system program:

```cmake
cmake_minimum_required(VERSION 3.24)

project(hello LANGUAGES CXX)

add_executable(hello
  src/main.cpp
)

target_compile_features(hello PRIVATE cxx_std_20)
```

This is not too complex.

But it is still not the application.

It is setup.

For a bigger project, the setup grows quickly:

```cmake
target_include_directories(...)
target_compile_definitions(...)
target_compile_options(...)
target_link_libraries(...)
find_package(...)
set_target_properties(...)
add_custom_command(...)
```

These are powerful tools.

But not every project should need to start there.

## The goal

The goal of `vix.app` is not to replace CMake.

The goal is to make the common path smaller.

A simple C++ application should be able to start with:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Then:

```bash
vix build
vix run
```

That is the whole point.

`vix.app` makes the first step smaller.

## What vix.app is

`vix.app` is a manifest.

It describes one C++ target.

Example:

```ini
name = myapp
type = executable
standard = c++20

sources = [
  src/main.cpp,
  src/app.cpp,
]

include_dirs = [
  include,
]
```

This is not a new programming language.

It is not a complete build-system replacement.

It is a compact description of the target that Vix can understand.

From this manifest, Vix can generate the internal build configuration needed to compile the project.

## What vix.app is not

`vix.app` is not trying to become a second CMake.

It should not grow into a huge language with every possible build-system feature.

That would recreate the same complexity under a different file name.

The design rule is:

```txt
vix.app stays simple.
The generated build layer can be powerful.
CMake remains available for full control.
```

This keeps the model clean.

## The resolution rule

Vix uses a simple project resolution rule:

```txt
1. If CMakeLists.txt exists, use CMakeLists.txt.
2. Otherwise, if vix.app exists, use vix.app.
```

This matters.

It means `vix.app` is non-destructive.

Existing CMake projects keep working exactly as before.

A project that needs full CMake control can still use CMake.

A project that does not need that complexity can use `vix.app`.

## Why CMake still matters

CMake is powerful because it can describe very complex projects.

It handles:

```txt
multiple targets
custom commands
generated sources
install rules
CTest
FetchContent
toolchains
platform-specific logic
package exports
large dependency graphs
```

`vix.app` should not try to hide or duplicate all of that.

For advanced C++ projects, CMake is still the right tool.

For simple and medium projects, `vix.app` gives a smaller entry point.

## The internal model

Today, `vix.app` works by generating an internal CMake project.

The flow is:

```txt
vix.app
  -> .vix/generated/app/CMakeLists.txt
  -> CMake configure
  -> CMake build
  -> executable or library
```

The user edits:

```txt
vix.app
```

Vix generates:

```txt
.vix/generated/app/CMakeLists.txt
```

The generated file is internal.

It can be inspected for debugging, but it should not be edited manually.

## Why generate CMake first

Generating CMake gives Vix a compatibility path.

It allows `vix.app` to work with the existing C++ ecosystem while keeping the user-facing configuration small.

This gives Vix three important properties:

```txt
simple user experience
compatibility with existing build tools
a migration path to full CMake when needed
```

It also lets `vix.app` become official without requiring a complete native build system on day one.

## The future path

The long-term direction is more ambitious.

For `vix.app` projects, Vix can eventually avoid CMake in the hot path.

The future model can become:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

That is important because `vix.app` gives Vix structured information directly:

```txt
sources
include_dirs
defines
links
compile_options
link_options
packages
resources
output_dir
```

For a normal CMake project, Vix has to ask CMake to produce the build graph.

For a `vix.app` project, Vix already knows enough to create a native graph.

That makes `vix.app` not only a simpler interface, but also a possible fast path for future builds.

## vix.app as the fast path

The long-term architecture is:

```txt
CMakeLists.txt -> compatibility path
vix.app        -> fast path
```

This does not mean removing CMake support.

It means Vix can optimize the projects it understands directly.

A simple `vix.app` project can eventually skip unnecessary configure/generate work and go straight to the build graph.

That opens the door to faster incremental builds.

## Why this matters for C++

C++ build times are affected by many things:

```txt
headers
templates
translation units
linking
dependency scanning
build-system generation
configuration steps
```

Vix cannot magically make C++ compilation free.

But it can avoid unnecessary work.

A good build system should know when nothing changed.

It should know which source file changed.

It should know which object file can be reused.

It should know when linking is unnecessary.

It should know when an artifact can be restored from cache.

`vix.app` gives Vix a cleaner starting point for this.

## Small projects should stay small

A small C++ app should not need a large build file.

This should be enough:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

A library should be just as direct:

```ini
name = mathlib
type = static
standard = c++20

sources = [
  src/add.cpp,
  src/mul.cpp,
]

include_dirs = [
  include,
]
```

Tests can stay explicit too:

```txt
mathlib/
  vix.app
  tests/
    vix.app
```

One manifest per target keeps the system predictable.

## The tradeoff

The tradeoff is intentional.

`vix.app` does not try to cover every case.

It covers the common case well.

When a project becomes complex, the right answer is not to keep adding more syntax forever.

The right answer is:

```txt
Use CMakeLists.txt.
```

This keeps the boundary clear.

## Design principles

`vix.app` follows a few principles.

### One target per manifest

A manifest describes one target.

That target can be:

```txt
executable
static library
shared library
```

This keeps parsing, build planning, diagnostics, and documentation simple.

### Explicit over magic

`packages` finds packages.

`links` links targets.

Example:

```ini
packages = [
  fmt:REQUIRED,
]

links = [
  fmt::fmt,
]
```

Vix does not guess that `fmt` should automatically link `fmt::fmt`.

That kind of magic can become fragile.

### Simple paths

Source files are listed explicitly:

```ini
sources = [
  src/main.cpp,
  src/app.cpp,
]
```

Include directories are listed explicitly:

```ini
include_dirs = [
  include,
]
```

This makes the build easy to inspect.

### Generated files are internal

Vix may generate CMake internally.

But the source of truth remains:

```txt
vix.app
```

The generated CMake file is not the user interface.

## The engineering reason

The engineering reason for `vix.app` is separation of concerns.

CMake is a powerful build description language.

`vix.app` is a product-level project description.

Those are not the same thing.

An application developer often wants to describe the product target:

```txt
name
type
standard
sources
dependencies
resources
```

The build engine can translate that into lower-level build operations.

That translation can target CMake today.

It can target Vix’s native BuildGraph later.

## The user-facing result

With `vix.app`, the first experience becomes:

```bash
mkdir hello
cd hello
mkdir src
touch src/main.cpp
touch vix.app
vix build
vix run
```

The developer can focus on the application first.

The build system is still there, but it is not the first thing they have to fight.

## The technical boundary

The boundary is simple:

```txt
If your project is one clear target, use vix.app.
If your project needs advanced build logic, use CMakeLists.txt.
```

This is a stable boundary.

It lets Vix improve the simple path without pretending that all C++ projects are simple.

## Conclusion

`vix.app` exists to make C++ project setup smaller.

It gives Vix a simple, structured project description.

It keeps CMake available for advanced projects.

It creates a future path for native Vix builds.

Most importantly, it lets a developer start a C++ project by describing the application, not by writing the build system first.

```txt
vix.app is the simple path.
CMake is the compatibility path.
Vix connects both.
```
