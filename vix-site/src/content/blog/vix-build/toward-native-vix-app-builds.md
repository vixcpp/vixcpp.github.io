---
title: Toward Native vix.app Builds
description: Why vix.app can become the native fast path for Vix builds, how it can bypass CMake for simple projects, and what a BuildGraph-first execution model would look like.
date: 2026-05-17
---

# Toward Native vix.app Builds

`vix.app` starts with generated CMake.
That is the safe compatibility path.
But the long-term direction is more important:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

This is where `vix.app` becomes more than a simpler configuration file.
It becomes structured build input that Vix can understand directly.

## The current path

Today, a `vix.app` project follows this model:

```txt
vix.app
  -> parse manifest
  -> validate manifest
  -> generate .vix/generated/app/CMakeLists.txt
  -> CMake configure
  -> CMake build
```

This is practical.
It gives users a simple manifest while keeping compatibility with the C++ build ecosystem.
The generated CMake path means Vix can support `vix.app` without rewriting the entire build engine first.

## Why generated CMake is a good first step

Generated CMake gives Vix three things immediately:

```txt
compatibility
stability
incremental adoption
```

CMake already knows how to handle:

```txt
compilers
toolchains
generators
packages
linking
Ninja
platform differences
```

So Vix can focus on the user-facing experience first.
A user writes:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Then runs:

```bash
vix build
vix run
```

Internally, Vix can still use CMake.
That is the bridge.

## Why generated CMake is not the final path

Generated CMake still has overhead.
Even for a simple project, the pipeline can include:

```txt
manifest parsing
CMake generation
CMake configure
CMake generate
Ninja build files
CMake build invocation
Ninja execution
```

For complex projects, this overhead is acceptable.
For simple projects, Vix can eventually do better.
A `vix.app` manifest already gives Vix the important build information directly:

```txt
target name
target type
C++ standard
sources
include directories
defines
compile options
link options
packages
links
resources
output directory
```

That is enough to create a build graph for many projects.

## The future path

The future native path is:

```txt
vix.app
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

In this model, Vix does not generate CMake as the primary execution path.
Instead, it creates the build graph directly from the manifest.

For a simple app:

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

Vix can create:

```txt
compile src/main.cpp -> main.o
compile src/app.cpp  -> app.o
link main.o app.o    -> myapp
```

No CMake configure step is needed for that simple case.

## Why vix.app makes this possible

Arbitrary CMake is hard to interpret because CMake is a full language.

It has:

```txt
functions
macros
conditions
generator expressions
custom commands
platform branches
dynamic targets
FetchContent
toolchain logic
```

Vix should not try to understand all arbitrary CMake logic.
CMake should remain the compatibility path for that.
But `vix.app` is different.
It is narrow and declarative.
It has no arbitrary control flow.
It describes one target.
That makes it possible for Vix to translate it directly into native build tasks.

## Compatibility path vs native path

The clean architecture is:

```txt
CMakeLists.txt -> compatibility path
vix.app        -> native fast path
```

This does not mean removing CMake.
It means Vix should use the best path for each project type.
For complex projects:

```txt
use CMake
```

For simple `vix.app` projects:

```txt
use native BuildGraph
```

This gives Vix a realistic path to faster builds without breaking existing C++ workflows.

## The first native build target

The first native `vix.app` build should support a small, clear subset.
Minimum useful support:

```txt
executable
static library
shared library
sources
include_dirs
defines
compile_options
link_options
links
resources
output_dir
```

That is enough to build many simple projects.
The native path does not need to support every CMake feature on day one.

## What should remain CMake-only

Some features should stay in the CMake compatibility path.

Examples:

```txt
custom commands
generated sources
install rules
CTest
FetchContent
CPM.cmake
complex package discovery
custom toolchains
platform-specific build branches
many targets in one project
package export generation
```

Trying to support all of these immediately would turn the native builder into a second CMake.
That would be the wrong direction.

## Native build should be explicit

The native path should not rely on hidden magic.
If the manifest says:

```ini
sources = [
  src/main.cpp,
  src/app.cpp,
]
```

then Vix creates compile tasks for those files.
If the manifest says:

```ini
include_dirs = [
  include,
]
```

then those include directories are part of the compile command.
If the manifest says:

```ini
links = [
  m,
]
```

then those link inputs are part of the link task.
The manifest should map clearly to build tasks.

## BuildGraph generation

The first step is to convert `vix.app` into a `BuildGraph`.

For this manifest:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Vix can create:

```txt
Node: src/main.cpp
Node: build/native/objects/src/main.o
Node: build/native/bin/hello

