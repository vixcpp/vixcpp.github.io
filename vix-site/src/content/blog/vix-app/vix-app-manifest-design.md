---
title: vix.app Manifest Design
description: A technical look at the vix.app manifest format, why it stays small, and how it maps common C++ project needs to a predictable build description.
date: 2026-05-17
---

# vix.app Manifest Design

`vix.app` is designed around one idea:

```txt
a C++ project should be describable before it becomes a build-system program
```

The manifest is intentionally small.

It does not try to expose every CMake feature.

It describes the common structure of a C++ target in a way that Vix can parse, validate, generate, and later optimize.

## The design problem

A C++ project usually needs a build description.

Even for a small executable, the build system needs to know:

```txt
target name
target type
C++ standard
source files
include directories
definitions
libraries
compiler flags
resources
```

CMake can describe all of that.

But CMake also has a much larger surface area:

```txt
functions
macros
custom commands
generator expressions
install rules
package exports
toolchain logic
platform branches
dependency fetching
multi-target graphs
```

That power is useful.

But it is not always necessary for a simple app.

`vix.app` separates the common project description from the full build-system language.

## One manifest, one target

The central rule is:

```txt
one vix.app = one target
```

A target can be:

```txt
executable
static library
shared library
```

This avoids turning `vix.app` into a complex multi-target language.

A simple executable:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

A simple static library:

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

This model is predictable.

The parser reads one target.

The generator emits one target.

The build planner knows the default target name.

`vix run` knows what executable to search for.

## Why not multi-target immediately

A multi-target manifest could look attractive:

```txt
targets = [
  app,
  tests,
  examples,
  libs
]
```

But that creates many questions:

```txt
How are targets linked together?
How are public and private includes represented?
How are per-target packages handled?
How are tests discovered?
How are examples grouped?
How are install rules expressed?
How is ordering represented?
```

At that point, the manifest starts becoming a second CMake.

That is not the goal.

The V1 design keeps the boundary clear:

```txt
simple target -> vix.app
complex graph -> CMakeLists.txt
```

For tests and examples, the recommended model is:

```txt
project/
  vix.app

  tests/
    vix.app

  examples/
    basic/
      vix.app
```

Each target stays explicit.

## The manifest shape

A `vix.app` file is a key-value manifest.

The simplest form is:

```ini
key = value
```

Arrays can be written inline:

```ini
sources = [src/main.cpp, src/app.cpp]
```

or across multiple lines:

```ini
sources = [
  src/main.cpp,
  src/app.cpp,
]
```

Comments use `#`:

```ini
# Application target
name = hello
```

Inline comments are also supported:

```ini
type = executable # executable target
```

Values can be quoted when needed:

```ini
sources = [
  "src/with space.cpp",
]
```

The format is intentionally boring.

That is a feature.

A build manifest should be easy to read in a terminal, easy to review in a diff, and easy to generate from tools.

## Required fields

A useful target needs at least two things:

```txt
name
sources
```

Example:

```ini
name = hello

sources = [
  src/main.cpp,
]
```

`type` and `standard` have defaults.

The default target type is:

```ini
type = executable
```

The default C++ standard is:

```ini
standard = c++20
```

For clarity, most examples still write them explicitly:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Explicit manifests are easier to understand.

## Target name

The `name` field defines the target name.

```ini
name = hello
```

This name is used for several things:

```txt
generated target name
default build target
executable lookup in vix run
artifact identity
diagnostics
```

This is why the name should be stable and simple.

Recommended:

```ini
name = myapp
```

```ini
name = mathlib
```

```ini
name = softadastra_server
```

Avoid:

```ini
name = "my app"
```

A target name is not a display title.

It is part of the build identity.

## Target type

The `type` field defines what is generated.

```ini
type = executable
```

```ini
type = static
```

```ini
type = shared
```

The common mapping is:

```txt
executable -> add_executable(...)
static     -> add_library(... STATIC ...)
shared     -> add_library(... SHARED ...)
```

This is the most important build-system decision the manifest makes.

If the target has `main()`, it should usually be:

```ini
type = executable
```

If the target is reusable code, it should usually be:

```ini
type = static
```

or:

```ini
type = shared
```

## C++ standard

