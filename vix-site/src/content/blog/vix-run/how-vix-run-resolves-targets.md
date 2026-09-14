---
title: How vix run Resolves Targets
description: How vix run decides what to execute across script mode, CMake project mode, and vix.app project mode.
date: 2026-05-17
---

# How vix run Resolves Targets

`vix run` is the command that turns a source file or project into something executable, then runs it.

It looks simple from the outside:

```bash
vix run
```

or:

```bash
vix run main.cpp
```

But internally, `vix run` has to answer several questions:

```txt
Is this a single C++ file?
Is this a project?
Is the project using CMakeLists.txt?
Is the project using vix.app?
What target should be built?
Where is the executable?
Which arguments belong to Vix?
Which arguments belong to the program?
```

Target resolution is the part of `vix run` that answers these questions.

## Two main modes

`vix run` has two major modes:

```txt
script mode
project mode
```

Script mode runs a single C++ file.

Project mode runs a CMake or `vix.app` project.

Example script mode:

```bash
vix run main.cpp
```

Example project mode:

```bash
vix run
```

from inside a project directory.

## Script mode

Script mode is used when the input is a C++ source file.

Example:

```bash
vix run main.cpp
```

In this mode, Vix treats the file as the entry point.

The target identity comes from the source file.

Conceptually:

```txt
input file: main.cpp
script target: main
```

Vix can compile the file, link the required libraries, then execute the produced binary.

## Project mode

Project mode is used when Vix detects a project root.

A project root contains one of these files:

```txt
CMakeLists.txt
vix.app
```

Resolution order:

```txt
1. CMakeLists.txt
2. vix.app
```

If a `CMakeLists.txt` exists, Vix uses the CMake project.

If no `CMakeLists.txt` exists but `vix.app` exists, Vix uses the `vix.app` project.

## Why target resolution matters

Running a project is not only about building.

After building, Vix needs to find the executable.

That requires a target name.

For example:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

The executable target is:

```txt
hello
```

So `vix run` should build and search for:

```txt
hello
```

not necessarily the folder name.

## The old simple assumption

For many CMake projects, Vix can guess the target from the project folder.

Example:

```txt
hello/
  CMakeLists.txt
  src/
    main.cpp
```

Folder name:

```txt
hello
```

Target name:

```txt
hello
```

In this case, guessing from the folder works.

But this assumption breaks when the target name differs from the directory name.

## vix.app makes target identity explicit

With `vix.app`, the manifest declares the target name directly:

```ini
name = server
```

The folder could be named:

```txt
backend-app/
```

But the target is:

```txt
server
```

So `vix run` must use the resolved target name from the manifest.

It should not guess from:

```txt
project directory name
generated CMake directory name
```

## Project resolution result

A good project resolver returns enough metadata for `vix run`.

For a CMake project:

```txt
kind            = CMake
userProjectDir  = project/
cmakeSourceDir  = project/
cmakeListsPath  = project/CMakeLists.txt
targetName      = project folder name or resolved target
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

`vix run` should use this resolved result instead of duplicating project detection logic.

## userProjectDir

`userProjectDir` is the real project root.

It contains:

```txt
CMakeLists.txt
```

or:

```txt
vix.app
src/
include/
assets/
```

For `vix.app`, this remains the user project root even though the generated CMake file lives elsewhere.

`vix run` should use `userProjectDir` for:

```txt
working directory decisions
watch mode
project-relative operations
calling vix build
user-facing diagnostics
```

## cmakeSourceDir

`cmakeSourceDir` is the directory passed to CMake configure.

For CMake projects:

```txt
cmakeSourceDir = project/
```

For `vix.app` projects:

```txt
cmakeSourceDir = project/.vix/generated/app/
```

`vix run` usually should not treat this as the user project root.

It is only the active CMake source directory.

## targetName

`targetName` is the target to build and run.

For `vix.app`, this comes from:

```ini
name = ...
```

Example:

```ini
name = api_server
```

Then `vix run` should build:

```txt
api_server
```

and search for an executable named:

```txt
api_server
```

or platform equivalent:

```txt
api_server.exe
```

on Windows.

## generated

The `generated` flag tells Vix whether the active CMake project came from `vix.app`.

This helps diagnostics.

For example, `vix run` can show different context:

```txt
Project directory:
  app/

Generated CMake source:
  app/.vix/generated/app/
