---
title: vix build Graph Design
description: How Vix models build work as nodes, tasks, dependencies, and target-aware execution for faster and more predictable C++ builds.
date: 2026-05-17
---

# vix build Graph Design

`vix build` is not only a command that runs CMake.

The deeper direction is to understand the build as a graph.

A build graph lets Vix reason about:

```txt
files
objects
libraries
executables
compile tasks
link tasks
copy tasks
dependencies
dirty state
cache hits
target selection
```

This matters because a fast build system should not ask only:

```txt
How do I build everything?
```

It should ask:

```txt
What exactly changed?
What depends on it?
Which tasks are dirty?
Which outputs can be restored from cache?
Which target did the user ask for?
What can be skipped safely?
```

That is the purpose of the Vix build graph.

## Why a build graph exists

A C++ build is naturally a graph.

A source file produces an object file.

An object file contributes to a library or executable.

A header can affect many object files.

A generated file can affect another build step.

A resource copy can depend on a runtime asset.

Conceptually:

```txt
src/main.cpp
  -> main.o
  -> app

include/app.hpp
  -> main.o
  -> app

assets/config.json
  -> copy resource
```

If Vix can model this, it can make better decisions.

## The simple model

A build graph has two main concepts:

```txt
nodes
tasks
```

Nodes represent things.

Tasks represent work.

Example:

```txt
Node: src/main.cpp
Node: build/main.o
Node: build/myapp

Task: compile src/main.cpp -> build/main.o
Task: link build/main.o -> build/myapp
```

The graph connects inputs, tasks, and outputs.

## Build nodes

A build node represents an input or output in the build system.

Examples:

```txt
source file
header file
config file
package
object file
static library
shared library
executable
```

A node can have a state:

```txt
clean
dirty
missing
```

This state helps Vix decide whether a task needs to run.

## Source nodes

A source node represents a file that is compiled.

Example:

```txt
src/main.cpp
src/app.cpp
src/server.cpp
```

These files usually become object files.

If a source file changes, the compile task that depends on it becomes dirty.

## Header nodes

A header node represents an included header.

Example:

```txt
include/myapp/app.hpp
include/myapp/config.hpp
```

Headers are important because they can affect many source files.

If `include/myapp/config.hpp` changes, several object files may need to rebuild.

That is why dependency files matter.

## Object nodes

An object node represents a compiled output.

Example:

```txt
build/CMakeFiles/myapp.dir/src/main.cpp.o
```

Object files are the main unit of incremental C++ builds.

If an object file is still valid, Vix should not recompile it.

If it is missing or stale, Vix should rebuild or restore it from cache.

## Library nodes

A library node represents an archive or shared object.

Examples:

```txt
libmathlib.a
libplugin.so
mathlib.lib
plugin.dll
```

Libraries depend on object files.

If the object files do not change, the library may not need to be rebuilt.

## Executable nodes

An executable node represents the final runnable binary.

Examples:

```txt
myapp
server
hello.exe
```

An executable depends on object files and linked libraries.

If none of those inputs changed, relinking can be skipped.

## Build tasks

A build task represents an action.

Common task kinds:

```txt
compile
link
archive
copy
generate
```

Each task has:

```txt
inputs
outputs
command
dependencies
state
```

The command matters because changing compiler flags can invalidate outputs even if the source file did not change.

## Compile tasks

A compile task turns a source file into an object file.

Conceptually:

```txt
compile src/main.cpp -> main.o
```

The task depends on:

```txt
source file
headers
compiler
compiler flags
include dirs
defines
C++ standard
target triple
```

If any of these change, the object is dirty.

## Link tasks

A link task turns object files and libraries into an executable or shared library.

Conceptually:

```txt
link main.o app.o -> myapp
```

The task depends on:

```txt
object files
libraries
linker flags
linker identity
target triple
```

If no link inputs changed, Vix should avoid relinking.

## Archive tasks

An archive task creates a static library.

Conceptually:

```txt
archive add.o mul.o -> libmathlib.a
```

This is common for `type = static` projects.

## Copy tasks

A copy task moves files or directories.

For `vix.app`, resources become copy tasks.

Example:

```ini
resources = [
  assets,
  "data/config.json=config/config.json",
]
```

Conceptually:

```txt
copy assets -> $<TARGET_FILE_DIR>/assets
copy data/config.json -> $<TARGET_FILE_DIR>/config/config.json
```

Copy tasks should run only when needed.

## Generate tasks

A generate task creates files used later in the build.

Examples:

```txt
generated source files
generated headers
generated config files
generated CMake files
```

For `vix.app`, generating:

```txt
.vix/generated/app/CMakeLists.txt
```

is a generation step.

In the future, Vix may use generate tasks for its own native build graph.

## Importing the graph from CMake

Today, CMake remains the compatibility path.

That means Vix can learn the build graph from files generated by CMake and Ninja.

Important files:

```txt
compile_commands.json
build.ninja
*.d dependency files
```

These files give Vix real build information.

Vix should not guess compiler commands if CMake already generated them.

## compile_commands.json

`compile_commands.json` contains exact compile commands.