The `standard` field chooses the language standard.

```ini
standard = c++20
```

Supported values are intentionally explicit:

```txt
c++17
c++20
c++23
```

The manifest does not use forms like:

```txt
cpp20
20
std20
```

The goal is to keep the syntax close to what C++ developers already recognize.

## Sources are explicit

`vix.app` uses an explicit source list.

```ini
sources = [
  src/main.cpp,
  src/app.cpp,
]
```

This avoids hidden glob behavior.

Globs look convenient at first, but they can make builds less predictable.

An explicit list makes it clear what is part of the target.

It also helps Vix validate the project before generating the internal build files.

If a source file does not exist, Vix can fail early with a useful error instead of waiting for a lower-level build tool to fail later.

## Include directories

Include directories are listed with `include_dirs`.

```ini
include_dirs = [
  include,
]
```

This maps to the include paths needed by the target.

Recommended layout:

```txt
myapp/
  include/
    myapp/
      app.hpp
  src/
    main.cpp
    app.cpp
```

Manifest:

```ini
include_dirs = [
  include,
]
```

Code:

```cpp
#include <myapp/app.hpp>
```

The manifest stays clear:

```txt
sources compile files
include_dirs expose header search paths
```

## Definitions

Preprocessor definitions go under `defines`.

```ini
defines = [
  MYAPP_VERSION="1.0.0",
  MYAPP_ENABLE_LOGGING=1,
]
```

This keeps compile-time configuration visible in the manifest.

It also avoids hiding important build configuration inside ad-hoc compiler flags.

## Compile options

Compiler flags go under `compile_options`.

```ini
compile_options = [
  -Wall,
  -Wextra,
]
```

These are target-level options.

They are useful for warnings and local tuning.

The manifest does not try to normalize every compiler flag across every compiler.

That is a deliberate boundary.

For portable projects, keep this list small.

For advanced compiler-specific logic, use CMake.

## Link options

Linker flags go under `link_options`.

```ini
link_options = [
  "-Wl,--as-needed",
]
```

This is separate from `compile_options`.

The split matters because compiler options and linker options have different meanings.

Incorrect:

```ini
compile_options = [
  "-Wl,--as-needed",
]
```

Correct:

```ini
link_options = [
  "-Wl,--as-needed",
]
```

## Packages and links are separate

This is one of the most important design choices.

`packages` is for discovery.

`links` is for linking.

```txt
packages -> find_package(...)
links    -> target_link_libraries(...)
```

Example:

```ini
packages = [
  fmt:REQUIRED,
]

links = [
  fmt::fmt,
]
```

Vix does not automatically link `fmt::fmt` just because `fmt` was found.

That would be convenient in some cases, but fragile in others.

Different packages expose different target names.

Examples:

```txt
fmt      -> fmt::fmt
Boost    -> Boost::system, Boost::filesystem
Threads  -> Threads::Threads
OpenSSL  -> OpenSSL::SSL, OpenSSL::Crypto
```

The manifest keeps this explicit.

## Package syntax

The package syntax is compact:

```txt
<name>
<name>:REQUIRED
<name>:COMPONENTS=a,b
<name>:COMPONENTS=a,b:REQUIRED
```

Examples:

```ini
packages = [
  Threads:REQUIRED,
]
```

```ini
packages = [
  "Boost:COMPONENTS=system,filesystem:REQUIRED",
]
```

Values with commas should be quoted.

This prevents the parser from splitting the package into multiple array items.

## Resources

Runtime files go under `resources`.

```ini
resources = [
  assets,
  "data/config.json=config/config.json",
]
```

The first form copies a file or directory using its basename.

```ini
resources = [
  assets,
]
```

The second form copies to a custom destination.

```ini
resources = [
  "data/config.json=config/config.json",
]
```

Resources are copied next to the built target.

This is useful for:

```txt
assets
config files
templates
public files
test data
```

## Output directory

`output_dir` controls the target output location inside the build tree.

```ini
output_dir = bin
```

For an executable, this usually gives a layout like:

```txt
build-ninja/
  bin/
    myapp
```

For a library, a common value is:

```ini
output_dir = lib
```

This field is not an install prefix.

It only controls the build output layout.

## Why the manifest is not JSON