```

It also helps avoid using generated directories for user-facing operations.

## Running a CMake project

For a normal CMake project:

```txt
hello/
  CMakeLists.txt
  src/
    main.cpp
```

`vix run` can do:

```txt
resolve project
build target
find executable
run executable
```

Conceptually:

```bash
vix build --dir hello
./build-ninja/hello
```

The actual implementation may call internal build functions or invoke the build pipeline directly, but the logic is the same.

## Running a vix.app project

For a `vix.app` project:

```txt
hello/
  vix.app
  src/
    main.cpp
```

with:

```ini
name = hello
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

`vix run` should do:

```txt
resolve vix.app
generate internal CMake if needed
build target hello
find executable hello
run executable
```

The generated CMake directory should not become the user project root.

## Build before run

`vix run` should ensure the target is built before execution.

Conceptually:

```txt
vix run
  -> resolve project
  -> build selected target
  -> resolve executable path
  -> execute binary
```

This is why `vix run` depends on correct `vix build` planning.

If `vix build` builds the wrong target, `vix run` will search for the wrong executable.

## Executable lookup

After building, `vix run` needs to find the executable.

Common locations include:

```txt
build-ninja/<target>
build-ninja/bin/<target>
build-ninja/src/<target>
```

For Windows, the executable may include:

```txt
.exe
```

So for target:

```txt
hello
```

Vix may search for:

```txt
hello
hello.exe
```

depending on platform.

## output_dir and executable lookup

`vix.app` supports:

```ini
output_dir = bin
```

This means the executable may be under:

```txt
build-ninja/bin/
```

Example:

```ini
name = server
type = executable
standard = c++20
output_dir = bin

sources = [
  src/main.cpp,
]
```

After build, Vix should search:

```txt
build-ninja/bin/server
```

as well as other common locations.

## Why recursive fallback exists

Some build systems place outputs in less obvious directories.

A fallback recursive search can help when the executable is not in the expected locations.

However, recursive search should still be guided by:

```txt
targetName
```

It should not run a random executable just because it exists.

Target name keeps the search safe and predictable.

## Running libraries

`vix run` is mainly for executable targets.

If a project is:

```ini
name = mathlib
type = static
```

there may be no executable to run.

The correct command is:

```bash
vix build
```

To run something for a library, use a test or example executable:

```txt
tests/vix.app
examples/basic/vix.app
```

Then run:

```bash
cd tests
vix run
```

or:

```bash
cd examples/basic
vix run
```

## Runtime arguments

`vix run` must separate Vix arguments from program arguments.

For example:

```bash
vix run main.cpp --run --name Gaspard
```

or for project mode:

```bash
vix run -- --name Gaspard
```

The exact boundary depends on the command design, but the principle is important:

```txt
arguments before the boundary configure Vix
arguments after the boundary go to the program
```

Without a clear boundary, Vix may consume arguments intended for the user program.

## Script mode target resolution

In script mode:

```bash
vix run main.cpp
```

Vix can derive the target name from the file:

```txt
main
```

The compiled output can be stored in a Vix build/cache directory.

The exact path is an implementation detail.

What matters is:

```txt
the source file is the entry point
the output is executable
the program receives runtime arguments
```

## Project mode target resolution

In project mode:

```bash
vix run
```

Vix must resolve a project first.

Then it uses the project target.

For CMake:

```txt
targetName = project default target
```

For `vix.app`:

```txt
targetName = manifest.name
```

This is the main difference.

## Explicit build target

A user may provide an explicit build target.

Example:

```bash
vix run --build-target server
```

In that case, the explicit target should take priority over the default target.

Resolution rule:

```txt
if --build-target is provided:
  use --build-target
else:
  use resolved targetName
```

This is useful for CMake projects with multiple targets.

For `vix.app`, there is normally one target, so the manifest name is usually enough.

## Watch mode

Watch mode should watch the real project directory.

For CMake projects:

```txt
watch project/
```

For `vix.app` projects:

```txt
watch project/
```

It should not watch only:

```txt
project/.vix/generated/app/
```

because that directory contains generated files, not the user’s real source code.

For `vix.app`, watch mode should observe:

```txt
vix.app
src/
include/
assets/
```

## Generated CMake and run

For a `vix.app` project, generated CMake is part of the build process.

But `vix run` should still think in terms of the user project.

The important values are:

```txt
userProjectDir  -> where the project lives
cmakeSourceDir  -> where generated CMake lives
targetName      -> what to build and run
```