Task: compile src/main.cpp -> main.o
Task: link main.o -> hello
```

The graph becomes the source of execution.

## Compile task generation

For each source file, Vix creates a compile task.
A compile task needs:

```txt
compiler
source path
object output path
include directories
defines
C++ standard
compile options
target triple
build type
dependency file path
```

Example conceptual command:

```bash
c++ -std=c++20 -Iinclude -MMD -MP -MF main.d -c src/main.cpp -o main.o
```

The exact command depends on compiler and platform.

## Object output paths

The native build path should use deterministic object paths.

Example:

```txt
build-ninja/.vix/native/objects/src/main.cpp.o
build-ninja/.vix/native/objects/src/app.cpp.o
```

or:

```txt
build-ninja/objects/src/main.o
build-ninja/objects/src/app.o
```

The important properties are:

```txt
stable
unique
safe for nested paths
safe for files with same basename
```

For example:

```txt
src/main.cpp
tools/main.cpp
```

must not collide.

## Dependency files

The native compile command should emit dependency files.

Example:

```txt
main.o: src/main.cpp include/app.hpp include/config.hpp
```

These dependency files are required for correct incremental builds.
Without them, Vix cannot know which headers affect which object files.
The native path should treat dependency files as first-class build metadata.

## Dirty checking

Before running a compile task, Vix should decide whether it is dirty.
Inputs include:

```txt
source file content
dependency headers
compiler identity
compile command hash
object output existence
dependency file existence
build configuration
```

If the task is clean, skip it.
If the object cache has a valid entry, restore it.
Otherwise, run the compiler.

## ObjectCache integration

Native `vix.app` builds should use ObjectCache directly.
For each compile task:

```txt
compute compile identity
check object cache
restore object on hit
compile on miss
store object after successful compile
```

This is one of the main reasons native builds can be faster.
The object cache becomes part of the build execution path, not an external accident.

## Scheduler integration

After Vix creates compile tasks and link tasks, it can schedule them.

Example:

```txt
compile main.cpp
compile app.cpp
compile server.cpp
link myapp
```

The compile tasks can run in parallel.
The link task waits for object files.
This is the same basic model as Ninja, but controlled by Vix for the manifest subset it understands.

## Link task generation

For an executable target, Vix creates a link task.

Inputs:

```txt
object files
libraries
link options
package link targets or library names
```

Output:

```txt
executable
```

For a static library target, Vix creates an archive task.
For a shared library target, Vix creates a shared link task.

## Static library native build

For:

```ini
name = mathlib
type = static
standard = c++20

sources = [
  src/add.cpp,
  src/mul.cpp,
]
```

Vix can create:

```txt
compile src/add.cpp -> add.o
compile src/mul.cpp -> mul.o
archive add.o mul.o -> libmathlib.a
```

This is a clean native build case.

## Shared library native build

For:

```ini
name = plugin
type = shared
standard = c++20

