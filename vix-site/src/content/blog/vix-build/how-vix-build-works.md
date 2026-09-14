---
title: How vix build Works
description: A technical walkthrough of the vix build pipeline, from project resolution and planning to CMake compatibility, build graphs, caching, and execution.
date: 2026-05-17
---

# How vix build Works

`vix build` is the command that turns a Vix.cpp project into build outputs.

Those outputs can be:

```txt
executables
static libraries
shared libraries
test binaries
examples
```

At a high level, the command does four things:

```txt
resolve the project
create a build plan
configure the build system
build the selected target
```

For normal CMake projects, Vix keeps the CMake compatibility path.

For `vix.app` projects, Vix can generate an internal CMake project first, then build it through the same build pipeline.

The current model is:

```txt
CMakeLists.txt
  -> project resolution
  -> build planning
  -> CMake configure
  -> CMake build

vix.app
  -> project resolution
  -> generated CMake
  -> build planning
  -> CMake configure
  -> CMake build
```

The long-term model is:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

But the current implementation keeps compatibility first.

## The main job of vix build

`vix build` should answer these questions:

```txt
What project am I building?
Which build preset is active?
Where is the build directory?
What is the CMake source directory?
What is the default target name?
Do I need to configure?
Do I need to build?
Can I reuse previous artifacts?
Can I skip work safely?
```

A good build command should not blindly rebuild everything.

It should avoid unnecessary work while staying correct.

## Project resolution

The first step is project resolution.
Vix needs to find the project root.
A project root is usually a directory containing one of these files:

```txt
CMakeLists.txt
vix.app
```

The resolution rule is:

```txt
1. If CMakeLists.txt exists, use CMakeLists.txt.
2. Otherwise, if vix.app exists, use vix.app.
```

This rule is important because CMake remains the full-control path.

If a `CMakeLists.txt` exists, Vix does not ignore it.

## CMake project resolution

For a CMake project:

```txt
myapp/
  CMakeLists.txt
  src/
    main.cpp
```

the resolved project model is:

```txt
userProjectDir       = myapp/
cmakeSourceDir       = myapp/
defaultTargetName    = myapp
generatedFromVixApp  = false
```

The configure step can use:

```bash
cmake -S myapp -B myapp/build-ninja
```

The build step can use:

```bash
cmake --build myapp/build-ninja --target myapp
```

when no explicit target is provided.

## vix.app project resolution

For a `vix.app` project:

```txt
myapp/
  vix.app
  src/
    main.cpp
```

Vix first parses the manifest.

Then it generates an internal CMake project under:

```txt
myapp/.vix/generated/app/
```

The resolved model becomes:

```txt
userProjectDir       = myapp/
cmakeSourceDir       = myapp/.vix/generated/app/
defaultTargetName    = manifest.name
generatedFromVixApp  = true
```

This distinction is critical.

The user project is still:

```txt
myapp/
```

But the CMake source directory is:

```txt
myapp/.vix/generated/app/
```

## Why userProjectDir and cmakeSourceDir are separate

For normal CMake projects, the two paths are the same.
For `vix.app`, they are different.
That means the build plan must not treat one path as everything.

Use:

```txt
userProjectDir
```

for real project operations:

```txt
build directory placement
.env lookup
watch mode
snapshots
cache state
exports
user diagnostics
```

Use:

```txt
cmakeSourceDir
```

for CMake configure:

```txt
cmake -S
generated CMake diagnostics
CMakeLists.txt path
```

If those two paths are confused, Vix can build the wrong target, export to the wrong directory, or snapshot generated files instead of user files.

## Build planning

After project resolution, Vix creates a build plan.
The build plan contains derived paths and decisions.
A good plan contains values like:

```txt
userProjectDir
cmakeSourceDir
projectDir
defaultTargetName
generatedFromVixApp
preset
buildDir
configureLog
buildLog
signature
cmakeVars
launcher
fastLinkerFlag
projectFingerprint
```

The plan is the central object used by the build pipeline.
It tells the rest of the command what to configure, where to build, and what target to build.

## Presets

Vix has embedded build presets.

Common presets include:

```txt
dev
dev-ninja
release
```