A typical entry describes:

```txt
working directory
source file
compiler command
compiler arguments
object output
```

This is useful because the object cache needs exact compiler inputs.

A cache key based on guesses would be unsafe.

A cache key based on actual compile commands is stronger.

## build.ninja

`build.ninja` contains the generated Ninja build rules.

Vix can parse it to find build edges.

Edges can be classified as:

```txt
Compile
Archive
Link
Copy
Install
Utility
Unknown
```

This gives Vix a lower-level view of what the build system will do.

## Dependency files

C++ compilers can emit dependency files.

Example:

```txt
main.o: src/main.cpp include/app.hpp include/config.hpp
```

This tells Vix which headers affect an object file.

Without dependency files, Vix would not know that changing a header should rebuild specific object files.

Dependency files are essential for correct incremental builds.

## Dirty state

Dirty state tells Vix whether a node or task must be rebuilt.

A node may be dirty when:

```txt
the file changed
the file is missing
a dependency changed
the command changed
the build fingerprint changed
the compiler changed
the target triple changed
```

A task is dirty when any of its important inputs are dirty or invalid.

## Clean state

A node is clean when its output is valid.

Example:

```txt
main.o is clean
```

means:

```txt
source is unchanged
headers are unchanged
compiler command is unchanged
output exists
cache metadata is valid
```

Clean nodes can be skipped.

## Missing state

A node is missing when the expected output does not exist.

Example:

```txt
build/main.o
```

does not exist.

Then the compile task must run or restore the object from cache.

## Command hash

The command hash is part of correctness.

If this command changes:

```bash
g++ -std=c++20 -Iinclude -c src/main.cpp -o main.o
```

to this:

```bash
g++ -std=c++23 -Iinclude -DMYAPP_DEBUG=1 -c src/main.cpp -o main.o
```

the output object is no longer equivalent.

Even if the source file is unchanged, the object should be rebuilt.

So tasks need command fingerprints.

## File metadata vs content hashing

A build system can use:

```txt
file timestamps
file sizes
content hashes
```

Timestamps are fast but can be less reliable.

Content hashes are more reliable but more expensive.

A practical system can combine both:

```txt
use metadata for quick checks
use hashes for cache keys and correctness-critical decisions
```

Object cache and artifact cache should be conservative.

Correctness is more important than a false cache hit.

## Target-aware execution

A graph allows target-aware execution.

If the user asks for:

```bash
vix build --build-target server
```

Vix should select only the tasks required for:

```txt
server
```

The graph can compute the dependency closure:

```txt
server
  depends on server.o
  depends on router.o
  depends on libcore.a
```

Then unrelated tasks can be ignored.

## Dependency closure

The dependency closure of a target is the set of tasks and nodes needed to build it.

Example:

```txt
myapp
  main.o
  app.o
  config.o
```

If a project has other targets:

```txt
tests
benchmarks
examples
```

they do not need to be built unless the selected target depends on them.

This is important for large projects.

## Scheduler

Once Vix knows which tasks are needed, it can schedule them.

A scheduler runs tasks when their dependencies are ready.

Example:

```txt
compile main.cpp
compile app.cpp
compile server.cpp
link myapp
```

The compile tasks can run in parallel.

The link task must wait for the object files.

## Parallelism

Parallel builds matter in C++ because each source file can often compile independently.

If there are eight independent compile tasks, Vix can run several at once.

The job count controls this:

```bash
vix build -j 8
```

A good scheduler should respect dependencies and job limits.

## Object cache integration

The build graph makes object cache decisions more precise.

For each compile task, Vix can ask:

```txt
Is there a cached object for this exact input set?
```

The input set includes:

```txt
source content
header dependencies
compiler command
compiler identity
target triple
build type
```

If the cache has a valid object, Vix can restore it instead of compiling.

## Artifact cache integration

The artifact cache works at a larger level.

It can reuse:

```txt
compiled libraries
executables
package artifacts
whole target outputs
```

A graph helps decide whether a target artifact is still valid.

If all inputs and build settings match, Vix may restore or skip the entire target.

## No-op builds

The graph is especially useful for no-op builds.

A no-op build means:

```txt
nothing changed
nothing needs to run
```

The ideal result is:

```txt
skip configure
skip compile
skip link
finish almost immediately
```

This is one of the biggest opportunities for Vix.

## Incremental builds

An incremental build happens when only part of the project changed.

Example:

```txt
src/app.cpp changed
```

Then Vix should rebuild:

```txt
app.o
```

and relink:

```txt
myapp
```

But it should not rebuild:

```txt
main.o
server.o
unrelated libraries
```

A graph makes that possible.

## Header changes

Header changes are harder.

If this changes:

```txt
include/config.hpp
```

Vix must know which source files include it.

That information comes from dependency files.

If three object files depend on the header, those three become dirty.

The rest can stay clean.

## Resource changes

Resources should also be modeled.

If this changes:

```txt
assets/logo.png
```

Vix should not recompile C++.

It should only rerun the resource copy task.

This is another reason resources should be separate from sources.

## Generated CMake and graph import

