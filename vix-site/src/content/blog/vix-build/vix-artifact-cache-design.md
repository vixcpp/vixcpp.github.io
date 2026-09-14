---
title: vix Artifact Cache Design
description: How Vix can reuse larger build outputs such as libraries, executables, and package artifacts by fingerprinting build inputs and avoiding repeated work.
date: 2026-05-17
---

# vix Artifact Cache Design

An object cache speeds up compilation at the source-file level.
An artifact cache works at a larger level.
It answers a different question:

```txt
Have we already built this target, package, or binary with the same relevant inputs?
```

If the answer is yes, Vix can reuse the result instead of rebuilding it.
This is especially important for C++ because repeated builds often spend time not only compiling source files, but also rebuilding libraries, relinking executables, and rebuilding dependencies that did not really change.

## Object cache vs artifact cache

The object cache works on individual compilation outputs.

```txt
src/app.cpp -> app.o
```

The artifact cache works on larger outputs.

```txt
objects + libraries + link options -> executable
```

or:

```txt
package source + compiler + build options -> compiled package artifact
```

The two caches solve different problems.

```txt
Object cache:
  reuse compiled object files

Artifact cache:
  reuse larger build outputs
```

A serious C++ build system needs both.

## What is an artifact?

An artifact is a build output that can be reused.

Examples:

```txt
executable binary
static library
shared library
compiled package
generated install prefix
exported headers and libraries
final linked target
```

For example:

```txt
build-ninja/bin/server
```

is an artifact.

So is:

```txt
build-ninja/lib/libmathlib.a
```

A compiled dependency can also be an artifact.

## Why artifact caching matters

Imagine a dependency that rarely changes.
Without an artifact cache, each project may rebuild it again.
With an artifact cache, Vix can build it once, store the result, and reuse it when the same inputs appear again.
This matters for:

```txt
global packages
compiled dependencies
CI builds
clean builds
large libraries
repeated local builds
cross-project reuse
```

The goal is not to hide compilation.
The goal is to avoid rebuilding known outputs.

## The basic idea

The basic artifact cache flow is:

```txt
1. describe the artifact
2. compute a fingerprint
3. check the cache
4. if hit, restore or reuse the artifact
5. if miss, build normally
6. store the result after success
```

A cache hit is only safe if the fingerprint is correct.

## Artifact identity

An artifact needs a stable identity.
For example:

```txt
package name
package version
target name
compiler identity
build type
target triple
build options
source fingerprint
dependency fingerprint
```

A compiled library built with GCC Debug is not the same as the same library built with Clang Release.
The artifact identity must include enough information to avoid invalid reuse.

## Fingerprint

A fingerprint is a compact representation of build-relevant inputs.
For an artifact, the fingerprint can include:

```txt
source file hashes
header file hashes
manifest hash
CMake configuration hash
compiler identity
compiler flags
linker identity
link options
target triple
build type
package versions
dependency artifact hashes
```

If the fingerprint changes, the artifact is not the same.

## Correctness rule

The artifact cache must follow one rule:

```txt
reuse only when the artifact identity matches
```

If Vix is not sure, it should rebuild.
A false cache miss is acceptable.
A false cache hit is dangerous.
A build cache must be conservative.

## Local build state

Artifact caching can also use local build state.
A local state file can record:

```txt
last target built
last artifact fingerprint
output path
input snapshot
build options
success status
```

This helps Vix detect no-op builds.

Example:

```txt
build-ninja/.vix-build-state
```

If the state says the current target was already built with the same inputs, Vix may skip work.

## Global artifact cache

A global artifact cache can live outside the project.

Example:

```txt
~/.vix/cache/build/
```

This allows reuse across projects.

A possible structure:

```txt
~/.vix/cache/build/
  <target-or-package>/
    <compiler>/
      <build-type>/
        <target-triple>/
          <fingerprint>/
            manifest.json
            include/
            lib/
            bin/
            share/
```

The exact layout can evolve.
The important idea is that reusable artifacts are stored by identity.

## Package artifacts

Package artifacts are especially useful.
Suppose a package is installed globally.
The source may live under:

```txt
~/.vix/global/packages/
```

When compiled, the result can be cached under:

```txt
~/.vix/cache/build/
```

Then another project can reuse the compiled result if:

```txt
same package
same version
same compiler
same build type
same target triple
same build options
```

This reduces repeated dependency builds.

## Header-only packages

Header-only packages do not need compiled artifacts.
For them, artifact cache may only record include paths and metadata.

Example:

```txt
include/
manifest.json
```

No library output is needed.
This distinction matters because header-only packages should not be treated like compiled packages.

## Compiled packages

Compiled packages can produce:

```txt
static libraries
shared libraries
CMake config files
headers
generated metadata
```

These are good artifact cache candidates.
The cache can store a reusable prefix:

```txt
include/
lib/
share/
```

Then Vix can add that prefix to the build system.

## CMAKE_PREFIX_PATH integration

For compiled packages, Vix can expose cached artifacts through CMake.
For example, if a package artifact contains:

```txt
lib/cmake/package/packageConfig.cmake
```

Vix can add the artifact prefix to:

```txt
CMAKE_PREFIX_PATH
```

Then normal CMake package discovery can find it.
This keeps artifact reuse compatible with CMake.

## Source fallback

If a compiled artifact is not available, Vix can fall back to source-based integration.
The fallback might be:

```txt
use add_subdirectory(...)
build package from source
store artifact after success
```

This gives a practical path:

```txt
cache hit -> reuse compiled artifact
cache miss -> build from source
```

Then future builds become faster.

## Artifact metadata

Every cached artifact should have metadata.

Example:

```json
{
  "name": "mathlib",
  "version": "1.0.0",
  "target": "mathlib",
  "compiler": "g++",
  "compiler_version": "13.3.0",
  "build_type": "Release",
  "target_triple": "x86_64-linux-gnu",
  "fingerprint": "...",
  "created_at": "...",
  "outputs": ["lib/libmathlib.a"]
}
```

The exact format can change.
The important part is explainability.
Vix should know what an artifact is and why it is valid.

## Artifact cache hit

An artifact cache hit means Vix found a complete reusable output.
Example:

```txt
artifact cache hit: mathlib
```

Then Vix can reuse the cached artifact instead of rebuilding it.
For a package, that may mean adding a cached prefix to the build.
For a final target, that may mean restoring the binary or skipping the build.

## Artifact cache miss

An artifact cache miss means no valid artifact was found.
Reasons can include:

```txt
first build
source changed
compiler changed
build type changed
target triple changed
dependency changed
link options changed
package version changed
cache entry missing
cache entry invalid
```

A miss should not be treated as an error.
It simply means Vix must build normally.

## Storing after build

After a successful build, Vix can store the artifact.
For a library, store:

```txt
library file
public headers if needed
metadata
dependency information
```

For an executable, store:

```txt
binary
resources if needed
metadata
```

For a package prefix, store:

```txt
include/
lib/
share/
manifest.json
```

Storing should happen only after the build succeeds.

## No-op build acceleration

A local artifact state can make no-op builds very fast.
If the current project inputs match the previous successful build state, Vix may avoid:

```txt
configure
compile
link
copy
```

or at least avoid most of them.
The ideal no-op build is:

```txt
nothing changed
nothing to do
done
```

This is one of the places where Vix can feel much faster than traditional workflows.

## Clean build with warm artifact cache

A clean build normally removes the build directory.

```bash
rm -rf build-ninja
```

Without a cache, everything must rebuild.
With a warm artifact cache, Vix may restore or reuse:

```txt
compiled packages
static libraries
final binaries
```

The build directory is clean, but the global cache is not.
That can turn a clean build into a mostly restore operation.

## Artifact cache and object cache together

The strongest model combines both caches.

```txt
Artifact cache hit:
  reuse whole target or package

Artifact cache miss:
  use object cache for individual compile tasks

Object cache miss:
  compile source
```

This gives several layers of acceleration.
Vix should always try the largest safe reuse first.

## Layered cache strategy

A layered strategy can look like this:

```txt
1. Check local no-op state.
2. Check artifact cache for target or package.
3. Check object cache for compile tasks.
4. Run compiler for remaining misses.
5. Link only if needed.
6. Store successful outputs.
```

This is how Vix can avoid repeated work at multiple levels.

## Relationship with BuildGraph

The BuildGraph tells Vix what the target depends on.
The artifact cache tells Vix whether a larger output can be reused.
The graph helps compute the artifact fingerprint.
For example, a target artifact depends on:

```txt
object files
libraries
resources
link options
package artifacts
```

If those inputs are unchanged, the final artifact may be valid.

## Relationship with Scheduler

The scheduler executes tasks.
If artifact cache hits, the scheduler may not need to execute lower-level tasks.

Example:

```txt
target artifact hit:
  restore executable
  skip compile tasks
  skip link task
```

If the artifact cache misses, the scheduler can still use object cache during compile tasks.

