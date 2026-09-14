---
title: vix run CMake Fallback
description: How vix run can fall back to generated CMake when direct script execution is not enough, while keeping the user command simple.
date: 2026-05-17
---

# vix run CMake Fallback

`vix run` should make the simple case fast.

For a single file, the ideal path is direct:

```txt
main.cpp
  -> compile
  -> link
  -> run
```

But not every script is simple.

Some files need compiled modules, external packages, generated build metadata, or more complex linking.

That is where the CMake fallback exists.

The user still writes:

```bash
vix run main.cpp
```

But internally, Vix can choose a more powerful build path when direct execution is not enough.

## The problem

A direct script runner is good for simple files.

Example:

```cpp
#include <vix.hpp>

int main()
{
  vix::print("hello");
  return 0;
}
```

This can be compiled directly.

But a script may use features that need more than one compiler command.

Examples:

```txt
compiled Vix modules
registry dependencies
external libraries
CMake packages
platform-specific link flags
generated build metadata
```

In those cases, direct compilation can fail or become too fragile.

## The goal

The goal of the fallback is:

```txt
keep the command simple
use a stronger build path internally when needed
```

The user should not need to manually create a `CMakeLists.txt` just because a script needs a compiled dependency.

The command should stay:

```bash
vix run main.cpp
```

Vix decides whether direct mode is enough or whether fallback is needed.

## Direct path

The direct path is:

```txt
source file
  -> compiler
  -> linker
  -> executable
  -> run
```

This is the fast path.

It is best for:

```txt
single-file programs
simple examples
local experiments
header-only usage
small tools
```

The direct path has minimal overhead.

## Fallback path

The fallback path is:

```txt
source file
  -> generated CMake project
  -> CMake configure
  -> CMake build
  -> executable
  -> run
```

This path has more overhead, but it is more compatible.

It can use CMake’s normal machinery for:

```txt
targets
packages
linking
compiled modules
toolchains
Ninja
compiler launchers
```

## Why CMake fallback exists

CMake fallback exists because C++ linking is not always trivial.

A single source file can depend on compiled code.

For example, this may look like a script:

```cpp
#include <vix/kv.hpp>

int main()
{
  // use a compiled Vix module
}
```

But if `vix::kv` requires a compiled library, then direct mode needs to know how to link that library.

If the dependency graph becomes complex, CMake fallback is safer.

## Fallback should be internal

The fallback should not change the user-facing workflow.

The user should not need to know whether Vix used:

```txt
direct compile
```

or:

```txt
generated CMake
```

unless they ask for verbose output.

The command stays:

```bash
vix run main.cpp
```

Verbose output can show the chosen path:

```txt
script mode: CMake fallback
```

## Generated script project

When fallback is needed, Vix can generate a temporary CMake project for the script.

A possible generated layout:

```txt
.vix/
  run/
    generated/
      main/
        CMakeLists.txt
```

The exact path is an implementation detail.

The important point is:

```txt
the generated project is internal
the source file remains the user input
```

The generated CMake file should not become the user’s project.

## Source of truth

In fallback mode, the source of truth is still:

```txt
main.cpp
```

not the generated CMake file.

The generated CMake exists only to build the script.

If the user needs a real project, they should create:

```txt
vix.app
```

or:

```txt
CMakeLists.txt
```

Fallback is for script mode, not for converting scripts into permanent projects.

## Conceptual generated CMake

For a simple script:

```bash
vix run main.cpp
```

the generated CMake can be conceptually similar to:

```cmake
cmake_minimum_required(VERSION 3.24)

project(vix_script LANGUAGES CXX)

add_executable(vix_script
  /absolute/path/to/main.cpp
)

target_compile_features(vix_script PRIVATE cxx_std_20)
```

For scripts using compiled modules, Vix can add more generated logic.

For example:

```cmake
target_link_libraries(vix_script PRIVATE
  vix::kv
)
```

The exact generated output can evolve.

## When fallback should happen

Fallback should happen when direct mode is not enough.

Possible triggers:

```txt
compiled Vix module required
registry dependency required
external package required
direct link failed with known recoverable cause
user requested CMake fallback
platform requires generated build metadata
```

The first implementation can start with explicit or conservative rules.

## Direct first, fallback second

A practical strategy is:

```txt
try direct mode
if direct mode is supported:
  run direct
else:
  use CMake fallback
```

