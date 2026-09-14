---
title: vix Direct Script Runner
description: How Vix can run a single C++ file without requiring a full project, when direct execution is enough, and when script mode should fall back to generated build infrastructure.
date: 2026-05-17
---

# vix Direct Script Runner

The direct script runner is the simplest execution path in `vix run`.

It exists for one use case:

```txt
I have one C++ file.
Compile it.
Run it.
```

Example:

```bash
vix run main.cpp
```

This should not require a `CMakeLists.txt`.

It should not require a `vix.app`.

It should not require a project layout.

The file itself is the entry point.

## Why direct script mode exists

C++ is often treated as a language that needs a project before it can run.

For large systems, that is reasonable.

But for small experiments, examples, learning, tests, and local tools, requiring a full project is unnecessary friction.

A developer should be able to write:

```cpp
#include <vix.hpp>

int main()
{
  vix::print("hello");
  return 0;
}
```

and run:

```bash
vix run main.cpp
```

The direct script runner makes that possible.

## The basic flow

For a simple file, the flow is:

```txt
source file
  -> compile
  -> link
  -> execute
```

Conceptually:

```txt
main.cpp
  -> main.o
  -> main
  -> run ./main
```

The exact output path is an implementation detail.

The user-facing behavior should remain simple:

```bash
vix run main.cpp
```

## Script mode is not project mode

Direct script mode is different from project mode.

Script mode input:

```txt
one source file
```

Project mode input:

```txt
project root
CMakeLists.txt or vix.app
target name
build directory
```

So this:

```bash
vix run main.cpp
```

should not behave the same as:

```bash
vix run
```

inside a project.

An explicit source file means script mode.

No source file means project mode.

## Minimal example

`main.cpp`:

```cpp
#include <vix.hpp>

int main()
{
  vix::print("hello from Vix script mode");
  return 0;
}
```

Run:

```bash
vix run main.cpp
```

Expected output:

```txt
hello from Vix script mode
```

The developer does not need to create:

```txt
CMakeLists.txt
vix.app
build-ninja/
```

manually.

## What the runner needs to know

Even for one file, Vix still needs build information.

The direct script runner must decide:

```txt
which compiler to use
which C++ standard to use
which include paths to use
which libraries to link
where to place outputs
how to pass runtime arguments
how to report compile errors
```

The command is simple, but the execution still needs structure.

## Compiler selection

The runner needs a compiler.

Possible sources:

```txt
environment variables
Vix defaults
detected system compiler
configured toolchain
target triple
```

Common compiler candidates:

```txt
c++
g++
clang++
cl
```

The selected compiler becomes part of the script build identity.

If the compiler changes, cached outputs may no longer be valid.

## Default standard

Script mode should have a reasonable default C++ standard.

For Vix, a good default is:

```txt
c++20
```

The user should be able to override this if needed.

Example idea:

```bash
vix run main.cpp --std c++23
```

The exact CLI flag can evolve, but the model is clear:

```txt
script mode has defaults
advanced users can override them
```

## Output location

The direct script runner should avoid polluting the current directory.

Instead of producing:

```txt
main
main.o
main.d
```

next to `main.cpp`, Vix can place outputs in an internal build or cache directory.

Possible layout:

```txt
.vix/run/
.vix/cache/run/
build-script/
```

The exact path is less important than the rule:

```txt
script outputs should be managed by Vix
```

## Script identity

A script build needs an identity.

For:

```bash
vix run main.cpp
```

the identity can include:

```txt
source path
source content
compiler identity
compiler flags
C++ standard
include paths
linked libraries
target triple
runtime mode
```

This identity lets Vix decide whether it can reuse a previous script build.

## Reusing script builds

If nothing changed, Vix should avoid recompiling the script.

A no-op script run can be:

```txt
source unchanged
compiler unchanged
flags unchanged
binary exists
run existing binary
```

This makes repeated `vix run main.cpp` calls fast.

But reuse must be conservative.

