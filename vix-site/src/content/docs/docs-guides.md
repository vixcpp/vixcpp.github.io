# Vix.cpp Documentation Standard

This document defines how Vix.cpp documentation should be written, structured, verified, and maintained.

The purpose of the documentation is not to describe every line of the implementation. It is to help a developer understand what Vix does, use it correctly, understand important behavior when necessary, and find deeper technical details without turning every page into an internal engineering report.

Vix.cpp documentation must remain faithful to the real product. The source code and tested CLI behavior are the source of truth.

## 1. What Vix.cpp documentation should achieve

A good Vix.cpp documentation page should answer four questions:

1. What is this feature or command?
2. Why would a developer use it?
3. How is it used in a real workflow?
4. What important behavior should the developer understand before relying on it?

A page should allow a new reader to start quickly while still giving an experienced C++ developer enough technical depth to trust the behavior.

Documentation should not require the reader to understand Vix internals before they can use Vix.

## 2. Write for developers, not for the implementation

The implementation can contain:

- build graphs
- schedulers
- cache layers
- generated metadata
- helper classes
- process abstractions
- internal state machines
- fallback paths
- compatibility layers

Those details matter when they change public behavior, explain an important decision, or help diagnose a problem.

They should not automatically become documentation sections.

For example, instead of explaining every internal cache class used by `vix build`, explain the behavior a developer can observe:

> Vix keeps build state so unchanged projects can avoid unnecessary configuration and rebuild work. `--fast` can return early when the previous successful build still matches the current project.

If deeper internal details are useful, introduce them only after the public behavior is already clear.

## 3. The source of truth

Never document a feature from its name alone.

Before documenting a CLI command or option, verify:

- how it is parsed
- its default value
- where it is used
- which execution paths it affects
- whether it works for projects, single files, or both
- whether it changes cache or configuration state
- whether it behaves differently by platform
- which options conflict with it
- which environment variables interact with it
- what happens when it fails

The preferred order of truth is:

1. current source code
2. tests
3. verified terminal behavior
4. current CLI help
5. existing documentation

Existing documentation is never the source of truth when it conflicts with the implementation.

If the help text is wrong, fix the CLI or clearly identify the inconsistency before documenting it.

## 4. Documentation must explain the workflow

Vix documentation should be organized around how developers work.

For example, a `vix build` page should begin with building a project and a single source file, not with internal cache architecture.

A `vix run` page should begin with running code, not with the implementation of the direct script runner.

The normal progression is:

```text
what it is
why it matters
basic workflow
important behavior
advanced controls
diagnostics
reference
```

The reader should understand the command before reaching the complete option reference.

## 5. Keep the first example small

The first example should prove the core behavior with as little code as possible.

For `vix run`:

```bash
vix run main.cpp
```

For `vix build`:

```bash
vix build
```

or:

```bash
vix build main.cpp
```

Avoid opening a page with a large C++ program, a complex configuration file, or a long terminal transcript.

The first example should make the command understandable in seconds.

## 6. Examples must prove something

Every example must have a reason to exist.

A code example should demonstrate a capability, a decision, or an important failure mode.

Good examples include:

- building one C++ file without creating a project
- using a Vix dependency from a single source file
- showing a real cache hit
- showing the difference between compiler flags and runtime arguments
- showing one representative compiler diagnostic
- showing one representative linker failure
- showing cross-compilation
- showing environment configuration used in CI

Do not add multiple variations that teach the same idea.

One strong example is better than five decorative examples.

## 7. Use real terminal output

When documentation contains Vix output, prefer output captured from the real CLI.

Do not invent polished output just to make the page look good.

If an output varies by:

- platform
- compiler
- project name
- path
- timing
- terminal mode

show only the part that matters to the explanation.

For example:

```text
✔ Exported binary: /home/user/project/main
```

is useful because it proves where the executable was exported.

A large terminal transcript should only be included when the sequence itself teaches something important.

## 8. Do not turn command pages into error catalogs

Vix has strong compiler, linker, CMake, Ninja, sanitizer, and runtime diagnostics.

Those capabilities should be visible in the documentation, but they should not dominate every command page.

For a build command, two or three representative examples are enough:

- one compiler failure
- one linker failure
- optionally one complex C++ or build-system case

For a run command, one representative runtime failure is usually enough.

Then explain that the same diagnostic system handles additional known failure classes.

Dedicated troubleshooting pages can go deeper.

## 9. Explain important distinctions clearly

C++ tooling often has behavior that looks similar from the outside but means different things.

Vix documentation should explicitly explain those boundaries.

Examples:

### Build vs run

```text
vix build
```

produces a build.

```text
vix run
```

executes code or the last successful project build.

Do not describe `vix run` as universally rebuilding a project when the implementation does not do that.

### Project arguments vs single-file arguments

For a project:

```bash
vix build -- -DMY_FEATURE=ON
```

passes arguments to CMake configuration.

For a single source file:

```bash
vix build main.cpp -- -std=c++23
```

passes compiler or linker flags.

The documentation must make differences like this obvious.

## 10. Every CLI option has a behavioral story

A CLI reference is more than a list of flags.

For every important option, the documentation should know:

- what problem it solves
- what it changes
- where it applies
- what its default behavior is
- whether it changes a cache or configuration boundary
- whether it has conflicts
- whether it is useful in CI or production
- whether it is advanced or part of the normal workflow

Not every option needs its own large section.

The amount of explanation should match its importance.

For example:

`--fast` deserves an explanation because it changes how an incremental build decides that no work is needed.

`--quiet` usually only needs a short explanation.

## 11. Separate normal workflow from advanced controls

The main path should remain visible.

For example, a build page might naturally progress through:

```text
Build a project
Build a single C++ file
Incremental builds
Diagnostics
Watch
Warnings and sanitizers
Output
Toolchains
Environment
Advanced behavior
Complete reference
```

Advanced options such as graph execution, heartbeat tuning, raw debug scopes, or internal performance traces belong later.

Do not force beginners to read them before learning the normal command.

## 12. Environment variables are part of the product surface

Environment variables are especially important for:

- CI
- containers
- remote builds
- production environments
- cross compilation
- toolchain images
- automated developer environments

They must be documented when they materially affect public behavior.

Separate them into categories.

### Public configuration

Variables that a developer can reasonably use as part of a build or runtime configuration.

Examples may include:

```text
CXX
PATH
CMAKE_PREFIX_PATH
CMAKE_TOOLCHAIN_FILE
VIX_LOG_LEVEL
```

### Vix-specific controls

Variables that intentionally configure Vix behavior.

Examples may include:

```text
VIX_BUILD_MANAGED_SDK
VIX_GRAPH_EXECUTOR
```

### Advanced diagnostics

Variables mainly useful while investigating Vix itself or unusual build behavior.

Examples may include:

```text
VIX_PERF_TRACE
VIX_PROCESS_DEBUG
```

### Runtime-generated variables

Some variables are written by Vix for child processes.

Do not present these as stable user configuration unless they are intentionally public APIs.

For every documented environment variable, verify:

- whether Vix reads it or writes it
- accepted values
- default behavior
- CLI precedence
- platform behavior
- where it applies

## 13. Do not hide option precedence

If a CLI option overrides an environment variable, say so.

If an explicit CMake package location overrides Vix managed SDK resolution, say so.

If two options cannot be combined, say so.

If one mode changes another mode's behavior, say so.

Important precedence rules should not be discoverable only by reading source code.

## 14. Cache documentation must explain invalidation

Do not write only:

> Vix caches builds.

That is not enough for experienced developers.

Explain what makes a cached result reusable and what can invalidate it.

Depending on the command, relevant inputs may include:

- source content
- headers
- compiler identity
- target
- C++ standard
- compile options
- linker options
- dependencies
- sanitizer mode
- build profile
- generated configuration
- CMake arguments

The documentation does not need to expose the serialization format of every cache key.

It does need to explain why the developer can trust a cache hit.

## 15. Preserve the role of the native C++ toolchain

Vix should not be documented as if it replaces CMake, Ninja, GCC, Clang, or the linker when it actually coordinates them.

Prefer wording such as:

> Vix configures and drives the project build while CMake, Ninja, and the selected compiler continue to perform their normal roles.