## Relationship with Link

Linking can be expensive.
Even if object files are cached, the final link can still take time.
Artifact caching can help avoid relinking when the linked output is already known to be valid.
A future link cache could store:

```txt
link inputs fingerprint -> final binary
```

This would make repeated builds even faster.

## Artifact cache and resources

Resources can affect final runtime output.

Example:

```ini
resources = [
  assets,
  "data/config.json=config/config.json",
]
```

If resources are part of the final artifact, their content should be included in the artifact identity.
If a resource changes, the artifact should not be reused without updating the resource output.

## Artifact cache and vix.app

`vix.app` is a good input for artifact caching because it is structured.

It directly lists:

```txt
target name
target type
sources
include_dirs
defines
links
compile_options
link_options
packages
resources
output_dir
```

That makes it easier to compute a stable artifact fingerprint.
For arbitrary CMake projects, Vix may need to rely on generated build files and CMake state.
For `vix.app`, Vix can eventually compute more directly.

## Artifact cache and CMake projects

For CMake projects, artifact caching should be conservative.
CMake can contain arbitrary logic.
So Vix should base artifact decisions on generated outputs such as:

```txt
compile_commands.json
build.ninja
CMakeCache.txt
build state
dependency files
```

It should not try to guess what arbitrary CMake logic means.

## Artifact cache and packages

Package artifacts are one of the best initial use cases.

Why ?
Because packages often change less frequently than application source code.
If Vix can reuse compiled packages across projects, it can reduce a lot of repeated work.


Example:

```txt
project A builds package X
project B uses same package X
project B reuses cached compiled artifact
```

This is especially useful for local development and CI.

## Artifact cache and CI

CI often starts from a clean workspace.
That makes artifact cache valuable.

A CI system can restore:

```txt
~/.vix/cache/build/
```

before building.

Then Vix can reuse compiled dependencies or target artifacts when identities match.
But the cache key must account for:

```txt
OS
compiler
compiler version
target triple
build type
dependency versions
```

Otherwise CI cache reuse can become unsafe.

## Artifact cache and cross-compilation

Cross-compilation requires separate artifact identities.

An artifact built for:

```txt
x86_64-linux-gnu
```

cannot be reused for:

```txt
aarch64-linux-gnu
```

Target triple must be part of the artifact key.
Sysroot and toolchain metadata may also be needed.

## Artifact cache and build type

Debug and Release artifacts are different.
Debug may include:

```txt
debug symbols
no optimization
assertions enabled
```

Release may include:

```txt
optimization
NDEBUG
different link behavior
```

So build type must be part of the artifact identity.

## Artifact cache and compiler

Artifacts depend on the compiler.
A static library built with one compiler may not be safe to reuse with another compiler.
Important compiler identity fields include:

```txt
compiler name
compiler path
compiler version
standard library
target triple
ABI-relevant options
```

For safety, Vix should separate artifacts by compiler identity.

## Artifact cache and ABI

ABI compatibility matters for C++.
Even if source code is unchanged, ABI can change with:

```txt
compiler version
standard library
compile definitions
visibility flags
target architecture
build type
```

Artifact caching must respect ABI boundaries.
This is another reason artifact reuse must be conservative.

## Cache invalidation

Artifact cache invalidation happens naturally when fingerprints change.

Examples:

```txt
source file changed
manifest changed
dependency version changed
compiler changed
link options changed
resource changed
target triple changed
```

When the fingerprint changes, Vix looks under a different cache key.
The old artifact may remain in the cache, but it is not used for the new build.

## Cache eviction

Artifact caches can become large.
Vix will eventually need eviction policies.

Possible policies:

```txt
maximum cache size
least recently used
maximum age
manual clean
per-package cleanup
per-target cleanup
```

Eviction should never affect correctness.
It only affects whether future builds are cache hits or misses.

## Explainable cache behavior

Engineers need to trust the cache.
Vix should eventually explain:

```txt
artifact cache hit: mathlib
artifact cache miss: compiler changed
artifact cache miss: dependency fmt changed
artifact cache miss: resource assets/logo.png changed
```

This is important.

A fast build that cannot be explained can feel unsafe.

## Cache summary

Verbose output can show cache summaries.

Example:

```txt
artifact cache:
  target: myapp
  status: miss
  reason: source fingerprint changed

object cache:
  selected: 12
  hits: 10
  compiled: 2
```

This makes performance visible.

It also helps debug unexpected rebuilds.

## Relationship with vix build state