This keeps `vix run` aligned with `vix build`.

## CMake presets

For normal CMake projects, `vix run` may use CMake presets when available.

For `vix.app`, presets are less relevant because the CMake project is generated internally.

The important rule is:

```txt
normal CMake project -> can use project CMake presets
vix.app project      -> use generated CMake and Vix build planning
```

## Error: project not found

If Vix cannot find:

```txt
CMakeLists.txt
```

or:

```txt
vix.app
```

project mode cannot run.

Example error:

```txt
Unable to determine the project directory.
Missing CMakeLists.txt or vix.app.
```

Fix:

```txt
run vix from a project directory
or create vix.app
or create CMakeLists.txt
```

## Error: executable not found

This can happen when:

```txt
the target is a library
the build failed
the target name is wrong
output_dir is unexpected
the executable was not produced
```

For `vix.app`, check:

```ini
name = ...
type = executable
output_dir = ...
```

If the type is:

```ini
type = static
```

then `vix run` has no executable to run.

## Error: wrong target name

This can happen if the build system guesses from the folder name instead of using the manifest name.

Example:

```txt
folder: hello-project
manifest name: hello
```

Correct target:

```txt
hello
```

Wrong target:

```txt
hello-project
```

The fix is to use the resolved target name from project resolution.

## Error: generated directory used as project root

For `vix.app`, this is wrong:

```txt
project root = .vix/generated/app
```

That can break:

```txt
watch mode
runtime working directory
target guessing
exports
diagnostics
```

The project root should be:

```txt
userProjectDir
```

The generated directory should be:

```txt
cmakeSourceDir
```

## Runtime working directory

The runtime working directory affects relative file access.

If the program opens:

```cpp
std::ifstream file("config/app.json");
```

then it depends on where the process starts.

For apps with resources, this matters.

A `vix.app` project may copy resources next to the executable:

```txt
build-ninja/bin/config/app.json
```

but the program may run from the project root unless Vix changes the working directory.

This is a design choice `vix run` should make deliberately.

## Running with resources

If the manifest says:

```ini
output_dir = bin

resources = [
  "data/config.json=config/config.json",
]
```

then the resource may be copied to:

```txt
build-ninja/bin/config/config.json
```

`vix run` should either:

```txt
run from the executable directory
```

or document the runtime working directory clearly.

The important point is predictability.

## Project mode should not duplicate build logic

`vix run` should not reinvent `vix build`.

It should reuse the same project resolution and build planning rules.

The flow should be:

```txt
resolve project
call build pipeline with target
resolve executable
run executable
```

If `vix run` and `vix build` resolve projects differently, bugs appear.

Especially with `vix.app`.

## Shared resolver

A shared resolver should answer:

```txt
kind
userProjectDir
cmakeSourceDir
targetName
generated
cmakeListsPath
appManifestPath
```

Both `vix build` and `vix run` should use this same model.

That keeps behavior consistent.

## Good output

When verbose mode is enabled, `vix run` can show:

```txt
Project:
  kind: vix.app
  root: /path/to/project
  generated CMake: /path/to/project/.vix/generated/app
  target: hello

Build:
  preset: dev-ninja
  directory: build-ninja

Run:
  executable: build-ninja/bin/hello
```

This makes target resolution visible.

## Why this matters

Most command-line tools feel simple because the hard decisions are hidden.

But hidden decisions still need to be correct.

`vix run` should feel like:

```bash
vix run
```

But internally it must correctly handle:

```txt
single-file scripts
CMake projects
vix.app projects
generated CMake
output directories
runtime arguments
watch mode
```

That is why target resolution matters.

## Future native vix.app builds

In the future, `vix.app` may build natively:

```txt
vix.app
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

`vix run` should not need a major redesign for that.

If the resolver still provides:

```txt
targetName
buildDir
output path
project root
```

then the execution step stays similar.

Only the build engine changes underneath.

## Conclusion

`vix run` resolves targets by first deciding whether it is running a single file or a project.

For projects, it resolves either:

```txt
CMakeLists.txt
```

or:

```txt
vix.app
```

For `vix.app`, the manifest name is the target name.

That target name must drive both the build step and the executable lookup.

The key rule is:

```txt
do not guess from the generated directory
do not guess from the folder when the manifest gives a name
```

A clean `vix run` model uses shared project resolution, builds the correct target, finds the executable, and runs it with a clear argument boundary.