sources = [
  src/plugin.cpp,
]
```

Vix can create:

```txt
compile src/plugin.cpp -> plugin.o
link shared plugin.o -> libplugin.so
```

Platform differences matter here.

On Linux, the output may be:

```txt
libplugin.so
```

On macOS:

```txt
libplugin.dylib
```

On Windows:

```txt
plugin.dll
```

The native path needs a platform layer.

## Resource tasks

Resources should become copy tasks.

For:

```ini
resources = [
  assets,
  "data/config.json=config/config.json",
]
```

Vix can create:

```txt
copy assets -> target_dir/assets
copy data/config.json -> target_dir/config/config.json
```

Resource changes should not trigger C++ recompilation.
They should only trigger resource copy tasks.
That separation is important.

## output_dir in native builds

The `output_dir` field should work the same in native mode as in generated CMake mode.

Example:

```ini
output_dir = bin
```

means the target output goes under:

```txt
build-ninja/bin/
```

For an executable:

```txt
build-ninja/bin/myapp
```

Resources are copied next to that target.

## Packages in native builds

Packages are the hardest part of native `vix.app` builds.

In generated CMake mode:

```ini
packages = [
  fmt:REQUIRED,
]
```

maps to:

```cmake
find_package(fmt REQUIRED)
```

In native mode, Vix needs a package resolution layer.
That layer may initially be limited.

Possible first approach:

```txt
native mode supports simple system links
CMake fallback handles find_package packages
```

This is acceptable for an experimental native builder.

## A practical first native mode

A practical first native mode can support:

```txt
sources
include_dirs
defines
compile_options
link_options
simple links
resources
output_dir
executable/static/shared
```

And fallback to CMake when it sees:

```txt
packages
complex links
unsupported platform
unsupported compiler
```

This keeps the native path safe.

## Native fallback rule

The native builder should have a clear fallback rule:

```txt
If the manifest uses unsupported features, use generated CMake.
```

Example:

```ini
packages = [
  "Boost:COMPONENTS=system,filesystem:REQUIRED",
]
```

If native package resolution is not ready, Vix should not fail unnecessarily.
It can fall back to generated CMake.
This preserves compatibility.

## Experimental flag

The native path should probably start behind a flag.

Examples:

```bash
vix build --native
```

or:

```bash
VIX_APP_NATIVE_BUILD=1 vix build
```

This allows testing without breaking the stable build path.
The default path can remain generated CMake until native builds are reliable.

## Making native mode default

Native mode should become default only when it is reliable for common projects.
A safe progression:

```txt
1. generated CMake default
2. native mode experimental
3. native mode for minimal projects
4. native mode for common projects
5. generated CMake becomes fallback
```

This avoids destabilizing `vix build`.

## Build correctness

Native builds must be correct before they are fast.
Important correctness requirements:

```txt
source changes rebuild the right object
header changes rebuild dependent objects
flag changes invalidate objects
define changes invalidate objects
compiler changes invalidate objects
link input changes relink target
resource changes copy resources
```

If any of these are wrong, the build system cannot be trusted.

## Compiler detection

The native builder needs to know which compiler to use.
Possible sources:

```txt
environment variables
Vix defaults
CMake-style settings
toolchain config
target triple
platform defaults
```

Examples:

```txt
CXX
c++
g++
clang++
cl
```

The compiler identity must become part of cache keys.

## Platform layer

Native builds need a platform layer for:

```txt
executable suffix
object file suffix
static library prefix and suffix
shared library prefix and suffix
compiler flags
linker flags
archive tool
runtime library paths
```

This cannot be hardcoded only for Linux if Vix wants to be portable.
A first version can target Linux and expand later.

## Archive tool

For static libraries, native mode needs an archiver.
Common tool:

```txt
ar
```

Conceptual command:

```bash
ar rcs libmathlib.a add.o mul.o
```

On Windows, this may be different.
So archive tasks should go through a toolchain abstraction.

## Linker selection

Vix can prefer fast linkers when available.
Examples:

```txt
mold
lld
```

In native mode, linker selection can be more direct.
The build plan can decide:

```txt
compiler driver
linker flag
link options
output path
```

But it still must respect platform and compiler differences.

## Relationship with CMake compatibility

Native mode should not remove the CMake path.
The relationship should be:

```txt
native path:
  faster for supported vix.app projects

generated CMake path:
  fallback for unsupported vix.app features

CMakeLists.txt path:
  full compatibility for advanced projects