Another strategy is:

```txt
inspect required dependencies first
choose direct or fallback before compiling
```

Both can work.

The important rule is correctness.

Do not keep retrying blindly if the failure is a real code error.

## Do not fallback for source errors

If the compiler reports a source code error, fallback will not help.

Example:

```cpp
int main()
{
  this_function_does_not_exist();
}
```

That is not a direct-mode limitation.

That is a compile error.

Vix should show the error instead of trying a fallback.

Fallback is useful for build model limitations, not for invalid C++ code.

## Do not hide real linker errors

Some linker errors mean the code or dependencies are wrong.

Example:

```txt
undefined reference to user_function()
```

If this is caused by a missing user source file, CMake fallback may not fix it.

Fallback should not hide real errors.

It should be used when Vix knows the direct runner lacks needed build information.

## Good fallback reasons

Good reasons to fallback include:

```txt
compiled Vix module detected
package metadata requires CMake
registry dependency has CMake integration
direct runner cannot resolve required link target
script uses features that require generated target setup
```

Bad reasons to fallback include:

```txt
syntax error
missing semicolon
undefined user function
duplicate main
invalid C++ code
```

## Runtime arguments stay the same

Fallback should not change runtime argument behavior.

This:

```bash
vix run main.cpp -- --name Gaspard
```

should pass:

```txt
--name Gaspard
```

to the program whether Vix uses direct mode or CMake fallback.

The build path should not affect the runtime interface.

## Exit codes stay the same

Fallback should preserve exit behavior.

If the program returns:

```cpp
return 7;
```

then `vix run` should report or return that exit code consistently.

The user should not see a different result just because fallback was used.

## Interactive programs

Fallback must also support interactive programs.

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

If this runs through CMake fallback, stdin should still work.

The generated build path should not break the runtime process.

## Working directory

Fallback should preserve predictable working directory behavior.

The script is user-authored.

The generated CMake directory is internal.

So the program should not accidentally run from:

```txt
.vix/run/generated/...
```

unless that behavior is explicitly intended.

A reasonable default is to run from the current working directory or the source file directory.

The behavior should be consistent with direct script mode.

## Build directory

Fallback needs a build directory.

Possible layout:

```txt
.vix/run/build/
```

or:

```txt
.vix/cache/run/
```

The build directory should be managed by Vix.

It should not pollute the user’s source directory with:

```txt
CMakeCache.txt
CMakeFiles/
build.ninja
```

The user asked to run a file, not to create a visible project.

## Logs

Fallback should keep logs.

Useful logs include:

```txt
generated CMake configure log
build log
compiler output
linker output
```

When fallback fails, logs help debug the issue.

Verbose mode can show where the generated files and logs are stored.

## Diagnostics

Diagnostics should point to user files when possible.

If `main.cpp` has a compile error, the diagnostic should point to:

```txt
main.cpp
```

not only to:

```txt
.vix/run/generated/CMakeLists.txt
```

If generated CMake fails, the diagnostic can mention the generated file, but should explain the script context.

## Fallback configure errors

Configure errors can happen when:

```txt
a package is missing
a generated target is invalid
a CMake variable is wrong
a toolchain is unavailable
```

These are fallback build errors.

Vix should show enough context:

```txt
script file: main.cpp
fallback: generated CMake
configure log: ...
```

## Fallback build errors

Build errors can happen during compilation or linking.

Compilation errors should point to the script source.

Linking errors should show the missing symbol or target.

If the failure is due to a missing compiled dependency, Vix can suggest installing or linking it.

## Generated CMake should be readable

Generated CMake is internal, but it should still be readable.

Readable generated files help engineers debug:

```txt
which source was used
which standard was selected
which libraries were linked
which packages were found
which target was generated
```

Generated files should not be mysterious.

## Cache behavior

Fallback builds can use cache too.

The generated CMake path can still produce:

```txt
compile_commands.json
build.ninja
dependency files
```

Vix can import those files and use:

```txt
ObjectCache
ArtifactCache
BuildGraph
```

So fallback is not necessarily slow every time.

It has more setup overhead, but repeated builds can still improve.

## Script identity in fallback mode

The fallback project should have a stable identity.

Inputs include:

```txt
script source path
script source content
compiler identity
C++ standard
selected Vix modules
dependency metadata
runtime build options
target triple
generated CMake content
```