A build state file can record the last successful artifact.

Example:

```txt
build-ninja/.vix-build-state
```

It can store:

```txt
target
artifact fingerprint
input snapshot
build options
output path
timestamp
```

On the next run, Vix can compare current state with previous state.
If nothing changed, it can skip work.

## Local state vs global cache

Local state answers:

```txt
Is this build directory already up to date?
```

Global artifact cache answers:

```txt
Do we have this artifact anywhere in the cache?
```

Both are useful.

Local state is very fast for no-op builds.
Global cache is useful after clean builds, across projects, and in CI.

## Artifact restoration

Restoring an artifact can mean different things.
For a final binary:

```txt
copy cached binary to build output path
```

For a package:

```txt
add cached prefix to CMAKE_PREFIX_PATH
```

For a library:

```txt
copy cached library and headers
```

The restoration strategy depends on artifact type.

## Avoiding stale restores

Restoring must be atomic when possible.
A partial restore can leave a broken build directory.
A safe process can be:

```txt
restore into temporary location
verify expected files
move into final location
update state
```

This avoids corrupting build outputs if a restore fails.

## Artifact verification

Before accepting a cache hit, Vix can verify:

```txt
metadata exists
expected files exist
fingerprint matches
artifact type matches
compiler identity matches
target triple matches
```

If verification fails, treat it as a cache miss.

Do not use broken cache entries.

## Security considerations

A build cache stores executable code.
If artifacts come only from the local machine, the risk is lower.
If artifacts are shared remotely, Vix must treat them carefully.
Remote artifacts need stronger integrity checks.

Possible mechanisms:

```txt
content hashes
signatures
trusted cache sources
metadata verification
sandboxed extraction
```

For a local-first build cache, start simple and safe.

## Remote artifact cache

A future remote cache could let teams share compiled outputs.
That requires strict identity and trust rules.
A remote artifact cache must know:

```txt
who produced the artifact
which compiler was used
which source fingerprint was used
whether the artifact is trusted
```

This is powerful, but it should come after local cache correctness is solid.

## Artifact cache and native vix.app builds

In the future native path:

```txt
vix.app
  -> BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

artifact cache can sit above the graph.
Before scheduling tasks, Vix can ask:

```txt
Do I already have the final target artifact?
```

If yes, restore it.
If no, execute the graph.
This is the fastest path when safe.

## Artifact cache and generated CMake

In the current path:

```txt
vix.app -> generated CMake -> CMake/Ninja
```

Vix can still use artifact cache.
It can fingerprint the generated CMake, manifest, and build configuration.
Then it can decide whether a previous artifact is still valid.
This makes artifact caching useful before native builds are complete.

## What artifact cache cannot solve

Artifact cache cannot make every first build instant.
If Vix has never seen an artifact before, it must build it.
If inputs changed, it must rebuild.
If the compiler changed, old artifacts may be invalid.
So the promise is not:

```txt
all builds are instant
```

The promise is:

```txt
repeated builds avoid repeated work
```

That is realistic and valuable.

## Good first target

The best first target for artifact caching is compiled package reuse.

Why?

```txt
packages are reused across projects
package source changes less often
package build cost can be high
cache hits are easy to explain
```

Final executable caching can come later.
Package artifacts provide immediate value.

## Practical first version

A practical first artifact cache can support:

```txt
compiled package prefixes
local build state
target artifact metadata
basic fingerprinting
cache hit/miss logging
safe verification before reuse
```

It does not need remote cache or perfect link caching on day one.

Start with correctness and visibility.

## Later improvements

Later improvements can include:

```txt
final binary restore
link result cache
remote artifact cache
cache eviction policies
artifact signing
team cache
CI cache integration
explainable miss reasons
native vix.app integration
```

The system should grow in layers.

## Engineering principle

The artifact cache should follow this principle:

```txt
reuse large outputs only when their full build identity is known
```

That identity must include source, dependencies, compiler, linker, build type, target triple, and options.

If identity is incomplete, the cache should miss.

## Conclusion

The artifact cache is the coarse-grained cache layer in `vix build`.
It complements the object cache.
Object cache avoids recompiling individual source files.
Artifact cache avoids rebuilding larger outputs such as libraries, executables, and compiled packages.
Together with the BuildGraph, Scheduler, and future native `vix.app` path, artifact caching gives Vix a realistic path toward dramatically faster repeated C++ builds.
The goal is not magic.
The goal is disciplined reuse:

```txt
same inputs
same build identity
same artifact
reuse safely
```