```

This gives users both speed and safety.

## Relationship with vix run

`vix run` should not care whether the project was built through CMake or native mode.

It should ask:

```txt
what is the target name?
where is the build output?
where is the executable?
```

If native mode preserves the same output layout, `vix run` can work unchanged or with minimal changes.

## Relationship with diagnostics

Native mode gives Vix more control over diagnostics.
Instead of receiving errors only through CMake/Ninja output, Vix can know:

```txt
which task failed
which source file was compiling
which command was run
which dependency triggered the task
which cache key missed
```

This can make errors easier to explain.

## Explaining rebuilds

A native build engine can eventually answer:

```txt
why did this rebuild?
```

Examples:

```txt
src/app.cpp rebuilt because source changed
src/main.cpp rebuilt because include/config.hpp changed
myapp relinked because app.o changed
assets copied because assets/logo.png changed
```

This is a major advantage of owning the graph.

## No-op native builds

A native no-op build can be extremely fast.
If Vix knows:

```txt
manifest unchanged
graph unchanged
sources unchanged
headers unchanged
objects valid
target valid
resources copied
```

then it can skip everything.
The best output is:

```txt
nothing to build
```

or a very fast success message.

## Clean build with warm cache

Native mode plus cache can make clean builds much faster.
If the build directory is removed:

```bash
rm -rf build-ninja
```

but the object cache is warm, Vix can restore objects.
Flow:

```txt
restore main.o
restore app.o
link myapp
copy resources
```

If artifact cache also has the final target, Vix may restore the final binary too.

## Artifact cache in native mode

Before executing the graph, Vix can check artifact cache.
If the final target artifact is valid:

```txt
restore target
restore resources if needed
skip compile
skip link
```

If not, continue to object cache and task execution.
This creates a layered cache model:

```txt
artifact cache
object cache
compiler
linker
```

## Native mode and BuildGraph persistence

The native BuildGraph can be saved between builds.
Stored state can include:

```txt
nodes
tasks
command hashes
dependency files
source metadata
output metadata
cache keys
last successful target
```

On the next build, Vix can reload this state and update only what changed.
This makes repeated builds faster.

## Native mode and generated CMake side by side

During the transition, Vix can keep both systems.

For example:

```txt
.vix/generated/app/CMakeLists.txt
.vix/native/graph.json
```

Generated CMake remains useful for:

```txt
debugging
fallback
comparison
compatibility
```

Native graph becomes useful for:

```txt
speed
caching
diagnostics
direct execution
```

## Testing native builds

Native builds need strong tests.

Test cases should include:

```txt
minimal executable
multiple source files
static library
shared library
include directories
defines
compile options
link options
resources
output_dir
source change
header change
resource change
clean build
cache hit
cache miss
fallback to CMake
```

A build system needs test coverage because small mistakes can produce incorrect binaries.

## First milestone

A good first milestone:

```txt
vix build --native
```

for a minimal executable:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Expected behavior:

```txt
create compile task
compile main.cpp
link hello
run with vix run
skip on no-op rebuild
```

This proves the core pipeline.

## Second milestone

Support multiple source files and includes:

```ini
sources = [
  src/main.cpp,
  src/app.cpp,
]

include_dirs = [
  include,
]
```

Expected behavior:

```txt
compile each source
track headers
recompile only dirty source
link when needed
```

This proves incremental behavior.

## Third milestone

Support resources and output directory:

```ini
output_dir = bin

resources = [
  assets,
]
```

Expected behavior:

```txt
build-ninja/bin/myapp
build-ninja/bin/assets/
```

This proves runtime app support.

## Fourth milestone

Support static libraries:

```ini
name = mathlib
type = static
```

Expected behavior:

```txt
compile sources
archive libmathlib.a
skip archive when unchanged
```

This proves non-executable target support.

## Fifth milestone

Support object cache:

```txt
compile once
clean build directory
restore objects from cache
link target
```

This proves the build can become faster than normal clean rebuilds.

## Why not do everything at once

A native build system touches many areas:

```txt
compiler abstraction
dependency tracking
object paths
linking
archiving
platforms
cache
scheduler
diagnostics
resources
fallback
```

Trying to do everything at once is risky.
The correct approach is layered.
Each milestone should produce a working build.

## Engineering principle

The principle should be:

```txt
native where Vix can be correct
fallback where CMake is safer
```

This keeps the user experience stable.
It also allows Vix to grow without breaking existing workflows.

## What success looks like

For a supported `vix.app` project, success looks like this:

```txt
first build:
  compile sources
  link target
  store cache

second build:
  no work

one source changed:
  compile one file
  relink

header changed:
  compile affected files
  relink

clean build with warm cache:
  restore objects
  relink or restore artifact
```

That is the build experience Vix should aim for.

## The final architecture

The long-term architecture can be:

```txt
ProjectResolver
  -> AppManifest
  -> BuildPlan
  -> NativeBuildGraph
  -> ObjectCache
  -> ArtifactCache
  -> Scheduler
  -> Linker
```

With fallback:

```txt
if unsupported:
  generate CMake
  use CMake compatibility path
```

For CMake projects:

```txt
CMakeLists.txt
  -> CMake compatibility path
  -> graph import
  -> cache analysis
```

For `vix.app` projects:

```txt
vix.app
  -> native path
  -> CMake fallback when needed
```

## Conclusion

Native `vix.app` builds are the natural next step for Vix.
Generated CMake makes `vix.app` usable today.
Native BuildGraph execution can make it faster tomorrow.
The key is not to remove CMake.
The key is to use CMake where it is strongest and use Vix’s own graph where the project is simple enough to understand directly.
That gives Vix a realistic and powerful direction:

```txt
CMakeLists.txt -> compatibility
vix.app        -> native fast path
```

The user keeps one command:

```bash
vix build
```

But Vix gains the freedom to choose the best execution engine underneath.
