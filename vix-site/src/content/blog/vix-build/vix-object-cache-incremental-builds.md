---
title: vix Object Cache and Incremental Builds
description: How Vix can avoid unnecessary recompilation by caching object files, tracking compile inputs, and rebuilding only what changed.
date: 2026-05-17
---

# vix Object Cache and Incremental Builds

C++ builds become slow when the build system repeats work that did not need to happen.

The compiler may be fast enough for one file.

The problem appears when the build system recompiles too much:

```txt
unchanged source files
unchanged headers
unchanged compiler flags
unchanged dependencies
unchanged build configuration
```

The purpose of an object cache is simple:

```txt
if this exact source file was already compiled with the exact same inputs,
reuse the object file instead of compiling it again
```

For `vix build`, this is one of the most important foundations for faster incremental builds.

## What an object file is

In a normal C++ build, each source file is usually compiled into an object file.

Example:

```txt
src/main.cpp -> main.o
src/app.cpp  -> app.o
```

Then the linker combines object files into the final output:

```txt
main.o + app.o -> myapp
```

So if only `src/app.cpp` changed, the ideal incremental build is:

```txt
recompile app.cpp
reuse main.o
relink myapp
```

It should not recompile every source file.

## The basic incremental build model

A simple project:

```txt
myapp/
  include/
    myapp/
      app.hpp
  src/
    main.cpp
    app.cpp
```

Build graph:

```txt
src/main.cpp -> main.o
src/app.cpp  -> app.o

main.o + app.o -> myapp
```

If `src/app.cpp` changes:

```txt
main.o stays valid
app.o becomes dirty
myapp must relink
```

A good build system should rebuild only:

```txt
app.o
myapp
```

not:

```txt
main.o
```

## Why object caching matters

Incremental builds already avoid some work.

But an object cache goes further.

It can reuse compiled objects even when the build directory was cleaned, recreated, or moved, as long as the compile inputs are identical.

Example:

```txt
first build:
  compile src/main.cpp -> main.o
  store main.o in object cache

later build:
  same source
  same headers
  same flags
  same compiler
  restore main.o from cache
```

This turns repeated compilation into a file restore.

## Object cache vs normal incremental build

A normal incremental build asks:

```txt
Is the existing object file in the build directory still valid?
```

An object cache asks:

```txt
Have I ever built this exact object before?
```

That distinction matters.

If the build directory is removed:

```bash
rm -rf build-ninja
```

a normal incremental build loses its objects.

But an object cache may still restore them.

## Correctness comes first

An object cache must be conservative.

A wrong cache hit is worse than a slow build.

If Vix is unsure whether an object file is valid, it should recompile.

The rule should be:

```txt
reuse only when the full compile identity matches
```

The cache key must include every input that can affect the object file.

## Compile identity

The compile identity is the full set of information that makes one object file valid.

Important inputs include:

```txt
source file content
header dependencies
compiler executable
compiler version
compiler arguments
include directories
preprocessor definitions
C++ standard
target triple
build type
toolchain
system headers when relevant
```

If any of these changes, the cached object may no longer be valid.

## Source content

The source file is the obvious input.

If this changes:

```txt
src/app.cpp
```

the object file must be rebuilt.

A source file can be checked through:

```txt
timestamp
file size
content hash
```

For cache keys, content hashes are safer.

## Header dependencies

Headers are just as important as source files.

Example:

```cpp
#include <myapp/app.hpp>
```

If `include/myapp/app.hpp` changes, then `src/app.cpp` may need to be recompiled.

This is why the object cache cannot rely only on the `.cpp` file.

It must know the dependency set.

## Dependency files

Compilers can generate dependency files.

Example:

```txt
app.o: src/app.cpp include/myapp/app.hpp include/myapp/config.hpp
```

These files tell Vix which headers affect an object file.

If a header changes, Vix can mark the correct object files as dirty.

Without dependency files, the cache would either be unsafe or too conservative.

## Compiler command

The compiler command is part of the object identity.

This command:

```bash
g++ -std=c++20 -Iinclude -c src/app.cpp -o app.o
```

is not the same as:

```bash
g++ -std=c++23 -Iinclude -DDEBUG=1 -c src/app.cpp -o app.o
```

Even if the source file is unchanged, the output object may differ.

So Vix needs a command hash.

## Compiler identity

