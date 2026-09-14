---
title: vix.app Build Planning
description: How vix.app changes the way Vix plans builds by separating the user project directory, generated CMake source directory, target name, and future native build path.
date: 2026-05-17
---

# vix.app Build Planning

`vix.app` changes an important part of `vix build`.

Before `vix.app`, a project was usually a CMake project.

That meant one directory often represented everything:

```txt
project directory
CMake source directory
build identity
default target name
```

For many CMake projects, this works because the project root contains:

```txt
CMakeLists.txt
```

and the build system can configure directly from that directory.

With `vix.app`, the model changes.

The user project directory and the CMake source directory are no longer always the same thing.

## The key distinction

For a normal CMake project:

```txt
userProjectDir = cmakeSourceDir
```

For a `vix.app` project:

```txt
userProjectDir = project root
cmakeSourceDir = project/.vix/generated/app
```

This distinction is the foundation of correct build planning.

If Vix confuses these two paths, the build may still work in small cases, but other systems can break:

```txt
target detection
build directories
snapshots
artifact cache
watch mode
export paths
diagnostics
vix run executable lookup
```

So `vix.app` requires a more explicit build plan.

## What build planning means

Build planning is the phase where Vix decides:

```txt
which project is being built
which preset is active
where the build directory is
which source directory CMake should configure
which target should be built
which logs should be written
whether reconfigure is needed
which cache state applies
which executable should be resolved after build
```

It is the bridge between project resolution and build execution.

Project resolution answers:

```txt
What kind of project is this?
```

Build planning answers:

```txt
How should this project be built?
```

## The old simple assumption

The old assumption was:

```txt
plan.projectDir is the project
```

That works when:

```txt
plan.projectDir/CMakeLists.txt
```

exists.

Then Vix can configure with:

```bash
cmake -S plan.projectDir -B plan.buildDir
```

The default target can be guessed from:

```txt
plan.projectDir.filename()
```

The executable can be searched by that name.

For a normal CMake project, this is acceptable.

## Why that breaks with vix.app

For a `vix.app` project, the real project root contains:

```txt
vix.app
src/
include/
assets/
```

But it does not contain:

```txt
CMakeLists.txt
```

Vix generates that file under:

```txt
.vix/generated/app/CMakeLists.txt
```

So if the build plan stores only one `projectDir`, there are two bad choices.

### Bad choice 1: projectDir is the user project

If:

```txt
plan.projectDir = myapp/
```

then CMake configure would try:

```bash
cmake -S myapp -B myapp/build-ninja
```

But `myapp/` has no `CMakeLists.txt`.

The configure step fails.

### Bad choice 2: projectDir is the generated CMake directory

If:

```txt
plan.projectDir = myapp/.vix/generated/app/
```

then CMake configure works:

```bash
cmake -S myapp/.vix/generated/app -B myapp/build-ninja
```

But now other parts of the build may think the generated directory is the real project.

That can cause problems.

The default target may become:

```txt
app
```

instead of the manifest name.

Exports may go to:

```txt
.vix/generated/app/
```

instead of the user project root.

Snapshots may inspect the wrong directory.

Watch mode may watch generated files instead of source files.

The fix is to stop using one path for two meanings.

## The correct build plan

A correct build plan separates the identities:

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

This is the clean model.

Every build operation can now use the correct value.

## userProjectDir

`userProjectDir` is the real project root.

It should be used for user-facing project operations.

Examples:

```txt
build directory placement
local metadata
.env lookup
watch mode
project snapshots
artifact cache state
exported binaries
resource source paths
user diagnostics
```

For `vix.app`, this remains:

```txt
myapp/
```

even though CMake configures from:

```txt
myapp/.vix/generated/app/
```

## cmakeSourceDir

`cmakeSourceDir` is the directory passed to:

```bash
cmake -S
```

For a CMake project:

```txt
cmakeSourceDir = myapp/
```

For a `vix.app` project:

```txt
cmakeSourceDir = myapp/.vix/generated/app/
```

Only the configure step should need this path directly.

Conceptually:

```txt
configure:
  use cmakeSourceDir

build state:
  use userProjectDir
```

## defaultTargetName

`defaultTargetName` is the target Vix builds when the user does not pass an explicit target.

For CMake projects, it can usually be:

```txt
project folder name
```

For `vix.app`, it must be:

```txt
manifest.name
```

Example:

```txt
folder: hello-project/
manifest name: hello
```

The target should be:

```txt
hello
```

not:

```txt
hello-project
```

and not:

```txt
app
```

This matters for:

```txt
cmake --build --target
vix run executable lookup
artifact names
diagnostic messages
```

## generatedFromVixApp

`generatedFromVixApp` tells the build system that the active CMake source was generated.