This is more accurate than presenting Vix as a hidden compiler implementation.

When Vix does have its own execution path, such as direct single-file compilation or graph execution, explain that distinction clearly.

## 16. Do not overexpose internal names

Avoid unnecessary references to class and type names such as:

```text
BuildGraphExecutorAdapter
DirectScriptPlan
ArtifactCache
RunFlow
ConfigureDecision
```

Those names belong in contributor or architecture documentation.

User documentation should normally say:

- build graph
- script cache
- configuration check
- direct compilation
- CMake fallback
- build state

An internal name is acceptable only when the user must interact with the corresponding artifact or concept directly.

## 17. Page types must have different purposes

Vix documentation should distinguish different kinds of pages.

### Getting Started

Goal: get the reader working quickly.

Examples:

- Installation
- Quick Start
- First Project

These pages should avoid advanced internals.

### Guides

Goal: accomplish a real task.

Examples:

- Build for production
- Cross-compile an application
- Add dependencies
- Debug a failed build

A guide should be task-oriented.

### Concepts

Goal: explain how an important Vix idea works.

Examples:

- Project model
- Build state
- Vix modules
- Dependency resolution

A concept page can go deeper than a command page.

### Reference

Goal: provide complete, precise information.

Examples:

- CLI command reference
- environment variables
- configuration fields
- manifest schema

Reference pages prioritize completeness.

### Troubleshooting

Goal: solve failures.

Examples:

- compiler errors
- linker errors
- CMake configure failures
- dependency resolution problems

Troubleshooting can contain more detailed error examples than normal command documentation.

## 18. Structure for CLI command pages

A command page should normally follow this shape when relevant:

```text
# vix <command>

Short definition.

## Main workflow

Minimal example.

## Important secondary workflow

For example single-file or project mode.

## Important behavior

Cache, build strategy, dependency resolution, or execution model.

## Diagnostics

Only representative examples.

## Advanced workflows

Watch, sanitizers, cross compilation, replay, etc.

## Environment variables

Only variables that matter for this command.

## Option interactions

Conflicts and important precedence rules.

## Complete command reference

Exact current help output.

## Related commands
```

Not every command needs every section.

The structure should follow the command's real behavior.

## 19. The complete help belongs near the end

The command help should not be the introduction.

A new reader should first learn the workflow.

The full CLI reference belongs near the end of the page, where it serves as a precise lookup table after the command has been explained.

When the documentation includes `vix <command> --help`, reproduce the current output accurately.

Do not rewrite the help into compressed pseudo-reference lines if the CLI itself presents full descriptions.

## 20. Avoid duplication

Do not explain the same concept in five places on one page.

For example, if sanitizers are explained in a dedicated section, the cache section only needs to mention that sanitizer mode participates in cache validation.

It does not need to explain all sanitizer options again.

Use links to related pages when the topic already has its own documentation.

## 21. Write natural technical prose

Vix documentation should sound like it was written by someone who understands the software.

Prefer complete paragraphs.

A paragraph should connect ideas naturally instead of presenting every thought as a separate sentence.

Avoid writing like:

```text
Vix is not a compiler.
Vix is not CMake.
Vix is not Ninja.
Vix does not replace your toolchain.
```

Prefer:

> Vix coordinates the project build while CMake, Ninja, and the selected compiler continue to perform their normal roles. It adds project resolution, build state, diagnostics, and higher-level workflow without requiring developers to replace the underlying C++ toolchain.

## 22. Avoid marketing language

Documentation is not a landing page.

Avoid expressions such as:

```text
seamless
powerful
revolutionary
next-generation
game-changing
unlocks productivity
robust and scalable
effortless
```

Describe concrete behavior instead.

Bad:

> Vix provides a powerful and seamless C++ build experience.

Better:

> `vix build main.cpp` compiles one C++ source file and exports the resulting executable to the current directory.

Concrete behavior is more convincing than praise.

## 23. Avoid artificial slogan writing

Do not turn every paragraph into short promotional fragments.

Bad:

```text
One command.
No complexity.
Fast builds.
Clear errors.
Modern C++.
```

This style belongs to marketing material, not technical documentation.

