# No-op target builds are now fast by default

`vix build` keeps getting faster, but the most important part is not just speed.
The important part is correctness.
A build tool should never say that a target is up to date unless it can prove it.
The latest work on `vix build` focused on that balance:

```
fast when safe
correct by default
fallback when needed
```

This article explains the latest improvement: normal no-op target builds are now fast too.

## The previous result

In the previous benchmark, the `--fast` path was clearly the fastest path.
The result looked like this:

```
vix build --fast --build-target vix                 303 ms
vix build --build-target vix                       6.10 s
VIX_GRAPH_EXECUTOR=0 vix build --build-target vix  6.16 s
```

That was a strong result.

It showed that `--fast` could skip the heavy build pipeline when the project state proved that nothing had changed.

But it also meant that the user needed to know about `--fast`.
The normal target build was still much slower.

## The new result

After the latest build-state and cache routing improvements, the benchmark changed.
On the same Vix.cpp repository, the new result is:

```
vix build --fast --build-target vix                 313 ms
vix build --build-target vix                        315 ms
VIX_GRAPH_EXECUTOR=0 vix build --build-target vix   309 ms
```

This is the important change:

**the normal target build is now fast too**

`vix build --build-target vix` no longer needs to walk through the full pipeline when Vix can already prove that the target is clean.

## What changed

Before, `--fast` had the highest-level shortcut.
The normal build path could still pay for work such as:

- load project metadata
- load global packages
- scan project files
- load compile_commands.json
- load build.ninja
- load dependency files
- build the graph
- propagate dirty state
- resolve the target
- ask Ninja

That is safe, but it is not always necessary.
Now the build-state validation can help the normal target build too.
The normal path can return early when the state proves:

- same build signature
- same project fingerprint
- same target
- same preset
- same build type
- same compiler identity
- same project inputs
- last binary still exists
- last binary is executable
- artifact state is valid

So the normal command can be fast:

```sh
vix build --build-target vix
```

Expected output:

```
Checking vix (dev)
  ✔ Up to date in 0.3s
```

## Why this matters

This is better than making only `--fast` fast.

A special flag is useful for power users.
But the best developer experience is when the default command is already smart.
The user should not need to think:

> Should I use `--fast` here?

For a clean target, Vix can now make the normal command fast when it can prove correctness.
That makes the common workflow simpler:

```sh
vix build --build-target vix
```

- If nothing changed, Vix returns quickly.
- If something changed, Vix rebuilds.
- If Vix is unsure, it falls back.

## Safety still comes first

The speedup is only valid because Vix does not trust one signal blindly.
For example, a build state hit is not enough.
The final binary must still exist.
The target must match.
The project inputs must match.
The build signature must match.

If the binary is missing, Vix must not say `Up to date`. It must rebuild or restore from the artifact cache.

That was tested with:

```sh
vix build --build-target vix
rm -f build-ninja/vix
vix build --fast --build-target vix
```

The rule is:

```
state hit is not enough
the target output must still be valid
```

## ArtifactCache makes clean rebuilds faster

The latest work also improved target artifact restoration.
If the final binary exists in the artifact cache, Vix can restore it directly.

Example:

```sh
vix build --build-target vix
rm -rf build-ninja
vix build --build-target vix
```

The result can be:

```
Restoring vix (dev)
  ✔ Artifact cache hit
  ✔ Done
```

That means even after deleting the build directory, Vix can restore the final target without recompiling.
This is a different layer from the object cache.

```
ObjectCache    -> restores .o and .d files
ArtifactCache  -> restores the final binary or library
```

The build model becomes layered:

```
BuildState     -> fastest no-op validation
ArtifactCache  -> restore complete target
BuildGraph     -> target-aware analysis
ObjectCache    -> restore compile outputs
CMake/Ninja    -> compatibility fallback
```

## The safety test suite

This work is now protected by a build safety test script.
The script checks the fragile paths:

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

The current result is:

```
Passed: 12
Failed: 0
```

This matters because build optimizations can be dangerous.
A build system is not allowed to be fast by being wrong.
Every shortcut must prove that it is safe.

## `--explain` also improved

The latest work also improved `--explain`.
For source changes, Vix can now explain the rebuild:

```sh
vix build --explain --build-target vix
```

Example output:

```
Rebuilding BuildCommand.cpp
  reason: source file changed

Relinking vix
  reason: object file changed
```

For some header changes, when Vix cannot yet map the header precisely to selected compile tasks, it now avoids lying.

Instead of saying:

```
No rebuild required
```

it says:

```
Project input changed
  reason: dependency changed, delegating target to Ninja

Relinking vix
  reason: target may depend on changed input
```

Then Ninja decides the exact files to rebuild.
That is the right behavior.
If Vix cannot prove the target is clean, it must not claim that it is clean.

## Why Graph Executor still matters

The benchmark now shows similar times for:

- `--fast`
- normal target build
- Graph Executor disabled

That does not mean the Graph Executor is useless.
It means the no-op path is now being solved earlier.
For clean builds, the fastest layer wins before the graph executor needs to do much work.
But when the project changes, the graph executor still matters because it gives Vix target awareness.

It can:

- resolve the requested target
- collect the target closure
- detect dirty compile tasks
- avoid global rebuild assumptions
- delegate safely when needed

The long-term direction is still:

```
CMake/Ninja    -> for compatibility
BuildGraph     -> for target intelligence
ObjectCache    -> for compile reuse
ArtifactCache  -> for target reuse
BuildState     -> for fast no-op validation
```

## The benchmark

The current benchmark was run on:

```
CPU      Intel Core i7-8650U
RAM      15Gi
OS       Ubuntu 24.04.4 LTS
Compiler GCC 13.3.0
Linker   mold
Launcher ccache
Target   vix
Runs     20
Warmup   5
```

Result:

```
vix build --fast --build-target vix                 313 ms
vix build --build-target vix                        315 ms
VIX_GRAPH_EXECUTOR=0 vix build --build-target vix   309 ms
```

The conclusion is not:

```
--fast is 20x faster
```

That was the previous result.
The new conclusion is:

**normal no-op target builds are now fast by default**

That is a better developer experience.

## The principle

The principle remains the same:

```
fast when safe
correct by default
fallback when needed
```

Vix should be fast when it can prove correctness.

- If the target is clean, return quickly.
- If the final binary is cached, restore it.
- If the graph can prove the dirty work, execute only what is needed.
- If the graph cannot prove safety, delegate to Ninja.

This is how `vix build` can become faster without becoming fragile.

## Conclusion

The latest `vix build` work changes the default experience.

Before:

- `--fast` was the fast no-op path
- normal target builds were still slower

Now:

- normal no-op target builds are fast too
That is an important step.
It means Vix is not only adding special fast paths.
It is making the ordinary command smarter.
For developers, that is the real win:

```sh
vix build --build-target vix
```

- If nothing changed, it returns in about 300 ms.
- If something changed, it rebuilds.
- If Vix is unsure, it falls back.
That is the kind of build behavior Vix is moving toward.