A JSON manifest would be easy for machines, but less pleasant for humans.

This is noisy:

```json
{
  "name": "hello",
  "type": "executable",
  "standard": "c++20",
  "sources": ["src/main.cpp"]
}
```

The `vix.app` form is closer to a build manifest:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

It is easier to edit by hand.

It also avoids JSON quoting everywhere.

## Why the manifest is not YAML

YAML is powerful, but it has a large and sometimes surprising syntax surface.

`vix.app` uses a smaller format on purpose.

The goal is not to support every data-shaping feature.

The goal is to describe a C++ target clearly.

## Why the manifest is not TOML

TOML would also work.

But `vix.app` uses a smaller custom format because the domain is narrow.

The manifest needs:

```txt
key = value
array = [...]
comments
quoted values
```

That is enough for the current design.

A smaller parser also gives Vix tighter control over diagnostics.

## Validation is part of the design

The manifest is not only parsed.

It should be validated.

Examples of validation:

```txt
missing name
missing sources
invalid target type
invalid standard
unknown field
malformed array
invalid package syntax
source file not found
```

Early validation gives better errors.

It also keeps generated CMake cleaner because invalid states are rejected before generation.

## Generated CMake as an implementation detail

Today, the manifest is translated into an internal CMake project.

Example flow:

```txt
vix.app
  -> parse manifest
  -> validate manifest
  -> generate .vix/generated/app/CMakeLists.txt
  -> configure
  -> build
```

The generated CMake is not the source of truth.

The source of truth is:

```txt
vix.app
```

This separation matters.

It means the user edits a small manifest, while Vix handles the lower-level build details.

## The manifest as future build input

The manifest is also useful beyond generated CMake.

Because it is structured, Vix can later use it to build a native graph directly.

Future path:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

That is harder with arbitrary CMake because CMake is a full language.

But with `vix.app`, Vix already knows the target structure.

This makes the manifest a possible fast path.

## A complete manifest

A realistic manifest can look like this:

```ini
name = myapp
type = executable
standard = c++23
output_dir = bin

sources = [
  src/main.cpp,
  src/app.cpp,
  src/network/client.cpp,
]

include_dirs = [
  include,
  third_party/asio/include,
]

defines = [
  MYAPP_VERSION="1.2.3",
  MYAPP_ENABLE_LOGGING=1,
]

packages = [
  Threads:REQUIRED,
  fmt:REQUIRED,
  "Boost:COMPONENTS=system,filesystem:REQUIRED",
]

links = [
  Threads::Threads,
  fmt::fmt,
  Boost::system,
  Boost::filesystem,
]

compile_options = [
  -Wall,
  -Wextra,
  -Wpedantic,
]

link_options = [
  "-Wl,--as-needed",
]

compile_features = [
  cxx_std_23,
]

resources = [
  assets,
  "data/config.json=config/config.json",
]
```

This is still a small file.

It describes the target without exposing the full complexity of CMake.

## What belongs in vix.app

Good fields for `vix.app` are fields that describe the target directly:

```txt
name
type
standard
sources
include_dirs
defines
links
compile_options
link_options
compile_features
packages
resources
output_dir
```

These are stable concepts.

They map well to common C++ projects.

## What does not belong in vix.app

Some things should stay out of the manifest.

Examples:

```txt
complex install rules
custom code generation
large dependency graphs
FetchContent
CTest discovery
toolchain-specific branches
custom CMake functions
package export generation
```

These belong in CMake.

The manifest should not grow until it becomes another build-system language.

## The boundary

The design boundary is:

```txt
vix.app describes one target.
CMake describes arbitrary build logic.
```

That boundary keeps both tools useful.

`vix.app` makes the simple path simpler.

CMake remains the escape hatch for full control.

## Conclusion

The `vix.app` manifest is designed to be small, explicit, and predictable.

It focuses on the common shape of a C++ target:

```txt
name
type
standard
sources
includes
packages
links
resources
```

It avoids hidden magic.

It keeps package discovery separate from linking.

It uses generated CMake today for compatibility.

It can become native BuildGraph input later.

That is the main reason the manifest exists as a separate layer.

```txt
vix.app is not a second CMake.
It is a structured target description for Vix.
```
