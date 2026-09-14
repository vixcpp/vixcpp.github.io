---
title: vix run Script Mode vs Project Mode
description: How vix run separates single-file execution from project execution, why both modes exist, and how Vix decides which build path to use.
date: 2026-05-17
---

# vix run Script Mode vs Project Mode

`vix run` supports two different execution models:

```txt
script mode
project mode
```

They solve different problems.

Script mode is for quickly running one C++ file.

Project mode is for building and running a real project.

The command can look almost the same from the outside, but internally the flow is different.

```bash
vix run main.cpp
```

uses script mode.

```bash
vix run
```

inside a project uses project mode.

Understanding the difference matters because `vix run` must know what to compile, where to place outputs, how to resolve dependencies, and how to pass arguments to the final program.

## Why two modes exist

C++ has two common workflows.

The first workflow is quick experimentation:

```txt
I have one file.
Compile it.
Run it.
```

The second workflow is project execution:

```txt
I have a project.
Build the target.
Run the executable.
```

These workflows should not require the same setup.

A single-file program should not need a `CMakeLists.txt`.

A full project should not be treated like one loose source file.

So `vix run` separates them.

## Script mode

Script mode runs a single C++ file.

Example:

```bash
vix run main.cpp
```

This is useful for:

```txt
quick tests
small examples
experiments
learning C++
debugging snippets
single-file tools
```

The source file is the entry point.

Vix compiles it and runs the produced executable.

## Project mode

Project mode runs a project.

Example:

```bash
vix run
```

from inside:

```txt
myapp/
  vix.app
  src/
    main.cpp
```

or:

```txt
myapp/
  CMakeLists.txt
  src/
    main.cpp
```

In project mode, Vix must first resolve the project.

Then it builds the correct target.

Then it finds and runs the executable.

## The decision point

The first question is:

```txt
Did the user pass a source file?
```

If yes, Vix can use script mode:

```bash
vix run main.cpp
```

If not, Vix tries project mode:

```bash
vix run
```

Project mode searches for:

```txt
CMakeLists.txt
vix.app
```

using the normal project resolution rules.

## Script mode example

Project:

```txt
scratch/
  main.cpp
```

Command:

```bash
vix run main.cpp
```

`main.cpp`:

```cpp
#include <vix.hpp>

int main()
{
  vix::print("hello from script mode");
  return 0;
}
```

Vix can compile and run this file without requiring a project manifest.

## Project mode example with vix.app

Project:

```txt
hello/
  vix.app
  src/
    main.cpp
```

`vix.app`:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Command:

```bash
vix run
```

Vix resolves the `vix.app` project, builds the target named `hello`, then runs the produced executable.

## Project mode example with CMake

Project:

```txt
hello/
  CMakeLists.txt
  src/
    main.cpp
```

Command:

```bash
vix run
```

Vix resolves the CMake project, builds the default or selected target, then runs the executable.

CMake remains the compatibility path.

## Resolution order in project mode

Project mode uses this resolution order:

```txt
1. CMakeLists.txt
2. vix.app
```

If both files exist, Vix uses:

```txt
CMakeLists.txt
```

This preserves existing CMake behavior.

`vix.app` is used only when no `CMakeLists.txt` exists.

## Why script mode should not require vix.app

Script mode should stay lightweight.

If the user writes:

```bash
vix run main.cpp
```

they are asking for immediate execution.

They should not need:

```txt
vix.app
CMakeLists.txt
project layout
build directory setup
```

That is the point of script mode.

It gives C++ a fast entry path for experimentation.

## Why project mode should not act like script mode

A project has more structure.

It may contain:

```txt
multiple source files
include directories
resources
packages
links
compile options
output directories
tests
examples
```

A single source file is not enough to describe it.

So project mode should use project metadata from:

```txt
CMakeLists.txt
```

or:

```txt
vix.app
```

That metadata tells Vix what to build.

## Different input models

Script mode input:

```txt
one source file
```

Project mode input:

```txt
project root
manifest or CMakeLists.txt
target name
build configuration
```

This difference affects the entire execution pipeline.

## Script mode build identity

In script mode, the build identity can be derived from the source file.

Example:

```bash
vix run main.cpp
```

Possible identity:

```txt
source: main.cpp
target: main
mode: script
```

