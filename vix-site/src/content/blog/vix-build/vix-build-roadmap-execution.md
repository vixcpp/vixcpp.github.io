# Vix Build Roadmap Execution

`vix build` is becoming more than a CMake/Ninja frontend.

The goal is not to replace CMake and Ninja immediately.
The goal is to build a smarter layer above them:

```
fast when safe
correct by default
fallback when needed
```

The latest work focused on turning the build roadmap into real implementation steps.

The main areas were:

- build routing
- clean output
- safe fast path
- security tests
- no-op optimization
- why rebuild
- safer Ninja import
- ObjectCache
- ArtifactCache
- native vix.app builds
- diagnostics
- CI and benchmarks

This article summarizes what changed and why it matters.

## 1. Stabilizing the build routing

The first step was to make the build path predictable.
The rules are now clearer:

```
vix build --build-target all
  -> CMake/Ninja

vix build --build-target <real-target>
  -> Graph Target Executor
  -> fallback CMake/Ninja

vix build --fast --build-target <real-target>
  -> build-state fast path
  -> fallback Graph Target Executor
  -> fallback CMake/Ninja

VIX_GRAPH_EXECUTOR=0 vix build --build-target <target>
  -> CMake/Ninja
```

This matters because build systems must never guess dangerously.

The `all` target stays on the CMake/Ninja path because it can represent many things:

- executables
- libraries
- tests
- examples
- generated targets
- install targets
- utility targets

A real executable or library target can use the graph executor.
A global or ambiguous target falls back to CMake/Ninja.

The principle is simple:

```
real target      -> Vix graph path
global target    -> CMake/Ninja path
ambiguous target -> CMake/Ninja path
```

## 2. Cleaner user output

The second step was to make the output more stable and less noisy.
A no-op fast path should look like this:

```
Checking vix (dev)
  ✔ Up to date in 0.30s
```

A graph target build should look like this:

```
Building vix (dev)
  ✔ Graph target: vix
  ✔ Up to date
  ✔ Done
```

The output rules are now:

```
vix build
  -> minimal user output

vix build -v
  -> detailed but still readable output

VIX_LOG_LEVEL=debug vix build -v
  -> internal graph/cache/build logs
```

Internal details should not pollute normal builds.
Users should see what matters.
Developers debugging Vix internals can still access the deeper logs.

## 3. Safer `--fast`

The `--fast` path is only useful if it is safe.
It should never say `Up to date` unless the target is really up to date.
The build state validation was strengthened to check:

- project fingerprint
- build signature
- build target
- preset
- build type
- compiler identity
- target identity
- project inputs
- last binary path
- last binary exists
- last binary is executable
- artifact root exists

Some values such as launcher, linker and CMake variables are already part of the build signature.
The important rule is:

```
state hit is not enough
the final binary must still exist
```

So if the last binary was deleted, Vix must fallback to the normal build path.

Example:

```sh
vix build --build-target vix
rm -f build-ninja/vix
vix build --fast --build-target vix
```

The last command must not return a false `Up to date`.

## 4. Build safety tests

The next step was adding a dedicated safety test script.
The script covers the most fragile paths:

- build target all
- build target real
- graph executor enabled
- graph executor disabled
- `--fast` state hit
- `--fast` fallback
- missing last binary
- changed source file
- changed header file
- changed CMakeLists.txt
- changed compiler flags
- changed build target

The goal is regression protection.
Every optimization must prove that it does not break correctness.
The test script creates a small temporary CMake project, runs `vix build` in different modes, and checks the output behavior.

This gives Vix a safety net before adding more aggressive caching or native build execution.

## 5. Faster no-op builds without `--fast`

Before this step, the normal build path could still pay for:
- scan project
- load compile_commands.json
- load build.ninja
- load dependency files
- propagate dirty state

even when nothing changed.
The improvement was to allow a valid build state hit to return early even without `--fast`.
That means:

```sh
vix build --build-target vix
```

can also become fast when the build state proves that nothing changed.
The ideal no-op path becomes:

```
read build state
snapshot project inputs
compare signatures
verify last binary
return up to date
```

This turns the build state from a `--fast`-only feature into a general no-op optimization.

## 6. Explaining why Vix rebuilds

Speed is not the only goal.
A build tool should also explain its decisions.
The new `--explain` path is designed for this:

```sh
vix build --explain --build-target vix
```

Expected output:

```
Rebuilding BuildCommand.cpp
  reason: source file changed

Rebuilding CLI.cpp
  reason: CLI.hpp changed

Relinking vix
  reason: object file changed
```

The first version uses the current graph and the previous graph to compare:
- task existence
- command hash
- missing outputs
- source changes
- header changes
- config changes
- node state changes

This starts the foundation for a bigger feature:

> Vix should not only rebuild. Vix should explain why it rebuilt.
That is very important for large C++ projects.
When a single header causes many files to rebuild, users should be able to see the reason.

## 7. Safer Ninja import

Vix imports `build.ninja` so it can understand the generated build graph.

The goal is not to blindly reimplement Ninja.
The goal is to use Ninja metadata safely.
The improved rules are:

```
--build-target all       -> CMake/Ninja
phony complex target     -> CMake/Ninja
real output target       -> Graph Executor
ambiguous target         -> CMake/Ninja
```

This means Vix can import more Ninja edges, but still avoid unsafe execution.
The safer import path improves:

- link edges
- archive edges
- copy edges
- install edges
- utility edges
- target dependencies
- real output detection

But the executor only handles clear real outputs.

For now:

```
Link/Archive target              -> safe candidate
Copy/Install/Utility/phony       -> fallback
multiple matches                 -> fallback
zero matches                     -> fallback
```

The correction rule is more important than speed: if unsure, use CMake/Ninja.

## 8. Stronger ObjectCache

ObjectCache is responsible for avoiding unnecessary recompilation.
The cache key must be strong enough to prevent wrong reuse.
A compile cache key now depends on:

- source content hash
- dependency/header content hash
- command hash
- compiler identity
- target triple
- build fingerprint
- build type
- defines
- include dirs
- compile flags

The expected flow is:

```
for each compile task:
  compute object cache key

  if cache hit:
    restore .o
    restore .d
    skip compiler

  else:
    compile
    store .o
    store .d
```

A key improvement is making the object cache survive build directory deletion.
Instead of only living under the build directory, the object cache can live under:

```
~/.vix/cache/objects
```

That enables this workflow:

```sh
vix build --build-target vix
rm -rf build-ninja
vix build --build-target vix
```

With a warm cache, Vix should restore object files instead of recompiling everything.

## 9. ArtifactCache for complete targets

ObjectCache avoids recompiling `.o` files.
ArtifactCache goes one level higher.

It can restore the final target itself:

```
ArtifactCache  -> restore final binary/library
ObjectCache    -> restore .o/.d
Compiler       -> compile only misses
```

The ideal flow is:

```
check artifact cache

if artifact hit:
  restore final binary/lib
  done

else:
  check object cache
  compile only misses
  link
  store artifact
```

This matters for:

- CI
- clean builds
- developer machines
- packages
- global dependencies
- release builds

For a target like `vix`, the cache can store the final binary under the artifact root:

```
~/.vix/cache/build/.../bin/vix
```

Then a later build can restore it directly.

This is the fastest path after build-state validation.

## 10. Native `vix.app` build path

`vix.app` already exists.

Today, the compatibility path is:

```
vix.app -> generated CMake -> CMake/Ninja
```

That is good because it supports more features safely.
The new direction is to add a native path for simple cases:

```
vix.app simple executable
  -> Native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

But the important rule stays:

```
simple features   -> native Vix build path
complex features  -> generated CMake fallback
```

Vix already has:

- AppManifest
- AppManifest parser
- AppProjectResolver
- AppCMakeGenerator

So the native path should reuse the existing AppManifest.
It should not create a second parser.
The safe V1 supports simple executable projects.
Complex features still fallback to generated CMake:

- packages
- resources
- links
- compile features
- static libraries
- shared libraries

This keeps compatibility while letting Vix start owning the native build path.

## 11. Better diagnostics

A faster build is not enough.
When a build fails, the output should help the developer fix it quickly.
The diagnostic improvements focus on:

- compiler errors with code frame
- warnings grouped
- file + line + column
- raw command hidden by default
- raw command visible in debug
- hint for missing headers
- hint for linker errors
- hint for unresolved targets

Expected style:

```
Build failed