They map to common build configurations.

Example:

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

So this:

```bash
vix build
```

usually builds with the default development preset.

And this:

```bash
vix build --preset release
```

uses the release preset.

## Build directory

The build directory is where CMake and Ninja write build files and outputs.

Examples:

```txt
build-dev/
build-ninja/
build-release/
```

For `vix.app`, build directories must still be created under the user project directory.

Correct:

```txt
myapp/build-ninja/
```

Wrong:

```txt
myapp/.vix/generated/app/build-ninja/
```

The generated CMake directory is not the user project root.

## Configure step

The configure step runs CMake.

Conceptually:

```bash
cmake -S <cmakeSourceDir> -B <buildDir> -G Ninja
```

For a CMake project:

```bash
cmake -S myapp -B myapp/build-ninja -G Ninja
```

For a `vix.app` project:

```bash
cmake -S myapp/.vix/generated/app -B myapp/build-ninja -G Ninja
```

This is why `cmakeSourceDir` exists.

The configure step must use the directory containing the active `CMakeLists.txt`.

## Build step

The build step runs:

```bash
cmake --build <buildDir>
```

If a target is known, Vix can build that specific target:

```bash
cmake --build build-ninja --target myapp
```

For `vix.app`, the default target comes from:

```ini
name = myapp
```

So the build step should not guess the target from:

```txt
.vix/generated/app
```

The target name should come from the manifest.

## Build target selection

Target selection follows this rule:

```txt
if --build-target is provided:
  use it
else if defaultTargetName exists:
  use it
else:
  use project directory name
```

This keeps old CMake behavior while supporting `vix.app`.

Example:

```bash
vix build --build-target server
```

forces the target:

```txt
server
```

Without an explicit target, a `vix.app` project uses:

```txt
manifest.name
```

## Configure signature

Vix can avoid unnecessary configure work by computing a signature.
A configure signature represents the inputs that affect CMake configuration.

Examples:

```txt
preset
CMake variables
toolchain file
compiler launcher
fast linker
target triple
project fingerprint
vix.app-generated CMake content
```

If the signature is unchanged, Vix can skip reconfigure.
If it changes, Vix should run configure again.

## Project fingerprint

The project fingerprint helps detect meaningful build configuration changes.
For CMake projects, important files may include:

```txt
CMakeLists.txt
CMakePresets.json
cmake/
```

For `vix.app` projects, important files include:

```txt
vix.app
.vix/generated/app/CMakeLists.txt
```

But the build system must still remember that the user project directory is the real project root.
The generated CMake file is derived from `vix.app`.

## CMake arguments

Vix can pass CMake variables to the configure step.

Example:

```bash
vix build -- -DCMAKE_PREFIX_PATH=/path/to/prefix
```

Everything after `--` is forwarded to CMake configure.

This is useful for cases like:

```txt
custom package prefixes
toolchain options
feature flags
external dependency locations
```

## Compiler launcher

Vix can use a compiler launcher when available.

Examples:

```txt
ccache
sccache
```

A launcher helps speed up repeated compilation by caching compiler outputs.
The build plan can store the resolved launcher.
Then CMake can receive something like:

```txt
CMAKE_CXX_COMPILER_LAUNCHER=ccache
```

This is one layer of build acceleration.

## Fast linker

Vix can also prefer a fast linker when available.

Examples:

```txt
mold
lld
```

Linking can become a bottleneck in C++ builds.
Using a faster linker reduces the cost of incremental builds where only the final link step is needed.
This does not remove compilation cost, but it improves the hot path.

## CMake compatibility path

The current build pipeline still uses CMake/Ninja as the execution layer.
This gives Vix compatibility with:

```txt
existing CMake projects
generated CMake from vix.app
CMake packages
Ninja
toolchains
compiler launchers
fast linkers
```

The compatibility path is important because C++ projects can be very different.
Vix should not break existing workflows.

## Build graph layer

Beyond running CMake, Vix can build a deeper model of the build.
The build graph layer can import:

```txt
compile_commands.json
build.ninja
dependency files
```

From those files, Vix can understand:

```txt
compile tasks
link tasks
archive tasks
copy tasks
input files
output files
dependencies
```