Documentation should explain ideas with enough context for the reader to make decisions.

## 24. Do not use unnecessary negation

Do not define Vix only by listing what it is not.

Negative clarification is useful when it removes a real ambiguity, but the page should begin with what the feature does.

Bad:

> `vix run` is not a build command. It is not CMake. It is not a compiler.

Better:

> `vix run` executes a C++ source file, an existing executable, or the executable recorded by the last successful project build.

## 25. Keep paragraphs focused

A paragraph should usually explain one connected idea.

Do not create one paragraph that mixes:

- cache internals
- cross compilation
- output paths
- warnings
- cloud reporting

Break the explanation where the developer's question changes.

At the same time, do not split every sentence into its own paragraph.

## 26. Avoid the em dash

Do not use the em dash character in Vix public documentation.

Use commas, parentheses, colons, or normal sentence structure instead.

This keeps the writing style consistent across the project.

## 27. Technical depth should appear progressively

The page should work at several levels.

A beginner may read:

```text
title
introduction
first example
basic workflow
```

An intermediate developer may continue into:

```text
dependencies
watch
sanitizers
output
```

An experienced developer may need:

```text
cache behavior
toolchains
cross compilation
environment variables
advanced diagnostics
full reference
```

Do not force all readers through the deepest level before they can use the feature.

## 28. Document production-relevant behavior carefully

Anything that affects reproducibility, deployment, CI, or production deserves precise wording.

Examples include:

- release presets
- target triples
- sysroots
- compiler selection
- linker selection
- CMake package discovery
- environment variables
- static linking
- sanitizer configuration
- output paths
- dependency resolution
- build reports

Do not describe these with vague language.

State what is controlled, which path it affects, and any important limits.

## 29. Platform differences must be explicit

If behavior differs on:

- Linux
- macOS
- Windows

say so where the difference matters.

Do not create platform sections for every small implementation detail.

Mention platform differences when they affect:

- command availability
- executable naming
- watch support
- toolchain detection
- sanitizer behavior
- shell delegation
- paths
- compiler defaults

## 30. Keep implementation quirks out of the main story

Sometimes the implementation has compatibility behavior, legacy aliases, or secondary modes.

If they remain public, include them in the command reference.

Do not make them part of the main workflow unless they are actually recommended.

For example, a legacy dependency option can remain in `--help` while the page teaches the normal `vix add` and `vix install` workflow.

## 31. Fix product inconsistencies before documenting them when possible

If an audit finds:

- an option that is parsed but unused
- a help description that is false
- an option that silently does nothing
- a cache scope inconsistent with its name
- a hidden alias that should be public
- a misleading default
- an important error with no useful message

prefer correcting the CLI when the intended behavior is clear.

Documentation should describe a coherent product, not preserve known bugs as permanent concepts.

## 32. Validation before publishing a page

Before a command page is considered complete:

1. read the relevant implementation
2. verify every documented public option
3. verify important environment variables
4. run representative commands
5. capture real output where examples use terminal output
6. test common failure cases
7. confirm platform-specific claims
8. compare the final command reference with the current `--help`
9. run the documentation build
10. run `git diff --check`

For CLI pages, also test the command from a temporary directory when single-file behavior is documented.

## 33. Questions to ask during review

Before publishing a page, ask:

- Can someone understand the command in less than a minute?
- Is the normal workflow obvious?
- Does every example prove something useful?
- Is any behavior described that was not verified?
- Are important production or CI controls missing?
- Does the page expose too many internal implementation names?
- Are cache claims precise enough to be trusted?
- Are environment variable precedence rules clear?
- Is the complete CLI help accurate?
- Does the page repeat itself?
- Does the page read like technical documentation rather than generated marketing copy?

If the answer to one of these questions is no, the page is not finished.

## 34. Definition of a good Vix.cpp documentation page

A good Vix.cpp documentation page is technically correct, easy to enter, useful at several levels of experience, and honest about the behavior of the tool.

It does not try to impress the reader with the number of features.

It shows the workflow first, explains important behavior when it matters, exposes advanced controls without letting them dominate the page, and keeps the complete reference available for developers who need precision.

Most importantly, it helps the reader make progress with real C++ code.