If Vix is unsure, it should rebuild.

## Dependency files

Even a single source file can include headers.

Example:

```cpp
#include "message.hpp"
```

If `message.hpp` changes, the script should rebuild.

That means the compile command should ideally emit a dependency file.

Conceptual command:

```bash
c++ -std=c++20 -MMD -MP -MF main.d -c main.cpp -o main.o
```

The dependency file tells Vix which headers affect the script binary.

## Local headers

Example layout:

```txt
scratch/
  main.cpp
  message.hpp
```

`main.cpp`:

```cpp
#include <vix.hpp>
#include "message.hpp"

int main()
{
  vix::print(message());
  return 0;
}
```

If `message.hpp` changes, `vix run main.cpp` should rebuild.

That is why dependency tracking matters even in script mode.

## Include paths

For script mode, Vix may include the source file directory by default.

If `main.cpp` is in:

```txt
scratch/main.cpp
```

then local includes from:

```txt
scratch/
```

should work naturally.

Additional include paths may be provided through flags later.

Example design:

```bash
vix run main.cpp --include include
```

or through CMake fallback when the case becomes complex.

## Linking Vix

Many Vix examples use:

```cpp
#include <vix.hpp>
```

Some Vix APIs may be header-only.

Others may require linking compiled Vix modules.

The direct script runner needs to know how to link the required Vix components.

For simple APIs such as printing, direct compilation may be enough.

For compiled modules, the runner may need a fallback build path.

## Header-only path

If the script only uses header-only functionality, direct mode is straightforward.

Example:

```cpp
#include <vix.hpp>

int main()
{
  vix::print("hello");
  return 0;
}
```

The runner can compile and link directly.

This is the ideal fast path.

## Compiled module path

Some modules may require linking.

Examples may include:

```txt
kv
http
crypto
threadpool
networking modules
```

If the script uses a compiled module, direct mode may not have enough information to link safely.

In that case, Vix can use a fallback.

## Why fallback is needed

Direct compilation is fast because it is simple.

But it cannot handle every dependency case.

A script may need:

```txt
compiled Vix modules
registry packages
external libraries
package discovery
complex link flags
platform-specific setup
```

Trying to force all of that into direct mode would make direct mode complex and fragile.

The better design is layered:

```txt
direct mode for simple scripts
fallback mode for complex scripts
```

## CMake fallback for scripts

When direct mode is not enough, Vix can generate a temporary CMake project for the script.

Flow:

```txt
main.cpp
  -> generated script CMake project
  -> CMake configure
  -> CMake build
  -> run executable
```

This keeps the user command the same:

```bash
vix run main.cpp
```

but gives Vix more build power internally.

## Direct mode vs fallback mode

The decision can look like:

```txt
if script can be compiled directly:
  use direct runner
else:
  use generated CMake fallback
```

Direct runner:

```txt
fast
simple
minimal overhead
```

CMake fallback:

```txt
more compatible
handles complex linking
supports compiled modules
```

## When direct mode should be used

Direct mode is best when:

```txt
single source file
simple local headers
no complex packages
no generated sources
no complex external linking
known Vix headers or simple modules
```

This covers many learning and experimentation cases.

## When fallback should be used

Fallback is better when the script needs:

```txt
compiled Vix modules
registry dependencies
external CMake packages
complex link options
generated build metadata
platform-specific dependency setup
```

The user should not need to choose manually in most cases.

Vix can try direct mode first, then fallback when necessary.

## Runtime arguments

The direct script runner must separate Vix flags from program arguments.

Example:

```bash
vix run main.cpp --run --name Gaspard
```

The arguments after the runtime boundary should be passed to the program:

```txt
--name Gaspard
```

Another common model is:

```bash
vix run main.cpp -- --name Gaspard
```

The important rule is:

```txt
Vix arguments configure Vix.
Runtime arguments go to the script executable.
```

## Why argument boundaries matter

A C++ program may use flags like:

```txt
--port
--config
--verbose
--help
```