This is the beginning of a more intelligent build engine.

## compile_commands.json

`compile_commands.json` contains the exact compiler commands used for translation units.

A typical entry includes:

```txt
working directory
source file
compiler arguments
object output
```

This is useful because Vix should not guess compile flags.
It can import the real command emitted by CMake/Ninja.
That makes cache decisions more accurate.

## build.ninja

`build.ninja` contains the generated build rules.

Vix can parse it to understand build edges.
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

This helps Vix understand the actual build tasks that Ninja will execute.

## Dependency files

Compilers can emit dependency files such as:

```txt
main.d
```

These files describe which headers a source file depends on.

Example:

```txt
main.o: src/main.cpp include/app.hpp include/config.hpp
```

Dependency files are essential for correct incremental builds.
If a header changes, the object files that depend on it must become dirty.

## Build nodes

A build graph contains nodes.
Nodes can represent:

```txt
source files
headers
config files
packages
object files
libraries
executables
```

Each node can have a state:

```txt
clean
dirty
missing
```

This allows Vix to reason about what changed.

## Build tasks

A build graph also contains tasks.

Tasks can represent:

```txt
compile
link
archive
copy
generate
```

A compile task turns a source file into an object file.
A link task turns object files and libraries into an executable.
An archive task creates a static library.
A copy task copies resources or outputs.

## Dirty checking

A build system should know whether a task needs to run.
Inputs to dirty checking can include:

```txt
source file timestamp
source file hash
header dependency state
compiler command hash
output file existence
output file metadata
build fingerprint
```

If nothing relevant changed, the task can be skipped.
If anything relevant changed, the task should run.

## Object cache

The object cache stores reusable compiled object files.
A cached object is valid only if the compile inputs match.
Important cache inputs include:

```txt
source content
header dependencies
compiler identity
compiler arguments
include directories
defines
C++ standard
target triple
build type
```

If those match, Vix can restore the object instead of recompiling.
This can make repeated builds much faster.

## Artifact cache

The artifact cache works at a larger level.
It can cache build outputs such as:

```txt
libraries
executables
package artifacts
compiled dependencies
```

The artifact cache is useful when a whole target or dependency was already built with the same relevant inputs.

Object cache helps with translation units.
Artifact cache helps with larger build products.

## No-op builds

A no-op build is when nothing changed.

The ideal behavior is:

```txt
detect unchanged state
skip configure
skip compile
skip link
finish quickly
```

This is where a build tool can feel extremely fast.
The goal is not to make the compiler magically faster.
The goal is to avoid invoking it when there is no work.

## Target-aware builds

A target-aware build should only build what is needed for the requested target.
If the user runs:

```bash
vix build --build-target server
```

Vix should not do unnecessary work for unrelated targets.
This is especially important for larger projects.
For `vix.app`, this is simpler because one manifest usually describes one target.
For CMake projects, Vix can rely on CMake/Ninja target information.

## Scheduler

A scheduler executes build tasks in dependency order.
It can run independent tasks in parallel.

A simple model is:

```txt
find ready tasks
run ready tasks up to job limit
mark outputs complete
unlock dependent tasks
repeat
```

This is the core of parallel builds.
Ninja already does this well.
Vix’s own scheduler becomes important for a future native build path.

## Jobs

The `-j` or `--jobs` option controls parallelism.

Example:

```bash
vix build -j 8
```

If no job count is provided, Vix can choose a default based on available CPU cores.
Parallelism speeds up compilation when multiple source files can be built independently.

## Diagnostics

`vix build` should not only run commands.
It should make failures readable.
A good diagnostic includes:

```txt
error title
source location
message
hint
code frame when possible
raw compiler output when needed
```

C++ build errors are often noisy.
Vix can improve the developer experience by extracting the useful part.

## Configure errors

Configure errors usually come from:

```txt
invalid CMake
missing packages
bad toolchain
bad CMake variables
generated CMake problems
```

For `vix.app`, configure errors may point to:

```txt
.vix/generated/app/CMakeLists.txt
```

But the root cause may still be in:

```txt
vix.app
```

Good diagnostics should make that relationship clear.

## Compile errors