This identity helps decide whether the fallback project needs reconfigure or rebuild.

## Reconfigure avoidance

If the generated CMake content did not change, Vix should avoid reconfiguring.

The fallback can store a configure signature.

Inputs include:

```txt
generated CMake content
CMake variables
compiler
toolchain
dependency metadata
preset or build type
```

If unchanged, configure can be skipped.

## Object reuse

Even in fallback mode, the script source can compile to an object file.

If the compile identity matches, Vix can restore it from ObjectCache.

This makes repeated script runs faster.

## Artifact reuse

If the whole script executable was already built with the same identity, Vix can reuse it.

This is especially useful for repeated runs of the same script.

The artifact identity must include all build-relevant inputs.

## Relationship with registry dependencies

If Vix supports registry dependencies for scripts, fallback can be the integration point.

Example flow:

```txt
script imports or uses dependency
Vix resolves dependency metadata
generated CMake links dependency
script builds
script runs
```

This keeps the direct runner simple while still allowing richer scripts.

## Relationship with vix.app

`vix.app` and script fallback are different features.

`vix.app` is for projects.

Script fallback is for single-file execution.

But both can use generated CMake internally.

The difference is source of truth:

```txt
vix.app project:
  source of truth = vix.app

script fallback:
  source of truth = main.cpp + run options
```

## Relationship with project mode

Project mode should not use script fallback.

If the user runs:

```bash
vix run
```

inside a project, Vix should use project resolution.

If the user runs:

```bash
vix run main.cpp
```

Vix should use script mode.

The explicit source file decides script mode.

## Explicit fallback flag

It may be useful to let users force fallback.

Example design:

```bash
vix run main.cpp --cmake
```

or:

```bash
vix run main.cpp --fallback cmake
```

This can help debug direct runner problems.

The exact flag can evolve.

## Explicit no-fallback flag

It may also be useful to disable fallback.

Example design:

```bash
vix run main.cpp --no-fallback
```

This helps test the direct runner.

It also lets advanced users see whether a script can run without generated build infrastructure.

## Verbose output

Verbose mode should show the selected strategy.

Example:

```txt
Running script: main.cpp
Mode: CMake fallback
Generated source: .vix/run/generated/main/
Build directory: .vix/run/build/main/
Target: main
```

This makes fallback behavior transparent without making normal output noisy.

## Common fallback mistakes

### Running from generated directory

Wrong:

```txt
program working directory = .vix/run/generated/main/
```

unless explicitly intended.

Correct:

```txt
working directory remains predictable for the user
```

### Treating generated CMake as user project

Wrong:

```txt
source of truth = generated CMakeLists.txt
```

Correct:

```txt
source of truth = main.cpp and run options
```

### Falling back on real compile errors

Wrong:

```txt
syntax error -> fallback to CMake
```

Correct:

```txt
syntax error -> show diagnostic
```

### Hiding linker problems

Wrong:

```txt
all linker errors trigger fallback silently
```

Correct:

```txt
fallback only when the missing link is a known direct-mode limitation
```

## Good first implementation

A good first CMake fallback can support:

```txt
generate temporary CMakeLists.txt
configure with Ninja
build script executable
run with preserved stdin/stdout/stderr
forward runtime arguments
store logs
reuse configure when unchanged
fallback only for known dependency cases
```

This gives Vix a reliable compatibility layer for scripts.

## Later improvements

Later improvements can include:

```txt
dependency-aware fallback selection
compiled module auto-linking
registry dependency integration
object cache import from fallback builds
artifact cache for script executables
better diagnostics from generated CMake
explicit fallback flags
explainable fallback reasons
```

The fallback can grow without changing the user command.

## Engineering principle

The fallback should follow this principle:

```txt
direct when possible
generated CMake when necessary
clear diagnostics always
```

This keeps script mode fast for simple cases and powerful for complex ones.

## Conclusion

The CMake fallback exists because not every C++ script can be built safely with one direct compiler command.

Some scripts need compiled modules, packages, or richer build metadata.

Instead of forcing the user to create a project, Vix can generate an internal CMake project and build the script through the compatibility path.

The user still runs:

```bash
vix run main.cpp
```

The implementation chooses the right path:

```txt
simple script -> direct runner
complex script -> CMake fallback
```

That keeps C++ script execution simple from the outside while preserving the power needed for real-world dependencies.
