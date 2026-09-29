# Dependencies and Checks

Application modules are useful only when their boundaries remain visible. Vix keeps two different kinds of dependency relationships explicit:

1. module-to-module dependencies, such as `projects` depending on `auth`
2. external dependencies owned by one module, such as `auth` using a JWT or logging library

The root `vix.app` describes the active module graph. Each module's `vix.module` can describe external dependencies that belong to that module. The root `vix.lock` still records the exact dependency state for the application as a whole.

## Module dependencies in `vix.app`

In a `vix.app` project, module-to-module dependencies are declared with `depends`.

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This says that `projects` depends on `auth`. The relationship is declared by module name, so the application architecture is visible from the root manifest.

A larger graph may look like this:

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]

[module.builds]
enabled = true
path = "modules/builds"
kind = "backend"
depends = [
  "projects",
]

[module.packages]
enabled = true
path = "modules/packages"
kind = "backend"
depends = [
  "projects",
]
```

The dependency direction is:

```text
auth
  ^
  |
projects
  ^
  |
  +---- builds
  |
  +---- packages
```

Vix validates this graph before generated project integration relies on it.

## Build dependencies between modules

The manifest describes the architecture, but the CMake targets still express the actual C++ build relationship.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

The include and target dependency should tell the same story.

```cpp
#include <auth/api.hpp>
```

If a public header in `projects` uses the public API from `auth`, the module target should expose the corresponding target dependency.

Public headers belong under the module's exported include directory.

```text
modules/auth/
  include/auth/      public headers
  src/               private implementation
```

Other modules may include public headers:

```cpp
#include <auth/api.hpp>
```

They should not include another module's private implementation.

```cpp
#include "../../auth/src/AuthStore.hpp"
```

If a type must be shared, move it into a public header and declare the module dependency explicitly.

## External dependencies owned by a module

An external dependency can belong to one module instead of the application target.

For a Registry package:

```bash
vix add gk/jwt@^1.0.0 --module auth
```

The module manifest records the Registry requirement and the CMake targets used by the module.

```toml
[deps]
registry = [
  "gk/jwt@^1.0.0",
]

links = [
  "gk::jwt",
]
```

For a direct Git dependency:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth
```

The Git dependency is recorded in `modules/auth/vix.module`.

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"
```

CMake options can remain with the dependency:

```toml
[dependencies.spdlog.cmake]
SPDLOG_BUILD_TESTS = false
SPDLOG_BUILD_EXAMPLE = false
SPDLOG_BUILD_BENCH = false
```

The dependency belongs to `auth` for generated linkage. It is not automatically attached to sibling modules or to the application target.

```text
auth
  +-- spdlog::spdlog

billing
  +-- no spdlog dependency
```

This is ownership, not separate physical storage.

## One application dependency state

Module-owned dependencies still participate in the application's dependency state.

```text
vix.app
  |
  +-- auth
  |     |
  |     +-- modules/auth/vix.module
  |            |
  |            +-- external dependencies
  |
  +-- projects
  |
  v
root vix.lock
```

Vix does not create a lockfile for each module. Exact resolved versions and Git revisions remain in the root `vix.lock`.

Module-owned Git dependencies also use the normal shared Vix cache. Two compatible owners can therefore reuse the same resolved dependency and cached checkout.

## Active and inactive dependency owners

Only enabled modules participate in the active application graph.

A disabled module can keep its dependency declarations on disk:

```toml
[module.analytics]
enabled = false
path = "modules/analytics"
kind = "backend"
depends = []
```

Its `vix.module` may still declare Registry or Git dependencies, but those requirements do not constrain the active application dependency graph until the module is enabled.

This allows a project to keep inactive feature metadata without forcing unused dependencies into the active build.

## Shared external dependencies

Multiple active modules can depend on the same external package.

```text
auth
  +-- spdlog

billing
  +-- spdlog
```

When their requirements are compatible, Vix can resolve one effective dependency state while preserving both owners.

The same principle applies when the root application and one or more modules use the same external dependency.

Ownership and resolution are separate questions:

```text
who uses it?
  -> root application, auth, billing

what exact dependency state is valid for all active owners?
  -> one compatible resolution
```

A shared dependency does not require a separate checkout or lock entry for every owner.

## Dependency conflicts

Vix analyzes active requirements before publishing a new dependency state.

If two active owners require incompatible versions or Git revisions of the same dependency, installation fails instead of using last-write-wins behavior.

For example:

```text
auth
  -> repository X at revision A

billing
  -> repository X at revision B
```

If those requirements cannot be represented by one effective dependency state, Vix rejects the change.

The same applies between the root application and a module:

```text
application
  -> repository X at revision A

auth
  -> repository X at revision B
```

CMake configuration is also part of the compatibility check for the same effective Git dependency. If two active owners require incompatible CMake option values, Vix rejects the conflict.

For repository-root Git dependencies, an omitted subdirectory and:

```toml
subdirectory = "."
```

refer to the same source location for conflict analysis.

The goal is deterministic behavior. An installation must not depend on which manifest happened to be processed last.

## The check command

`vix modules check` validates the module layer from the project root.

```bash
vix modules check
```

The command is not a replacement for compilation. It catches structural problems before generated build files or compiler diagnostics become the first signal.

Run it after changing:

- module declarations
- `depends` relationships
- module paths
- enabled or disabled state
- route prefixes
- public module boundaries
- module dependency metadata

A normal local workflow is:

```bash
vix modules check
vix build
```

For broader project validation:

```bash
vix modules check
vix check --tests --run
```

## What the module graph check validates

For `vix.app` projects, Vix builds one validated module graph from the module declarations.

It verifies the identity, path, active state, and dependency relationships of the declared modules before the graph is used for project resolution and generated CMake integration.

### Unknown dependencies

A module cannot depend on a module that is not declared.

```toml
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