Vix also has flags.

Without a clear boundary, Vix may consume flags meant for the program.

The direct script runner must keep this separation predictable.

## Process execution

After compilation, Vix runs the executable as a child process.

The runner should preserve:

```txt
stdin
stdout
stderr
exit code
signals when possible
```

A program run through Vix should feel like running the binary directly.

If the program exits with code `1`, Vix should report that as the program exit code, not necessarily as a Vix crash.

## Non-zero exits

A non-zero exit from the user program is not the same as a build failure.

Example:

```cpp
int main()
{
  return 1;
}
```

The build succeeded.

The program returned `1`.

`vix run` should distinguish:

```txt
compile failure
link failure
runtime exit code
runtime crash
```

This distinction makes diagnostics clearer.

## Interactive programs

Some programs read from standard input.

Example:

```cpp
#include <vix.hpp>

int main()
{
  auto name = vix::input("Name: ");
  vix::print("Hello", name);
  return 0;
}
```

The direct script runner should allow interactive input.

That means process execution should not always fully capture stdin in a way that breaks interaction.

## Output handling

For normal script runs, stdout and stderr should pass through naturally.

For errors, Vix can still format diagnostics.

Good behavior:

```txt
compiler errors are formatted
program output is preserved
runtime exit is reported clearly
```

The user program should not feel trapped behind the tool.

## Compile diagnostics

If compilation fails, Vix should show a useful diagnostic.

Example:

```cpp
int main()
{
  unknown_symbol();
}
```

The error should point to:

```txt
main.cpp
```

not to an internal generated file.

Direct mode gives Vix a clearer path to source-level diagnostics.

## Link diagnostics

If linking fails, Vix should explain the link error.

Common causes:

```txt
missing library
missing symbol
compiled module not linked
wrong dependency
```

If the error suggests direct mode is insufficient, Vix can fallback when possible or show a hint.

## Runtime diagnostics

Runtime failures are different from build failures.

Examples:

```txt
program exited with code 1
program crashed
program timed out
permission denied
executable not found
```

These should be reported as runtime errors.

The build may still have been successful.

## Script cache

The direct runner can use a script cache.

A cache entry can contain:

```txt
binary path
object file
dependency file
source hash
command hash
compiler identity
last run metadata
```

On the next run, Vix can decide whether to reuse the binary.

## Object cache in script mode

The direct script runner can also use the normal ObjectCache.

For a single source file:

```txt
main.cpp -> main.o
```

If the object cache has a valid object, Vix can restore it.

Then it only needs to link or reuse the existing binary.

## Artifact cache in script mode

For a complete script binary, Vix can use a small artifact cache.

If all inputs match, Vix can reuse:

```txt
compiled executable
```

This makes repeated script runs very fast.

But the same correctness rule applies:

```txt
reuse only when the full identity matches
```

## Watch mode

Script mode can support watch mode.

Example:

```bash
vix run main.cpp --watch
```

In watch mode, Vix should rebuild and rerun when inputs change.

Inputs include:

```txt
main.cpp
local headers from dependency file
possibly runtime resources
```

Dependency files make watch mode more accurate.

## Watch mode flow

A simple watch loop:

```txt
build and run once
watch source and dependency files
on change:
  stop previous process if needed
  rebuild
  rerun
```

This is useful for small tools and examples.

## Working directory

The working directory matters for relative file access.

In script mode, a reasonable default is:

```txt
current working directory
```

If the user runs:

```bash
vix run examples/hello.cpp
```

from the project root, the program may expect relative files from that root.

This should be documented and consistent.

## Environment variables

The script runner should pass environment variables to the child process.

For build behavior, Vix may also read variables such as:

```txt
CXX
VIX_LOG_LEVEL
```

Runtime environment and build environment should be treated carefully.

## Temporary files

Direct mode may create temporary files.

These can include:

```txt
object files
dependency files
binaries
logs
metadata
```

They should live in a Vix-managed directory.