src/main.cpp:12:10
  error: 'App' was not declared

Hint:
  Declare the symbol before use, include the right header,
  or move the function definition above the call.
```

For missing headers:

```
Build failed

src/main.cpp:2:10
  error: fatal error: app.hpp: No such file or directory

Hint:
  Check that the header exists and that its directory is listed
  in include_dirs, target_include_directories, or your compiler include paths.
```

Warnings should be grouped:

```
  warning  3 compiler warnings
    • src/main.cpp:10:9: warning: unused variable 'x'
    • src/app.cpp:4:12: warning: unused function 'foo'
    • src/db.cpp:8:5:  warning: control reaches end of non-void function
```

Raw commands should stay hidden by default. Debug mode can show them:

```sh
VIX_LOG_LEVEL=debug vix build -v
```

This keeps normal output clean and makes internal debugging possible.

## 12. CI and official benchmarks

The last step was adding a reproducible way to prove the gains.
The standard benchmark is:

```sh
hyperfine --warmup 5 --runs 20 \
  'vix build --fast --build-target vix' \
  'vix build --build-target vix' \
  'VIX_GRAPH_EXECUTOR=0 vix build --build-target vix'
```

The official scenarios are:

- no-op build
- incremental one source changed
- incremental one header changed
- clean build cold cache
- clean build warm object cache
- target build vs all build
- fast path hit
- fast path fallback

Every benchmark report should include:

- CPU, RAM, OS
- compiler, linker, launcher
- Vix version
- project size
- number of source files, headers, compile tasks
- cache status

This matters because build performance depends heavily on the machine and environment.
A benchmark without environment details is not very useful.

## Current architecture after this work

The build model now has multiple layers:

```
Build state    -> fastest no-op validation
ArtifactCache  -> restore complete target
BuildGraph     -> target-aware analysis
ObjectCache    -> restore .o/.d files
Scheduler      -> execute selected compile tasks
CMake/Ninja    -> compatibility fallback
```

The routing model is:

```
if build state proves clean:
  return up to date

else if complete artifact exists:
  restore target

else if real target is graph-safe:
  use Graph Executor

else:
  use CMake/Ninja
```

This creates a progressive build system.
Each layer tries to solve the build earlier.
If a layer cannot prove correctness, Vix falls back to the next safer layer.

## Why this matters

C++ build tooling often forces users to choose between power and simplicity.

Vix is taking a different path:

- keep CMake/Ninja compatibility
- add fast paths where safe
- add graph intelligence gradually
- improve diagnostics
- make common workflows simpler

This is not a rewrite of the C++ ecosystem.
It is a practical build layer that improves the developer workflow step by step.

## The principle

> Vix should be fast when it can prove correctness.
> Vix should fallback when another tool is safer.

That principle applies to every part:

```
all target          -> fallback
ambiguous target    -> fallback
complex vix.app     -> fallback
missing binary      -> fallback
changed inputs      -> rebuild
valid no-op state   -> return fast
```

This is how Vix can become faster without becoming fragile.

## Conclusion

The latest `vix build` work turns the roadmap into a stronger build architecture.

Vix now has a clearer path toward:

- fast no-op builds
- safer target routing
- better cache reuse
- native vix.app execution
- clearer diagnostics
- reproducible benchmarks

The long-term direction is now visible:

```
CMake/Ninja    -> for compatibility
BuildGraph     -> for intelligence
ObjectCache    -> for compile reuse
ArtifactCache  -> for target reuse
vix.app        -> for native simple builds
diagnostics    -> for developer experience
CI/benchmarks  -> for proof
```

This is the foundation of a modern C++ build workflow inside Vix.