This helps with diagnostics.

For example, Vix can print:

```txt
Using project directory:
  myapp/

Using generated CMake source:
  myapp/.vix/generated/app/
```

It also helps commands avoid treating generated paths as user-authored paths.

## Build directory placement

Build directories should stay under the user project directory.

For example:

```txt
myapp/build-ninja/
myapp/build-dev/
myapp/build-release/
```

They should not be placed under:

```txt
myapp/.vix/generated/app/build-ninja/
```

The generated CMake directory is not the project root.

It is internal metadata.

## Configure planning

The configure command should use:

```txt
cmakeSourceDir
```

Conceptually:

```bash
cmake -S <cmakeSourceDir> -B <buildDir>
```

For CMake:

```bash
cmake -S myapp -B myapp/build-ninja
```

For `vix.app`:

```bash
cmake -S myapp/.vix/generated/app -B myapp/build-ninja
```

This is the only place where the generated CMake source directory must be treated as the source directory.

## Build planning

The build command should use:

```txt
buildDir
defaultTargetName
```

Conceptually:

```bash
cmake --build <buildDir> --target <defaultTargetName>
```

For `vix.app`:

```bash
cmake --build myapp/build-ninja --target hello
```

if the manifest says:

```ini
name = hello
```

The build target should not be derived from:

```txt
.vix/generated/app
```

because that directory name is not the application target.

## Reconfigure planning

A build system needs to decide when CMake configure must run again.

For `vix.app`, the configure signature should include the generated CMake input and the manifest state.

Important inputs include:

```txt
vix.app content
generated CMake content
CMake variables
preset
toolchain
compiler launcher
linker settings
target triple
package configuration
```

If the manifest changes, Vix should regenerate the internal CMake project and reconfigure when necessary.

## Project fingerprint

A project fingerprint helps decide whether a build can be reused.

For CMake projects, the fingerprint can include CMake configuration files.

For `vix.app`, the fingerprint should include:

```txt
vix.app
generated CMakeLists.txt
important build options
```

But this should not make Vix forget the real project root.

The fingerprint may inspect the CMake source directory, but cache state and build outputs still belong to the user project directory.

## Snapshots

Snapshots should describe user project inputs.

For `vix.app`, this should start from:

```txt
userProjectDir
```

not:

```txt
cmakeSourceDir
```

The generated CMake directory is derived output.

The source of truth is the manifest and project files.

A snapshot should care about:

```txt
vix.app
src/
include/
resources
lock files
dependency metadata
```

not only generated CMake.

## Artifact cache planning

Artifact cache identity should use stable project identity.

For a `vix.app` project, the target identity should come from:

```txt
defaultTargetName
```

not:

```txt
cmakeSourceDir.filename()
```

If `cmakeSourceDir` is:

```txt
.vix/generated/app
```

then the filename is:

```txt
app
```

That is not a useful artifact name.

The manifest target name is the correct identity.

## Object cache planning

The object cache should be based on the actual compile inputs:

```txt
source file content
header dependencies
compiler identity
compiler flags
include directories
defines
target triple
build type
```

`vix.app` can help here because it gives Vix direct structured data.

In the current generated CMake path, Vix can still import compile commands.

In a future native path, Vix can create compile tasks directly from the manifest.

## Graph planning

A build graph represents tasks and dependencies.

For a generated CMake project, Vix can import:

```txt
compile_commands.json
build.ninja
dependency files
```

For a future native `vix.app` build, Vix can generate the graph directly from:

```txt
sources
include_dirs
defines
compile_options
link_options
links
resources
```

That is why the manifest is important.

It is not only a configuration shortcut.

It can become build graph input.

## vix.app as a future native build path

The current path is:

```txt
vix.app
  -> generated CMake
  -> CMake configure
  -> CMake build
```

The future path can be:

```txt
vix.app
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

This is possible because `vix.app` is declarative and limited.

Vix does not have to interpret arbitrary CMake logic.

It can directly create build tasks.

## Why native planning matters

CMake is powerful, but it has overhead:

```txt
configure step
generate step
build system files
cache state
indirection through generated rules
```

For many projects, this is acceptable.

But for simple `vix.app` projects, Vix can eventually avoid some of that overhead.

The goal is not to compile C++ magically faster.

The goal is to avoid unnecessary work:

```txt
do not reconfigure when inputs are unchanged
do not regenerate when manifest is unchanged
do not recompile clean objects
do not relink unchanged targets
restore cached artifacts when valid
```

## Compatibility path vs fast path

The clean long-term model is:

```txt
CMakeLists.txt -> compatibility path
vix.app        -> fast path
```

The compatibility path keeps existing projects working.

The fast path lets Vix optimize projects it understands directly.

This split is more realistic than trying to replace CMake for every C++ project.

## vix build with CMake projects

For a normal CMake project, planning stays close to the existing model:

```txt
resolve project root
select preset
create build directory
configure CMake
build selected target
run cache checks
```

CMake remains the source of truth.

Vix can still improve:

```txt
diagnostics
cache
output style
artifact reuse
target-aware builds
```

But it should not try to understand arbitrary CMake better than CMake itself.

## vix build with vix.app projects

For `vix.app`, planning has more direct knowledge.

The plan can know:

```txt
target name
target type
sources
include directories
defines
packages
links
resources
output directory
```

Today, that data is used to generate CMake.

Later, it can be used to generate a native build graph.

The important part is that the build plan keeps this information structured.

## vix run and build planning

`vix run` depends on build planning too.

It needs to know:

```txt
which target to build
where the build output is
which executable to run
what project directory to use
```

For `vix.app`, `vix run` should use:

```txt
targetName = manifest.name
```

Then it searches common locations such as:

```txt
build-ninja/<target>
build-ninja/bin/<target>
build-ninja/src/<target>
```

This is why build planning and run planning must agree on the target name.

## Export planning

When Vix exports or copies a final binary, it should use:

```txt
userProjectDir
```

not:

```txt
cmakeSourceDir
```

For `vix.app`, exporting into:

```txt
.vix/generated/app/
```

would be wrong.

The generated CMake folder is not the user-facing output location.

## Watch planning

Watch mode should watch:

```txt
userProjectDir
```

For `vix.app`, this includes:

```txt
vix.app
src/
include/
assets/
```

Watching only:

```txt
.vix/generated/app/
```

would miss real source changes.

## Diagnostics planning

Diagnostics should show the correct layer.

For manifest errors, point to:

```txt
vix.app
```

For source errors, point to:

```txt
src/main.cpp
include/...
```

For generated CMake configure errors, point to:

```txt
.vix/generated/app/CMakeLists.txt
```

For user-facing project context, print:

```txt
Project directory: myapp/
Generated CMake source: myapp/.vix/generated/app/
Build directory: myapp/build-ninja/
Target: hello
```

This makes the build easier to debug.

## A clean plan object

A practical build plan should contain at least:

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

`projectDir` can remain for backward compatibility.

New code should prefer the more specific fields:

```txt
userProjectDir for real project operations
cmakeSourceDir for CMake configure
defaultTargetName for target selection
```

## Backward compatibility

The plan can evolve without breaking existing code by keeping:

```txt
projectDir
```

but treating it as the user project directory.

Then new fields provide clearer meaning.

This avoids large risky rewrites while fixing the `vix.app` path model.

## Common planning mistakes

### Using cmakeSourceDir as the project root

Wrong:

```txt
project root = .vix/generated/app
```

Correct:

```txt
project root = userProjectDir
CMake source = cmakeSourceDir
```

### Guessing target from folder name

Wrong for `vix.app`:

```txt
target = projectDir.filename()
```

Correct:

```txt
target = defaultTargetName
```

### Exporting to generated directory

Wrong:

```txt
.vix/generated/app/myapp
```

Correct:

```txt
myapp/myapp
```

or another user-facing output path.

### Watching generated files only

Wrong:

```txt
watch .vix/generated/app
```

Correct:

```txt
watch userProjectDir
```

## Planning checklist

For any `vix.app` build, verify:

```txt
1. userProjectDir points to the real project root.
2. cmakeSourceDir points to .vix/generated/app.
3. buildDir is under userProjectDir.
4. defaultTargetName equals manifest.name.
5. cmake -S uses cmakeSourceDir.
6. cmake --build uses defaultTargetName when no target is provided.
7. snapshots use userProjectDir.
8. exports use userProjectDir.
9. watch mode uses userProjectDir.
10. diagnostics distinguish generated files from user files.
```

## Why this matters

Build planning is not only about making the current generated CMake path work.

It is also preparing Vix for a native build engine.

If the plan keeps project identity clean, then Vix can later switch a `vix.app` project from:

```txt
generated CMake execution
```

to:

```txt
native BuildGraph execution
```

without changing the user-facing manifest.

The user still writes:

```txt
vix.app
```

Only the execution engine changes.

## Conclusion

`vix.app` forced Vix to make build planning more precise.

A generated project has two important paths:

```txt
the user project directory
the generated CMake source directory
```

It also has a target name that comes from the manifest, not from the folder name.

Keeping these values separate makes `vix build` more correct today.

It also creates the foundation for a faster native build path later.

```txt
vix.app starts as generated CMake.
vix.app can become native BuildGraph input.
The build plan is the bridge between both.
```
