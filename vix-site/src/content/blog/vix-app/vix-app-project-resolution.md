---
title: vix.app Project Resolution
description: How Vix resolves CMakeLists.txt and vix.app projects, why CMake keeps priority, and how project metadata flows into vix build and vix run.
date: 2026-05-17
---

# vix.app Project Resolution

`vix.app` project resolution is the step where Vix decides what kind of project it is working with.

Before Vix can build or run anything, it needs to answer a few questions:

```txt
Where is the project root?
Is this a CMake project?
Is this a vix.app project?
What source directory should CMake use?
What target name should be built?
Where should build directories be created?
```

This resolution step is small, but it is important.

If project resolution is wrong, the build system can use the wrong directory, the wrong target name, or the wrong generated CMake source.

## The resolution rule

Vix uses this rule:

```txt
1. If CMakeLists.txt exists, use CMakeLists.txt.
2. Otherwise, if vix.app exists, use vix.app.
```

This keeps existing CMake projects safe.

A project like this is resolved as a CMake project:

```txt
myapp/
  CMakeLists.txt
  vix.app
  src/
    main.cpp
```

A project like this is resolved as a `vix.app` project:

```txt
myapp/
  vix.app
  src/
    main.cpp
```

CMake has priority because it is the full-control path.

`vix.app` is used only when there is no `CMakeLists.txt`.

## Why CMake has priority

CMake projects can contain arbitrary build logic.

If a `CMakeLists.txt` exists, Vix should not ignore it.

That file may define:

```txt
custom targets
generated sources
install rules
CTest integration
toolchains
package exports
platform branches
dependency setup
```

Using `vix.app` instead would risk breaking the project.

The safe rule is:

```txt
CMakeLists.txt is explicit full control.
vix.app is the simple project path.
```

## The project root

The project root is the directory that contains one of these files:

```txt
CMakeLists.txt
vix.app
```

When Vix starts from a directory, it can search upward until it finds a project root.

Example:

```txt
myapp/
  vix.app
  src/
    main.cpp
    features/
      auth.cpp
```

If the user runs Vix from:

```txt
myapp/src/features/
```

Vix can walk upward and find:

```txt
myapp/vix.app
```

The resolved project root is:

```txt
myapp/
```

## CMake project resolution

For a normal CMake project:

```txt
myapp/
  CMakeLists.txt
  src/
    main.cpp
```

the resolved model is simple:

```txt
project kind:       CMake
user project dir:   myapp/
CMake source dir:   myapp/
CMakeLists path:    myapp/CMakeLists.txt
target name:        usually myapp
generated:          false
```

In this case, the user project directory and the CMake source directory are the same.

Vix can configure CMake with:

```bash
cmake -S myapp -B myapp/build-ninja
```

## vix.app project resolution

For a `vix.app` project:

```txt
myapp/
  vix.app
  src/
    main.cpp
```

Vix resolves the project differently.

The user project directory is still:

```txt
myapp/
```

But the CMake source directory is generated:

```txt
myapp/.vix/generated/app/
```

The resolved model becomes:

```txt
project kind:       vix.app
user project dir:   myapp/
CMake source dir:   myapp/.vix/generated/app/
CMakeLists path:    myapp/.vix/generated/app/CMakeLists.txt
target name:        manifest name
generated:          true
```

So if `vix.app` contains:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

then the default target name is:

```txt
hello
```

not necessarily the project folder name.

## Why target name matters

The target name is important because it is used by:

```txt
vix build
vix run
CMake target selection
executable lookup
diagnostics
artifact identity
```

If the project folder is called:

```txt
hello-project/
```

but the manifest says:

```ini
name = hello
```

then Vix should build and run:

```txt
hello
```

not:

```txt
hello-project
```

This is why `vix.app` resolution must expose the manifest target name.

## The important separation

For `vix.app`, there are two different directories:

```txt
userProjectDir
cmakeSourceDir
```

They must not be confused.

The user project directory is where the real project lives:

```txt
myapp/
```

It contains:

```txt
vix.app
src/
include/
assets/
tests/
```

The CMake source directory is internal:

```txt
myapp/.vix/generated/app/
```

It contains the generated:

```txt
CMakeLists.txt
```

These two paths serve different purposes.

## userProjectDir

`userProjectDir` should be used for user-facing project operations.

Examples:

```txt
build directories
.env lookup
.vix metadata
resources
source path resolution
snapshots
local cache state
exported binaries
watch mode
```

For a `vix.app` project:

```txt
userProjectDir = myapp/
```

That should remain true even though the generated CMake file is somewhere else.

## cmakeSourceDir

`cmakeSourceDir` should be used for CMake configuration.

Examples:

```txt
cmake -S
generated CMake diagnostics
CMakeLists.txt path
CMake configure source directory
```

For a `vix.app` project:

```txt
cmakeSourceDir = myapp/.vix/generated/app/
```

So Vix configures CMake with:

```bash
cmake -S myapp/.vix/generated/app -B myapp/build-ninja
```

not with:

```bash
cmake -S myapp -B myapp/build-ninja
```

because the original project root does not contain a `CMakeLists.txt`.

## The bug this separation avoids

A common mistake is to store only one `projectDir`.

For CMake projects, that works because:

```txt
projectDir = user project dir = CMake source dir
```

But for `vix.app`, that breaks down.

If `projectDir` is changed to:

```txt
myapp/.vix/generated/app/
```

then other systems may accidentally treat the generated directory as the real project.

That can break:

```txt
target name detection
build directory placement
export paths
input snapshots
watch mode
resource paths
.env lookup
cache keys
```

The correct model is to keep both paths.

## A better build plan model

A build plan should distinguish:

```txt
userProjectDir
cmakeSourceDir
defaultTargetName
generatedFromVixApp
```

For a CMake project:

```txt
userProjectDir       = myapp/
cmakeSourceDir       = myapp/
defaultTargetName    = myapp
generatedFromVixApp  = false
```

For a `vix.app` project:

```txt
userProjectDir       = myapp/
cmakeSourceDir       = myapp/.vix/generated/app/
defaultTargetName    = manifest.name
generatedFromVixApp  = true
```

This makes the rest of the build system simpler.

Each operation can choose the correct path.

## Configure uses cmakeSourceDir

CMake configure should use:

```txt
cmakeSourceDir
```

For CMake projects:

```bash
cmake -S myapp -B myapp/build-ninja
```

For `vix.app` projects:

```bash
cmake -S myapp/.vix/generated/app -B myapp/build-ninja
```

This is the only path that should be passed to `cmake -S`.

## Build directories use userProjectDir

Build directories should be created under the user project directory.

For example:

```txt
myapp/build-ninja/
myapp/build-dev/
myapp/build-release/
```

Not under:

```txt
myapp/.vix/generated/app/build-ninja/
```

The generated CMake directory is internal source metadata.

It should not become the visible project root.

## Default target uses manifest name

For `vix.app`, the default target should come from:

```ini
name = hello
```

So `vix build` should build:

```bash
cmake --build build-ninja --target hello
```

not:

```bash
cmake --build build-ninja --target app
```

The generated directory is named `app`, but that is not the target name.

The target name belongs to the manifest.

## vix build project resolution

For `vix build`, project resolution should produce a build plan.

The build plan should contain:

```txt
userProjectDir
cmakeSourceDir
buildDir
configureLog
buildLog
defaultTargetName
generatedFromVixApp
```

Then the build command can do:

```txt
configure:
  cmake -S cmakeSourceDir -B buildDir

build:
  cmake --build buildDir --target defaultTargetName

cache/snapshot/export:
  use userProjectDir
```

This keeps CMake integration and user project handling separate.

## vix run project resolution

`vix run` also needs the same resolved project metadata.

It needs to know:

```txt
where to configure
where to build
which target to build
which executable to run
where the real project lives
```

For `vix.app`, it should use:

```txt
resolved.userProjectDir
resolved.cmakeSourceDir
resolved.targetName
resolved.generated
```

Then it can build the correct target and search for the executable by manifest name.

## Executable lookup

After building, `vix run` needs to find the executable.

For a `vix.app` project:

```ini
name = hello
output_dir = bin
```

Vix should search common locations such as:

```txt
build-ninja/hello
build-ninja/bin/hello
build-ninja/src/hello
```

The lookup should use:

```txt
targetName = hello
```

not the folder name and not the generated directory name.

## Watch mode

Watch mode should watch the real project directory.

For CMake projects:

```txt
watch myapp/
```

For `vix.app` projects:

```txt
watch myapp/
```

It should not watch only:

```txt
myapp/.vix/generated/app/
```

The generated directory does not contain the user’s real source files.

Watch mode belongs to the user project directory.

## Diagnostics

Project resolution also affects diagnostics.

For a generated `vix.app` project, build errors may involve:

```txt
generated CMakeLists.txt
real source files
manifest fields
```

A good diagnostic should show the correct context.

Examples:

```txt
Project directory:
  myapp/

Generated CMake source:
  myapp/.vix/generated/app/

Build directory:
  myapp/build-ninja/
```

This helps engineers understand which layer failed.

## Generated CMake path

When configure fails for a `vix.app` project, the relevant CMake file is:

```txt
.vix/generated/app/CMakeLists.txt
```