Compile errors usually come from source code.

Examples:

```txt
missing header
type error
template error
invalid syntax
undefined macro
```

Vix can parse compiler output and show a cleaner message.
The build system should preserve the raw log when needed.

## Link errors

Link errors usually come from:

```txt
missing library
missing symbol
wrong link order
package found but target not linked
duplicate main()
undefined reference
```

For `vix.app`, a common link mistake is:

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

`packages` finds packages.

`links` links targets.

## Build logs

Vix can write configure and build logs.
Logs are important because the terminal output may be filtered or styled.
A full log helps debug hard build failures.
Common logs include:

```txt
configure log
build log
vix log
```

The UI can stay clean while logs preserve details.

## Output style

`vix build` can present progress in a more readable way than raw build output.
A build header may include:

```txt
target
preset
launcher
linker
jobs
```

Example:

```txt
Compiling all (dev)
  * launcher: ccache | linker: mold | jobs: 8
```

The purpose is to show the important build context without flooding the terminal.

## Clean builds

A clean build removes previous build outputs and starts again.

Example:

```bash
vix build --clean
```

This is useful when cache or generated files are stale.
For `vix.app`, cleaning should affect build outputs under the user project directory.
It should not confuse the generated CMake directory with the project root.

## vix.app and build

For `vix.app`, the current build path is:

```txt
load vix.app
validate manifest
generate CMake
create build plan
configure CMake from cmakeSourceDir
build defaultTargetName
```

Example manifest:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Build:

```bash
vix build
```

Conceptual build command:

```bash
cmake --build build-ninja --target hello
```

## Native vix.app build path

The future native path can avoid CMake for simple `vix.app` projects.
The architecture can become:

```txt
vix.app
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

This means Vix would create compile and link tasks directly from the manifest.
CMake would remain available as a fallback and compatibility path.

## Why native build can be faster

A native `vix.app` build can avoid some overhead:

```txt
CMake configure
CMake generate
Ninja file parsing
extra indirection
```

It can also use Vix-specific caches more directly.
But this does not mean C++ compilation becomes free.
It means Vix can avoid work more aggressively when it understands the project directly.

## Compatibility vs speed

The realistic architecture is:

```txt
CMakeLists.txt -> compatibility path
vix.app        -> fast path
```

CMake projects continue to work.

`vix.app` projects become the place where Vix can innovate faster.
This is a better strategy than trying to replace CMake for every C++ project.

## Common build flow

A typical `vix build` flow looks like this:

```txt
1. parse CLI options
2. resolve project
3. resolve preset
4. create build plan
5. compute configure signature
6. generate vix.app CMake if needed
7. configure if needed
8. build selected target
9. import build graph if needed
10. update cache state
11. print result
```

Not every step runs every time.
A no-op build should skip as much as possible.

## Common failure points

Common failures include:

```txt
project not found
invalid vix.app
source file not found
CMake configure failed
package not found
compiler error
linker error
executable not produced
stale build directory
invalid build target
```

A good build command should make each failure point clear.

## Good engineering boundary

`vix build` should not be only a wrapper around CMake.
It should be a build orchestrator.
Today, it can orchestrate:

```txt
CMake
Ninja
presets
logs
diagnostics
cache
generated CMake
build graphs
```

Tomorrow, it can orchestrate:

```txt
native BuildGraph
ObjectCache
ArtifactCache
Scheduler
Link
```

The user command remains the same:

```bash
vix build
```

Only the execution strategy changes.

## Conclusion

`vix build` is the center of the Vix.cpp build experience.
It resolves the project, creates a build plan, configures the build system, builds the target, and prepares for caching and graph-aware execution.
For CMake projects, it keeps compatibility.
For `vix.app` projects, it starts with generated CMake and can later become a native fast path.
The important architectural lesson is:

```txt
project resolution and build planning must be precise
```

Especially for `vix.app`, Vix must distinguish:

```txt
userProjectDir
cmakeSourceDir
defaultTargetName
generatedFromVixApp
```

That separation makes the current build correct.
It also prepares Vix for the next step:

```txt
vix.app -> BuildGraph -> ObjectCache -> Scheduler -> Link
```
