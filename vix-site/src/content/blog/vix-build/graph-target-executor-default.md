---
title: Vix Build Graph Target Executor by Default
description: How Vix Build now uses a target-aware graph executor by default, skips unnecessary Ninja work, and adds a fast build-state path for no-op builds.
date: 2026-05-17
---

# Vix Build Graph Target Executor by Default

`vix build` is becoming more target-aware.

The goal is simple:

```txt
build the target that was requested
skip work that is already known to be clean
fallback to CMake and Ninja when they are the safer path
```

Vix still keeps CMake and Ninja compatibility.
But Vix now has a stronger build layer on top of them.
The graph target executor is now the default path for real build targets.

## The previous path

Before this change, `vix build` mostly behaved like this:

```txt
vix build
  -> resolve project
  -> configure CMake if needed
  -> call CMake build
  -> let Ninja execute the target
```

This path is reliable.
It works for existing CMake projects.
It works for complex targets.
It works for `all`.

But it also means that even when Vix knows more about the project, it still delegates almost everything to the CMake/Ninja path.
That is safe, but not always ideal.

## The new target-aware path

For real targets, Vix now uses the graph target executor by default.

Example:

```bash
vix build --build-target vix
```

The path becomes:

```txt
vix build
  -> resolve project
  -> configure CMake if needed
  -> import compile_commands.json
  -> import build.ninja
  -> build Vix BuildGraph
  -> resolve requested target
  -> collect target closure
  -> check dirty compile tasks
  -> execute only what is needed
```

This gives Vix a build view that is more precise than a plain command wrapper.
Vix can now reason about the requested target before deciding what to run.

## Why CMake and Ninja are still used

This change does not remove CMake.
It does not remove Ninja.
The current model is:

```txt
CMake -> configuration and compatibility
Ninja -> generated build graph and fallback execution
Vix   -> target-aware graph analysis and fast paths
```

That is important.
CMake and Ninja are still excellent for compatibility.
Vix uses them as a stable foundation while adding its own build intelligence on top.

## Why `all` stays on the CMake/Ninja path

The `all` target is different.
It is not a single executable.
It is not a single library.
It is a global target that can include many things:

- executables
- libraries
- tests
- examples
- generated targets
- utility targets
- install-related targets

So this still uses the normal CMake/Ninja path:

```bash
vix build --build-target all
```

The rule is:

```txt
real target -> graph target executor
all target  -> CMake/Ninja
```

This keeps the behavior safe.

## What the graph executor does

For a target like:

```bash
vix build --build-target vix
```

Vix resolves the graph target and collects its closure.

Conceptually:

```txt
target: vix
  -> link task
  -> object files
  -> compile tasks
  -> source files
  -> dependency files
  -> headers
```

Then it checks which compile tasks are dirty.
If no source, header, command, or output state requires recompilation, the target is clean.
The output can look like:

```txt
✔ Graph target: vix
✔ Up to date
✔ Done
```

## Skipping Ninja when the target is already up to date

One important improvement is that Vix can now skip the final Ninja call when the graph already proves the target is up to date.
Before this improvement, even a clean graph could still end with:

```bash
ninja -C build-ninja vix
```

Ninja would then answer:

```txt
ninja: no work to do.
```

That is correct, but still extra work.
Now the graph executor can detect:

```txt
dirty compile tasks: 0
target output exists
```

Then it can skip Ninja entirely.
The internal logic is:

```txt
if no dirty compile tasks
and target outputs exist
then return up to date
```

This makes the no-op path cleaner.

## Dirty compile task detection

A key fix was the dirty detection logic.
For compile tasks, the output object file should not make the task dirty just because the output node changed.

A compile task should be dirty when:

- source changed
- header changed
- config changed
- compile command changed
- object output is missing
- dependency file is missing

The output object is the result of the task.
It should not be treated the same way as an input.
The corrected model is:

```txt
compile task dirty =
  dirty input
  or missing output
```

This matters because large projects can have hundreds of compile tasks.
On Vix.cpp itself, the `vix` target selected hundreds of compile tasks.
After the dirty logic was corrected, a clean rebuild correctly reported:

```txt
dirty compile tasks: 0
```

That is the behavior needed for reliable target-aware builds.

## Large dirty target fallback

The graph executor can handle target-aware builds.
But for very large dirty closures, Ninja is still a better execution engine today.
So Vix has a safety fallback.
If too many compile tasks are dirty, Vix falls back to Ninja.
The rule is not based on the number of selected tasks.
A large target can select many tasks and still be clean.
The rule is based on dirty tasks:

```txt
many selected tasks + zero dirty tasks -> fine
many selected tasks + many dirty tasks -> fallback to Ninja
```

This avoids a bad path where Vix tries to directly execute a very large dirty build closure before the graph executor is mature enough for that case.

## Cleaner graph logs

During development, graph logs were useful.
They showed steps like:

```txt
graph: resolving target task
graph: collecting task closure
graph: selected compile tasks
graph: checking dirty compile tasks
graph: target outputs exist, skipping ninja
```

That helped debug the executor.
But this is too verbose for normal users.
So graph logs are hidden by default.
They should only appear with:

```bash
VIX_LOG_LEVEL=debug vix build --build-target vix -v
```

or:

```bash
VIX_LOG_LEVEL=trace vix build --build-target vix -v
```

The normal output stays clean:

```txt
✔ Graph target: vix
✔ Up to date
✔ Done
```

## The `--fast` build-state path

The biggest no-op speedup came from the build-state fast path.
The graph executor avoids unnecessary Ninja work.
But before reaching the graph executor, Vix may still need to:

- load global packages
- scan project files
- read `compile_commands.json`
- read `build.ninja`
- load dependency files
- build the graph
- propagate dirty state

For a large repository, that can still cost time.
So `--fast` adds a higher-level shortcut.
If the project state matches the last successful build, Vix can return early:

```bash
vix build --fast --build-target vix
```

Expected output:

```txt
Checking vix (dev)
  ✔ Up to date in 0.30s
```

This happens before loading global packages, before rebuilding the graph, and before invoking Ninja.

## What build-state checks

The fast path depends on build-state validation.
It compares the current state with the last successful build.
The state includes information like:

- build signature
- project fingerprint
- build target
- project inputs
- last artifact metadata

If the state matches, Vix can safely say:

```txt
nothing changed
```

Then it skips the full build pipeline.
This is the fastest no-op path.

## Benchmark result

On the Vix.cpp repository, the no-op benchmark showed the difference clearly.

```txt
vix build --fast --build-target vix                 303 ms
vix build --build-target vix                       6.10 s
VIX_GRAPH_EXECUTOR=0 vix build --build-target vix  6.16 s
```

That means the fast path was about:

```txt
20x faster
```

for this no-op target build.
The important detail is that this benchmark is for a clean no-op state.
It does not mean every build is 20x faster.
It means Vix can now skip the full pipeline when the project state proves that nothing changed.

## Why the benchmark matters

A no-op build is common during development.
Developers often run a build to check whether the project is still valid.
If nothing changed, the best build is the one that proves that quickly.
The old no-op path still needed to walk through the normal build system.
The fast path can now avoid that.
This improves the feedback loop.

## The current model

The current build model is now:

```txt
vix build --build-target all
  -> CMake/Ninja path

vix build --build-target <real-target>
  -> graph target executor

vix build --fast --build-target <real-target>
  -> build-state fast path when valid
  -> fallback to graph/CMake/Ninja when needed
```

This gives Vix three layers:

```txt
fast state check
target-aware graph execution
CMake/Ninja compatibility fallback
```

Each layer has a purpose.

## Why this is not just a wrapper

A wrapper simply forwards commands.
Vix Build now does more than that.

It can:

- resolve a target
- import build graph data
- track compile tasks
- detect dirty work
- skip Ninja when safe
- fallback when needed
- validate build state
- return early on no-op builds

This is build-system behavior.
CMake and Ninja are still part of the pipeline, but Vix now owns more of the decision-making.

## Compatibility stays intact

Existing CMake projects continue to work.
The CMake path remains the compatibility layer.
The graph executor can be disabled:

```bash
VIX_GRAPH_EXECUTOR=0 vix build --build-target vix
```

And `all` still uses the CMake/Ninja path:

```bash
vix build --build-target all
```

This means the new executor improves the build path without removing the old one.

## Why this matters for Vix

Vix is not trying to replace the entire C++ ecosystem in one step.
The better path is gradual:

- keep compatibility
- add graph intelligence
- add cache layers
- add better diagnostics
- make common workflows faster

This change follows that path.
It keeps the reliability of CMake/Ninja while allowing Vix to become more than a command wrapper.

## What this enables next

Owning the graph opens the door to better build features.
Future improvements can include:

- explain why a file rebuilt
- show which header caused recompilation
- restore objects from cache more aggressively
- skip more no-op work
- improve target diagnostics
- make `vix.app` native builds faster

The graph executor is a foundation.
It gives Vix a place to build these features.

## Relationship with `vix.app`

This also helps the long-term `vix.app` direction.
Today, `vix.app` uses generated CMake for compatibility.
But the long-term path is:

```txt
vix.app
  -> native BuildGraph
  -> ObjectCache
  -> Scheduler
  -> Link
```

The graph target executor brings Vix closer to that model.
It proves that Vix can reason about build targets directly.
That is necessary before native `vix.app` builds can become the fast path.

## The principle

The principle is:

```txt
use Vix where Vix can be correct
fallback to CMake/Ninja where they are safer
```

That is the right balance.
It gives users speed without losing compatibility.
It gives Vix room to grow without breaking existing C++ projects.

## Conclusion

`vix build` now has a stronger execution model.
For real targets, Vix can use its graph executor by default.
For clean targets, it can skip unnecessary Ninja work.
For no-op builds with `--fast`, it can return through a build-state fast path.
And for complex or global targets, it still falls back to CMake and Ninja.
The result is a build system that stays compatible, but becomes more intelligent:

```txt
CMake/Ninja for compatibility
BuildGraph for target awareness
Build state for fast no-op builds
```

This is an important step toward a faster and clearer C++ build workflow.