For `vix.app`, the current path is:

```txt
vix.app
  -> generated CMake
  -> CMake/Ninja files
  -> imported BuildGraph
```

This gives Vix a bridge.

The manifest is simple.

CMake provides compatibility.

The graph layer lets Vix analyze and optimize.

## Native vix.app graph

The future path is more direct:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

In that model, Vix does not need to import a graph from CMake for simple projects.

It can create the graph directly from:

```txt
sources
include_dirs
defines
compile_options
link_options
links
resources
output_dir
```

This is why `vix.app` is strategically important.

## Why arbitrary CMake is harder

CMake is a full language.

It can do many things conditionally:

```txt
if platform is Linux
if compiler is Clang
if package exists
generate files
add targets dynamically
call functions
use generator expressions
```

Vix cannot safely understand all arbitrary CMake logic without letting CMake run.

That is why the CMake path imports generated build files instead of trying to interpret CMake itself.

## Why vix.app is easier

`vix.app` is narrow and declarative.

It says:

```txt
these are the sources
these are the includes
these are the links
these are the resources
```

There is no arbitrary control flow.

That makes it possible for Vix to build a native graph directly.

## Graph storage

A build graph can be stored between builds.

Stored graph data can include:

```txt
nodes
tasks
command hashes
dependency state
output paths
dirty state
cache metadata
```

On the next build, Vix can reload this state and compare it with the current project state.

That helps reduce repeated work.

## Correctness first

A build graph must be correct before it is fast.

A wrong cache hit is worse than a slow build.

If Vix is unsure whether an output is valid, it should rebuild.

Good build systems are conservative.

The rule should be:

```txt
skip only when correctness is proven
```

## Debugging the graph

A useful build graph should be inspectable.

Engineers may need to know:

```txt
why this file rebuilt
why this object was dirty
why this target linked again
why this cache entry was missed
which header caused the rebuild
```

Over time, Vix can expose commands or verbose output to explain graph decisions.

This is important for trust.

## Example graph

For this project:

```txt
myapp/
  vix.app
  include/
    myapp/
      app.hpp
  src/
    main.cpp
    app.cpp
```

Manifest:

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

Conceptual graph:

```txt
Node: src/main.cpp
Node: src/app.cpp
Node: include/myapp/app.hpp
Node: build/main.o
Node: build/app.o
Node: build/myapp

Task: compile main.cpp -> main.o
Task: compile app.cpp -> app.o
Task: link main.o app.o -> myapp
```

If `src/app.cpp` changes:

```txt
app.o dirty
myapp dirty
main.o clean
```

That is the behavior Vix wants.

## Example with resources

Manifest:

```ini
resources = [
  assets,
]
```

Graph:

```txt
Node: assets/
Node: build/bin/assets/

Task: copy assets -> build/bin/assets
```

If `assets/logo.png` changes, Vix should rerun the copy task.

It should not recompile unrelated C++ files.

## Example with package links

Manifest:

```ini
packages = [
  Threads:REQUIRED,
]

links = [
  Threads::Threads,
]
```

Graph-level model:

```txt
Package node: Threads
Link input: Threads::Threads
Task: link myapp
```

If package configuration changes, linking may become dirty.

## Relationship with Ninja

Ninja already has a build graph.

So why does Vix need one?

Because Vix needs its own higher-level decisions:

```txt
artifact cache
object cache
diagnostics
target-aware UX
future native builds
cross-project reuse
explainable rebuilds
```

Ninja executes a graph very well.

Vix needs to understand and augment the graph.

## Relationship with CMake

CMake generates the build graph.

Vix can use CMake as the source of truth for complex projects.

But for `vix.app`, Vix can eventually become the source of truth.

So the relationship is:

```txt
CMake project:
  CMake generates graph
  Vix imports and augments it

vix.app project:
  Vix generates CMake today
  Vix can generate native graph later
```

## The long-term architecture

The long-term architecture can look like this:

```txt
ProjectResolver
  -> BuildPlan
  -> BuildGraph
  -> ObjectCache
  -> ArtifactCache
  -> Scheduler
  -> Link
```

For CMake projects:

```txt
CMakeLists.txt
  -> CMake configure
  -> import compile_commands.json
  -> import build.ninja
  -> graph analysis
```

For `vix.app` projects:

```txt
vix.app
  -> native graph generation
  -> graph execution
```

with CMake still available as fallback.

## The engineering goal

The goal is not only faster builds.

The goal is understandable builds.

Vix should be able to explain:

```txt
what it is building
why it is building it
what changed
what was cached
what was skipped
what failed
```

A build graph makes that possible.

## Conclusion

The Vix build graph is the foundation for a smarter C++ build pipeline.

It models files as nodes.

It models work as tasks.

It tracks dependencies and dirty state.

It enables target-aware builds, object caching, artifact caching, and future native execution.

Today, Vix can import graph information from CMake and Ninja.

Tomorrow, `vix.app` can feed the graph directly.

That is the direction:

```txt
CMake compatibility for complex projects
native BuildGraph for simple vix.app projects
cache and scheduling across both
```