The user should not need to clean them manually in normal use.

## Cleanup

Vix can keep script outputs for cache reuse.

It should also provide ways to clean them.

Example concepts:

```txt
vix clean
vix cache clean
vix run --clean
```

The exact command can evolve.

The important idea is that cache should be useful but manageable.

## Relationship with vix build

`vix run main.cpp` is not the same as `vix build`.

But it still uses build concepts:

```txt
compiler detection
compile task
link task
cache
diagnostics
process execution
```

The difference is input shape.

`vix build` builds a project target.

`vix run main.cpp` builds and runs one source file.

## Relationship with vix.app

`vix.app` is for project mode.

Direct script mode does not need it.

However, both systems can share future build infrastructure:

```txt
BuildGraph
ObjectCache
Scheduler
Link
Diagnostics
```

So the architecture can converge underneath while keeping user workflows separate.

## Future native script graph

The direct script runner can eventually be modeled as a tiny BuildGraph.

For:

```bash
vix run main.cpp
```

the graph is:

```txt
Node: main.cpp
Node: main.o
Node: main executable

Task: compile main.cpp -> main.o
Task: link main.o -> executable
Task: run executable
```

This makes script mode part of the same build architecture as native `vix.app`.

## Fallback graph

When fallback is needed, Vix can generate a temporary project and use the CMake compatibility path.

That fallback can still produce graph data:

```txt
compile_commands.json
build.ninja
dependency files
```

So even fallback mode can participate in cache and diagnostics.

## Common errors

### Source file not found

Command:

```bash
vix run main.cpp
```

but `main.cpp` does not exist.

Vix should report:

```txt
source file not found: main.cpp
```

### Compile error

The file exists, but the compiler fails.

Vix should show the compiler diagnostic.

### Link error

The file compiles, but linking fails.

Vix should report the linker error and possibly suggest missing links or fallback.

### Runtime exit

The program exits with non-zero status.

Vix should report the program exit code.

This is different from compile or link failure.

## Common design mistakes

### Treating script mode as project mode

Wrong:

```txt
vix run main.cpp requires vix.app
```

Correct:

```txt
explicit source file uses script mode
```

### Polluting the source directory

Wrong:

```txt
main.o appears next to main.cpp
```

Correct:

```txt
Vix stores outputs in a managed directory
```

### Ignoring runtime arguments

Wrong:

```txt
Vix consumes all flags
```

Correct:

```txt
program arguments pass through after a clear boundary
```

### Rebuilding every time

Wrong:

```txt
compile on every run even when nothing changed
```

Correct:

```txt
reuse binary/object when inputs are unchanged
```

## A practical first implementation

A practical direct script runner should support:

```txt
single .cpp file
default C++ standard
local includes
Vix include path
managed output directory
compile diagnostics
link diagnostics
runtime argument forwarding
interactive stdin
exit code preservation
simple cache reuse
fallback when direct mode is insufficient
```

This is enough to create a strong first experience.

## Later improvements

Later improvements can include:

```txt
object cache integration
artifact cache integration
dependency-file-based watch mode
compiled module auto-linking
registry dependency support
native BuildGraph execution
explainable rebuilds
better runtime working directory controls
```

The runner can grow in layers.

## Engineering principle

The direct script runner should follow this principle:

```txt
make the simple case immediate
fallback for complexity
```

Do not make every script pay the cost of a full project.

Do not make complex scripts fail when a fallback path can handle them.

This keeps script mode fast and practical.

## Conclusion

The direct script runner gives C++ a lightweight execution path inside Vix.

It lets a developer run:

```bash
vix run main.cpp
```

without writing a project first.

The runner should compile, link, execute, preserve runtime behavior, and reuse outputs when safe.

For complex cases, it can fall back to generated build infrastructure.

The long-term direction is to make script mode part of the same native build architecture as `vix.app`:

```txt
source file
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
  -> Run
```

That keeps the simple path simple while giving Vix room to become faster and more capable underneath.