The compiler itself matters.

These are not necessarily equivalent:

```txt
g++ 13
g++ 14
clang++ 18
```

A cache entry produced by one compiler version may not be safe for another compiler version.

The object cache key should include compiler identity.

At minimum:

```txt
compiler path
compiler version
target triple
```

## Build type

Debug and release builds are different.

A debug object may be compiled with:

```txt
-g
-O0
```

A release object may be compiled with:

```txt
-O3
-DNDEBUG
```

Those outputs are not interchangeable.

The build type or full compiler command must be part of the cache key.

## Include directories

Include directories affect which headers are found.

This command:

```bash
g++ -Iinclude -c src/app.cpp
```

can produce a different result from:

```bash
g++ -Iother_include -c src/app.cpp
```

Even if the source file text is the same, the compiler may read different headers.

Include paths must be part of the compile identity.

## Defines

Preprocessor definitions affect compilation.

Example:

```ini
defines = [
  MYAPP_ENABLE_LOGGING=1,
]
```

This can change compiled code.

So definitions must be included in the cache key.

## C++ standard

The selected standard changes how code is parsed and compiled.

```ini
standard = c++20
```

is not equivalent to:

```ini
standard = c++23
```

The C++ standard must be part of the object identity.

## Target triple

Cross-compilation changes the output.

A cached object for:

```txt
x86_64-linux-gnu
```

cannot be reused for:

```txt
aarch64-linux-gnu
```

The target triple must be part of the cache key.

## Object cache flow

A compile task can follow this flow:

```txt
1. compute compile identity
2. look for object in cache
3. if cache hit:
     restore object file
     restore dependency file if available
4. if cache miss:
     run compiler
     store object file in cache
     store dependency file in cache
```

This gives a simple and safe model.

## Cache hit

A cache hit means:

```txt
Vix found a previously compiled object with the same compile identity.
```

Then Vix can copy or restore:

```txt
cached object -> build output object
cached dependency file -> build dependency file
```

This avoids running the compiler.

## Cache miss

A cache miss means:

```txt
no safe cached object exists
```

Then Vix runs the compiler.

After successful compilation, Vix stores the result for future use.

Cache misses are normal.

They happen when code changes, flags change, or a project is built for the first time.

## Cache invalidation

The object cache must invalidate entries when relevant inputs change.

Examples:

```txt
source changed
header changed
compiler changed
flags changed
defines changed
include_dirs changed
target triple changed
build type changed
toolchain changed
```

The easiest safe model is content-addressed caching.

The key is derived from the full compile identity.

When identity changes, the key changes.

## Incremental build without object cache

Without an object cache, incremental build relies on the current build directory.

Example:

```txt
build-ninja/
  main.o
  app.o
```

If `app.cpp` changes:

```txt
app.o rebuilds
main.o stays
```

This is good, but local to the build directory.

If the build directory disappears, the work is lost.

## Incremental build with object cache

With an object cache:

```txt
~/.vix/cache/objects/
```

or another cache location can store compiled outputs.

Then Vix can restore objects even after:

```txt
clean build
new build directory
reconfigured project
CI cache restore
```

as long as the compile identity matches.

## Relationship with ccache

Tools like `ccache` already cache compiler outputs.

So why should Vix have an object cache?

Because Vix can integrate caching into the build graph.

Vix can know:

```txt
which target is being built
which task is dirty
which dependency caused the rebuild
which object was restored
which artifact can be skipped
```

`ccache` works at the compiler invocation layer.

Vix can work at the build orchestration layer.

They can also complement each other.

## Object cache and BuildGraph

The object cache becomes more powerful when connected to the BuildGraph.

The graph knows:

```txt
compile tasks
source inputs
header dependencies
object outputs
link inputs
target outputs
```

The object cache knows:

```txt
which compile outputs can be restored
```

Together, they allow Vix to skip more work safely.

## Object cache and Scheduler

The scheduler can treat a cache restore as a task result.

For each compile task:

```txt
if object cache hit:
  restore object
else:
  compile source
```

Independent restores and compiles can still happen in parallel.

The scheduler does not need to care whether a task ran the compiler or restored a cached object.

It only needs the output to become valid.

## Object cache and Link

Even if all objects are restored from cache, the final link may still be needed.

But link can be skipped if the final executable or library is also known to be valid.