If `auth` has no module declaration, the graph is invalid.

Declare the missing module:

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

### Self-dependencies

A module cannot depend on itself.

Invalid:

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = [
  "auth",
]
```

A self-dependency does not add useful architecture and would make the graph invalid.

### Enabled modules depending on disabled modules

An enabled module cannot require a disabled module.

```toml
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

Here `projects` is active while `auth` is not.

Enable the required module:

```bash
vix modules enable auth
```

or disable the dependent feature:

```bash
vix modules disable projects
```

The active graph must be complete.

### Dependency cycles

Module dependencies must form an acyclic graph.

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = [
  "projects",
]

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This produces:

```text
auth -> projects -> auth
```

Vix reports the cycle instead of producing a dependency order from an invalid graph.

A common fix is to move shared behavior into a lower-level module.

```text
identity
  ^     ^
  |     |
auth  projects
```

The correct design depends on the application, but the graph must have a clear direction.

### Module identity collisions

Different module names can normalize to the same generated CMake identity.

For example:

```text
foo-bar
foo_bar
```

These names cannot safely coexist when they would produce the same generated target identity.

Case-only collisions are also rejected when they would make module identity ambiguous.

```text
Auth
auth
```

Choose module names that remain distinct after normalization.

### Invalid or duplicate module paths

A module path must identify a valid module directory inside the project.

Vix rejects unsafe or conflicting path declarations, including different modules that resolve to the same effective module location.

For example, two declarations must not both represent:

```text
modules/auth
```

The graph should provide one unambiguous module identity for each module directory.

### Missing module files

An enabled module needs the files required by the module system.

```text
modules/auth/
  CMakeLists.txt
  vix.module
```

If an enabled module cannot be loaded because its directory or required metadata is missing, validation fails before generated project integration relies on it.

This often happens after a manual move, an incomplete merge, or editing `vix.app` without creating the module.

For a new module, prefer:

```bash
vix modules add auth
```

Then run:

```bash
vix modules check
```

## Dependency order

A valid module graph has a deterministic dependency-first order.

For:

```text
auth
  ^
  |
projects
  ^
  |
builds
```

the dependency order is:

```text
auth
projects
builds
```

This order is derived from the validated graph rather than from the physical order of module declarations in `vix.app`.

The exact declaration order can therefore remain focused on readability while dependency relationships determine the graph order.

## Route prefix conflicts

Routed modules can declare a route prefix in `vix.module`.

```toml
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

Two active routed modules should not claim the same prefix.

```text
auth   -> /api/auth
users  -> /api/auth
```

`vix modules check` reports the conflict so HTTP route ownership remains unambiguous.

Prefer prefixes that reflect module responsibility:

```text
auth      -> /api/auth
projects  -> /api/projects
builds    -> /api/builds
packages  -> /api/packages
```

The prefix describes the module's route namespace. The module code still performs the actual route registration.

## Public and private module boundaries

Vix also checks module boundary rules around public headers and implementation files.

Public headers belong under exported include directories:

```text
modules/auth/include/auth/
```

Private implementation belongs under:

```text
modules/auth/src/
```

A public header from another module may include:

```cpp
#include <auth/api.hpp>
```

but should not reach into:

```cpp
#include "../../auth/src/AuthStore.hpp"
```

Cross-module public includes should correspond to explicit module target dependencies. This prevents accidental success caused by leaked include paths.

## CMake-first projects

In a CMake-first project, CMake remains the source of truth for which module targets are loaded and linked.

Keep module relationships explicit:

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

`vix modules check` can still validate module layout and boundary rules that are visible from the project structure. Commands that modify `vix.app` module activation, such as `enable` and `disable`, apply to projects that use module declarations in `vix.app`.

## Dependency mutations are transactional

Commands that change project dependency state publish their metadata through one project mutation boundary.

This includes workflows such as:

```bash
vix add gk/jwt@^1.0.0 --module auth
```

and:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth
```

Vix prepares and validates the prospective state before authoritative metadata is published. If resolution, materialization, or metadata publication fails, the previous manifest and lock state is preserved.

This matters for module dependencies because one user action can affect both a module manifest and the root dependency state. A failed command should not leave one file updated while the other still describes the old graph.

Project mutations are also serialized so concurrent Vix commands cannot silently overwrite the same project metadata.

## Recommended workflow

After changing the module graph:

```bash
vix modules check
vix build
```

After adding a Registry dependency to one module:

```bash
vix add gk/jwt@^1.0.0 --module auth
vix modules check
vix build
```

After adding a direct Git dependency to one module:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth

vix modules check
vix build
```

Before committing a broader project change:

```bash
vix modules check
vix check --tests --run
```

For CMake projects with a custom project prefix, pass it when needed:

```bash
vix modules check --project api
```

## Common mistakes

A module dependency in `vix.app` and an external dependency in `vix.module` are different relationships.

Use `depends` for another application module:

```toml
[module.projects]
depends = [
  "auth",
]
```

Use `[deps]` or `[dependencies.<name>]` for external packages owned by the module.

Do not create per-module lockfiles or caches. Module dependency ownership is part of the application dependency graph, while exact dependency resolution remains in the root `vix.lock`.

Do not rely on declaration order to resolve conflicts. Active dependency requirements must be compatible.

Do not use sibling include paths as a substitute for declaring a module dependency.

## Next step

Continue with the CLI workflow to see how module creation, dependency installation, validation, enabling, and disabling fit together.

[CLI Workflow](/app-modules/cli-workflow)