So CMake diagnostics should point there.

But source validation errors should point back to:

```txt
vix.app
src/main.cpp
include/
```

The diagnostic layer should not confuse generated files with user-authored files.

## Why AppProjectResolver exists

A dedicated project resolver makes this logic reusable.

Both `vix build` and `vix run` need the same answer:

```txt
What project is this?
Where is the real root?
Where is the CMake source?
What target should I build?
Was this generated from vix.app?
```

If each command implements its own resolution logic, they can drift.

A shared resolver keeps behavior consistent.

## Resolver result

A useful resolver result contains:

```txt
kind
userProjectDir
cmakeSourceDir
cmakeListsPath
appManifestPath
targetName
generated
error
```

For a CMake project:

```txt
kind            = CMake
userProjectDir  = project/
cmakeSourceDir  = project/
cmakeListsPath  = project/CMakeLists.txt
targetName      = project folder name
generated       = false
```

For a `vix.app` project:

```txt
kind            = vix.app
userProjectDir  = project/
cmakeSourceDir  = project/.vix/generated/app/
cmakeListsPath  = project/.vix/generated/app/CMakeLists.txt
appManifestPath = project/vix.app
targetName      = manifest.name
generated       = true
```

## Search behavior

The resolver can start from:

```txt
current directory
a file path
a directory passed with --dir
```

Then it searches upward for:

```txt
CMakeLists.txt
vix.app
```

The first directory containing either file becomes the project root.

Inside that root, CMake has priority.

## Example: current directory

Project:

```txt
hello/
  vix.app
  src/
    main.cpp
```

Command:

```bash
cd hello
vix build
```

Resolved result:

```txt
kind            = vix.app
userProjectDir  = hello/
cmakeSourceDir  = hello/.vix/generated/app/
targetName      = manifest.name
```

## Example: nested directory

Project:

```txt
hello/
  vix.app
  src/
    features/
      auth.cpp
```

Command:

```bash
cd hello/src/features
vix build
```

The resolver walks upward and finds:

```txt
hello/vix.app
```

Resolved root:

```txt
hello/
```

## Example: CMake wins

Project:

```txt
hello/
  CMakeLists.txt
  vix.app
  src/
    main.cpp
```

Resolved result:

```txt
kind            = CMake
userProjectDir  = hello/
cmakeSourceDir  = hello/
generated       = false
```

The `vix.app` file is ignored for project resolution.

## Failure cases

Resolution can fail when neither file exists.

Example:

```txt
empty-folder/
  src/
    main.cpp
```

Command:

```bash
vix build
```

Error:

```txt
Unable to determine the project directory.
Missing CMakeLists.txt or vix.app.
```

The fix is to add either:

```txt
CMakeLists.txt
```

or:

```txt
vix.app
```

## Manifest load failure

For `vix.app`, resolution includes loading the manifest.

This can fail when:

```txt
name is missing
sources are missing
type is invalid
standard is invalid
array syntax is malformed
unknown field is present
```

In that case, project resolution should return a structured error.

The command should display that error clearly and stop before CMake runs.

## Generated CMake failure

After the manifest is loaded, Vix generates the internal CMake project.

Generation can fail when:

```txt
source files do not exist
resource paths are invalid
output paths are invalid
package syntax is invalid
target name is invalid
```

These are still manifest-level or generation-level errors.

They should be reported before the configure/build stage when possible.

## Why this is important for native builds

Project resolution is also the foundation for future native `vix.app` builds.

The future build path may be:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

That path still needs the same resolved metadata:

```txt
userProjectDir
targetName
sources
include_dirs
defines
output_dir
resources
```

So clean project resolution is not only about generated CMake.

It is also preparation for a native build engine.

## The clean architecture

A clean architecture has three layers:

```txt
Project resolution
  decides what project this is

Build planning
  decides what to configure, build, cache, and run

Execution
  runs CMake, Ninja, native tasks, or the final executable
```

`vix.app` should enter the system at the resolution layer.

It should not be patched into every command separately.

## Practical rule for engineers

When changing Vix project resolution, keep this rule in mind:

```txt
CMake source directory is not always the user project directory.
Target name is not always the project folder name.
```

This is the core lesson from `vix.app`.

For normal CMake projects, those values often look the same.

For generated projects, they are different.

## Conclusion

`vix.app` project resolution is about keeping identities separate.

A `vix.app` project has:

```txt
a real user project directory
a generated CMake source directory
a manifest-defined target name
a generated flag
```

CMake projects remain the full-control path.

`vix.app` projects become the simple path.

The resolver connects both models through one consistent result.

That consistency lets `vix build`, `vix run`, diagnostics, caching, and future native builds all reason about the project the same way.