That is where the artifact cache or link cache becomes useful.

Object cache handles object files.

Artifact cache handles larger outputs.

## Example: one file changed

Project:

```txt
src/main.cpp
src/app.cpp
src/server.cpp
```

Change:

```txt
src/app.cpp
```

Expected behavior:

```txt
main.o   -> cache hit or clean
app.o    -> compile
server.o -> cache hit or clean
myapp    -> relink
```

This is the basic incremental build experience.

## Example: header changed

Project:

```txt
src/main.cpp includes include/app.hpp
src/server.cpp includes include/server.hpp
```

Change:

```txt
include/app.hpp
```

Expected behavior:

```txt
main.o   -> dirty
server.o -> clean
myapp    -> relink
```

The dependency file tells Vix which object depends on which header.

## Example: define changed

Manifest changes:

```ini
defines = [
  ENABLE_LOGGING=1,
]
```

to:

```ini
defines = [
  ENABLE_LOGGING=0,
]
```

Expected behavior:

```txt
affected compile tasks become dirty
objects rebuild or cache miss
target relinks
```

Even if source files did not change, the object identity changed.

## Example: compiler changed

Compiler changes from:

```txt
g++ 13
```

to:

```txt
clang++ 18
```

Expected behavior:

```txt
object cache keys change
old objects are not reused
project rebuilds safely
```

This is correct.

## Example: clean build with warm cache

First build:

```txt
compile main.cpp
compile app.cpp
link myapp
store objects
```

Then:

```bash
rm -rf build-ninja
vix build
```

With warm object cache:

```txt
restore main.o
restore app.o
link myapp
```

If artifact cache also has the final binary, even linking may be skipped.

## No-op build

A no-op build means nothing changed.

Ideal behavior:

```txt
configuration unchanged
graph unchanged
objects unchanged
target unchanged
finish immediately
```

Object cache is not always needed for no-op builds if the build directory is already valid.

But object cache helps when build outputs are missing.

## Cache storage

A cache entry can store:

```txt
object file
dependency file
metadata
compile identity
source hash
dependency hashes
compiler info
command hash
created time
```

The metadata helps Vix explain cache behavior.

Example:

```txt
cache hit: src/app.cpp
cache miss: command hash changed
cache miss: header include/config.hpp changed
```

Explainability matters.

## Cache keys

A safe cache key should be stable and content-based.

Conceptually:

```txt
hash(
  source content,
  dependency contents,
  compiler identity,
  compiler arguments,
  include directories,
  defines,
  standard,
  target triple,
  build type
)
```

The exact implementation can evolve.

The important rule is:

```txt
same key means same compile result
```

or at least close enough to be safe under the build model.

## Cache metadata

Metadata can include:

```txt
source path
object path
compiler
arguments hash
dependencies
dependency hashes
target triple
build type
```

This is useful for debugging.

When a cache miss happens, Vix can eventually explain why:

```txt
miss: compiler changed
miss: header hash changed
miss: command hash changed
```

## Cache eviction

A cache can grow over time.

Eventually, Vix may need cache eviction.

Eviction policies can use:

```txt
least recently used
maximum cache size
maximum age
manual clean command
per-project cleanup
```

The first priority is correctness.

Eviction is a storage management problem, not a build correctness problem.

## Cache and CI

Object cache can help CI when cache directories are restored between runs.

A CI pipeline can restore:

```txt
~/.vix/cache/
```

Then repeated builds can reuse objects.

But CI environments vary.

Compiler paths, compiler versions, system headers, and target triples can differ.

The cache key must account for those differences.

## Cache and distributed builds

A deeper future version could share cache entries between machines.

That requires stronger identity checks.

Important inputs become even more critical:

```txt
compiler version
target triple
system headers
standard library
toolchain
environment
```

Distributed cache is powerful, but it must be conservative.

## Object cache and vix.app

`vix.app` makes object caching easier to reason about.

The manifest directly lists:

```txt
sources
include_dirs
defines
compile_options
standard
target type
```

That gives Vix structured compile input before it even asks CMake.

Today, Vix can use generated CMake and imported compile commands.

Later, Vix can create compile tasks directly from `vix.app`.

## Native vix.app build path

The future native path is:

```txt
vix.app
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

In this model, object caching is not an add-on.

It is part of the build execution model.

For each source file, Vix can decide:

```txt
restore object
or compile source
```

before scheduling link.

## Object cache and CMake projects

For arbitrary CMake projects, Vix should not guess.

It should import:

```txt
compile_commands.json
build.ninja
dependency files
```

Then cache decisions are based on real generated build information.

This keeps compatibility with complex CMake logic.

## Object cache and correctness boundary

Some inputs are hard to capture perfectly.

Examples:

```txt
system headers
compiler plugins
environment variables
implicit include paths
generated headers
precompiled headers
```

If these are not modeled, Vix must be conservative.

A build cache should prefer a miss over a wrong hit.

## Precompiled headers

Precompiled headers complicate object caching.

They introduce additional binary inputs.

If Vix supports them deeply, the cache identity must include:

```txt
PCH source
PCH flags
compiler identity
dependent object relationship
```

For simple initial object caching, Vix can avoid special PCH support or rely on CMake/Ninja behavior.

## Generated headers

Generated headers must be handled carefully.

If a source depends on a generated header, the object is valid only after the generated header is up to date.

The graph must represent:

```txt
generate header
compile source
```

with the correct ordering.

This is easier in CMake compatibility mode because Ninja already knows the generated dependency graph.

For native `vix.app`, Vix would need explicit support.

## Link invalidation

Object cache does not eliminate linking.

If any object changes, the linked target usually becomes dirty.

So the full incremental build path is:

```txt
restore or compile objects
then relink if link inputs changed
```

A separate artifact cache can optimize final outputs.

## Artifact cache vs object cache

Object cache:

```txt
source -> object
```

Artifact cache:

```txt
objects/libs/config -> executable/library/package
```

Object cache is fine-grained.

Artifact cache is coarse-grained.

Both are useful.

A deep build system needs both.

## Measuring object cache effectiveness

Useful metrics include:

```txt
compile tasks selected
object cache hits
object cache misses
objects restored
objects compiled
time spent restoring
time spent compiling
link time
total build time
```

Vix should eventually expose this in verbose output.

Example:

```txt
objects: 18 selected, 16 cache hits, 2 compiled
```

This helps engineers trust the cache.

## Explaining rebuilds

Fast builds are useful.

Explainable builds are better.

Vix should eventually answer:

```txt
Why did this file rebuild?
```

Example explanations:

```txt
src/app.cpp rebuilt because source changed
src/main.cpp rebuilt because include/config.hpp changed
src/server.cpp rebuilt because compile options changed
```

This is a major developer experience improvement.

## Common object cache mistakes

### Reusing objects across compilers

Wrong:

```txt
reuse g++ object for clang++ build
```

Correct:

```txt
compiler identity is part of cache key
```

### Ignoring headers

Wrong:

```txt
cache key = source hash only
```

Correct:

```txt
cache key includes dependency headers
```

### Ignoring compile flags

Wrong:

```txt
same source means same object
```

Correct:

```txt
source + command + dependencies define object identity
```

### Trusting timestamps only

Timestamps are useful, but cache keys should be stronger.

For correctness, use content-based identity where it matters.

## Practical first version

A practical first object cache can support:

```txt
compile command hash
source hash
dependency file hash
compiler identity
object output
dependency output
```

Flow:

```txt
read compile_commands.json
read dependency file if present
compute key
restore object on hit
compile on miss
store object after success
```

This is enough to create real value.

## Later improvements

Later improvements can include:

```txt
better dependency hashing
system header modeling
remote cache
cache eviction
explainable cache misses
link result cache
per-target cache summaries
native vix.app graph integration
```

The key is to build the cache in layers.

## Engineering principle

The object cache should follow one principle:

```txt
never trade correctness for speed
```

If Vix cannot prove that a cached object is valid, it should compile.

A slow correct build is acceptable.

A fast wrong build is not.

## Conclusion

Object caching is one of the main ways `vix build` can become significantly faster.

It works by reusing compiled object files when the full compile identity matches.

That identity includes more than the source file.

It includes headers, compiler, flags, defines, include paths, standard, target triple, and build configuration.

Combined with the BuildGraph, Scheduler, and ArtifactCache, the object cache gives Vix a path toward much faster incremental builds.

The long-term direction is:

```txt
vix.app
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

That is where Vix can make repeated C++ builds feel dramatically faster without pretending that C++ compilation itself is free.