Vix can place outputs in an internal cache or build directory.

The exact output path is an implementation detail.

## Project mode build identity

In project mode, the build identity comes from the project.

For CMake projects:

```txt
target name may come from project/build settings
```

For `vix.app` projects:

```txt
target name comes from manifest.name
```

Example:

```ini
name = server
```

Target identity:

```txt
server
```

This is why project mode needs project resolution.

## Build pipeline in script mode

Script mode can follow a direct pipeline:

```txt
parse command
resolve source file
choose compiler settings
compile source
link executable
run executable
```

If the file uses installed Vix modules or registry dependencies, script mode may need additional linking logic.

But the entry point remains one source file.

## Build pipeline in project mode

Project mode follows a project pipeline:

```txt
parse command
resolve project
create build plan
build target
resolve executable path
run executable
```

For CMake projects, this goes through the CMake compatibility path.

For `vix.app`, this currently goes through generated CMake, then the same build path.

## Script mode and CMake fallback

Script mode can have a fallback path when direct compilation is not enough.

For example, a script may need:

```txt
compiled Vix modules
registry dependencies
extra link inputs
complex flags
```

A CMake fallback can generate a temporary build project for the script.

This keeps script mode simple at the command level while still supporting more complex cases internally.

## Direct script runner

For simple files, Vix can use a direct script runner.

Conceptually:

```txt
main.cpp
  -> compile
  -> link
  -> run
```

This avoids creating a full user project.

It is useful for fast feedback.

## When script mode should fallback

Script mode may need fallback when:

```txt
the script uses compiled dependencies
the script needs generated build metadata
direct linking cannot resolve required modules
platform-specific build logic is needed
```

Fallback should be internal.

The user should still run:

```bash
vix run main.cpp
```

## Project mode and vix.app

`vix.app` gives project mode a simple manifest.

Example:

```ini
name = hello
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

`vix run` uses this to know:

```txt
target name
source files
include directories
output layout
resources
```

The manifest is the project description.

## Project mode and generated CMake

For `vix.app`, Vix currently generates:

```txt
.vix/generated/app/CMakeLists.txt
```

Then it builds the generated CMake project.

The user project remains:

```txt
project/
```

The generated CMake source is:

```txt
project/.vix/generated/app/
```

`vix run` must keep these separate.

## Important path separation

For project mode, especially `vix.app`, Vix must distinguish:

```txt
userProjectDir
cmakeSourceDir
targetName
```

For CMake:

```txt
userProjectDir = cmakeSourceDir
```

For `vix.app`:

```txt
userProjectDir = project/
cmakeSourceDir = project/.vix/generated/app/
targetName = manifest.name
```

This prevents Vix from treating generated files as the real project.

## Arguments in script mode

In script mode, Vix arguments and program arguments need a clear boundary.

Example:

```bash
vix run main.cpp --run --name Gaspard
```

The idea is:

```txt
arguments before the runtime boundary belong to Vix
arguments after the runtime boundary belong to the program
```

This prevents Vix from consuming arguments that the program expects.

## Arguments in project mode

In project mode, the same problem exists.

Example:

```bash
vix run -- --port 8080
```

Here:

```txt
vix run
```

configures Vix.

Arguments after:

```txt
--
```

can be passed to the executable.

The boundary should be predictable.

## Why the argument boundary matters

C++ CLI programs often accept flags.

Example:

```bash
myapp --port 8080 --verbose
```

If Vix does not separate arguments clearly, it may treat:

```txt
--port
--verbose
```

as Vix flags instead of program flags.

A clear boundary avoids that.

## Watch mode in script mode

Script mode watch can watch the input file.

Example:

```bash
vix run main.cpp --watch
```

When `main.cpp` changes, Vix recompiles and reruns.

If the script includes local headers, watch mode may eventually need to track those too.

## Watch mode in project mode

Project mode watch should watch the user project directory.

For CMake projects:

```txt
watch project/
```

For `vix.app` projects:

```txt
watch project/
```

Not:

```txt
project/.vix/generated/app/
```

The generated directory is not the source of truth.

## Runtime working directory

The runtime working directory matters in both modes.

If the program opens:

```cpp
std::ifstream file("config/app.json");
```

then relative path behavior depends on where Vix starts the process.

Script mode may run from the current directory.

Project mode may run from the project root or executable directory.

This behavior should be consistent and documented.

## Resources in project mode

`vix.app` supports resources:

```ini
resources = [
  assets,
  "data/config.json=config/config.json",
]
```

These are copied next to the built target.

`vix run` should run the executable in a way that makes resource behavior predictable.

If the executable is under:

```txt
build-ninja/bin/
```

and resources are copied there, the working directory decision matters.

## Script mode output

Script mode output can be internal.

For example:

```txt
.vix/run/
.vix/cache/
build-script/
```

The exact path is less important than the behavior:

```txt
compile the file
run the result
reuse when safe
clean up when appropriate
```

## Project mode output

Project mode output follows the project build configuration.

For CMake and `vix.app`, this usually means:

```txt
build-ninja/
build-dev/
build-release/
```

With `vix.app`:

```ini
output_dir = bin
```

the executable may be under:

```txt
build-ninja/bin/
```

## Error handling in script mode

Common script mode errors:

```txt
source file not found
compile error
link error
missing dependency
runtime crash
invalid runtime argument boundary
```

Vix should report these as script execution errors.

The diagnostic should point to the source file when possible.

## Error handling in project mode

Common project mode errors:

```txt
project not found
invalid vix.app
CMake configure failed
build failed
target not found
executable not found
library target cannot be run
```

The diagnostic should explain whether the failure came from:

```txt
project resolution
build planning
CMake configure
compile
link
run
```

## Project not found

If the user runs:

```bash
vix run
```

outside a project, Vix may report:

```txt
Missing CMakeLists.txt or vix.app.
```

The fix is to either:

```txt
run from a project directory
pass --dir
run a source file directly
create vix.app
create CMakeLists.txt
```

Example:

```bash
vix run main.cpp
```

for script mode.

## Source file passed inside a project

If the user runs:

```bash
vix run src/main.cpp
```

inside a project, Vix should treat it as script mode because a source file was explicitly provided.

This is useful for quick experiments inside a larger repository.

The explicit file input should be respected.

## Running the project inside a project

If the user runs:

```bash
vix run
```

with no source file, Vix should use project mode.

It should search for:

```txt
CMakeLists.txt
vix.app
```

and run the project target.

## Explicit directory

Project mode can also use an explicit directory.

Example:

```bash
vix run --dir ./examples/hello
```

Then Vix should resolve the project from that directory.

If that directory contains `vix.app`, the manifest defines the target.

## Explicit build target

For project mode, the user may choose a target:

```bash
vix run --build-target server
```

This is most useful for CMake projects with multiple targets.

For `vix.app`, there is usually one target, so the manifest name is enough.

## How script mode and project mode should stay separate

A clean implementation avoids mixing concepts.

Script mode should not require project resolution.

Project mode should not guess from a random `.cpp` file.

The high-level split is:

```txt
if source file input exists:
  script mode
else:
  project mode
```

This keeps behavior predictable.

## Shared lower layers

Even though script mode and project mode are different, they can share lower layers.

Shared systems may include:

```txt
compiler detection
cache
diagnostics
process execution
argument forwarding
style/output
runtime crash handling
```

But the input model remains different.

## Native vix.app and project mode

When `vix.app` gets a native build path, project mode should still look the same to the user.

Current:

```txt
vix.app -> generated CMake -> build -> run
```

Future:

```txt
vix.app -> BuildGraph -> ObjectCache -> Scheduler -> Link -> run
```

The command stays:

```bash
vix run
```

The implementation changes underneath.

## Why this design matters

The strength of `vix run` is that it can cover several workflows with one command.

But that only works if the internal modes are clear.

Script mode should optimize for immediacy.

Project mode should optimize for correctness and project structure.

`vix.app` makes project mode easier for simple projects.

CMake keeps project mode powerful for complex projects.

## Summary

`vix run` has two main modes:

```txt
script mode:
  vix run main.cpp

project mode:
  vix run
```

Script mode treats a source file as the entry point.

Project mode resolves a CMake or `vix.app` project.

For `vix.app`, the manifest defines the target name.

For CMake, CMake remains the compatibility path.

The clean boundary is:

```txt
explicit source file -> script mode
project root         -> project mode
```

That boundary keeps `vix run` simple from the outside and precise inside.
